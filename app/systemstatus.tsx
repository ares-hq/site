// System status — lightweight client-side reachability + Cloudflare status board.
import { usePageTitleContext } from '@/app/_layout';
import { Reveal, webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { PageHeader } from '@/components/shared/ui';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

type Health = 'checking' | 'operational' | 'degraded' | 'down';

type ServiceConfig = {
  name: string;
  url: string;
  blurb: string;
  /** `probe` = can we reach it at all (opaque no-cors fetch); `statuspage` = read a Statuspage v2 summary. */
  kind: 'probe' | 'statuspage';
  statusApi?: string;
  timeout?: number;
};

type ServiceState = {
  name: string;
  url: string;
  blurb: string;
  health: Health;
  detail: string;
  responseMs: number | null;
  lastChecked: number | null;
  history: boolean[]; // most-recent last
};

const SERVICES: ServiceConfig[] = [
  {
    name: 'ARES site',
    url: 'https://ares-bot.com',
    blurb: 'The web app you are looking at.',
    kind: 'probe',
    timeout: 9000,
  },
  {
    name: 'ARES API',
    url: 'https://api.ares-bot.com',
    blurb: 'Query layer for team, event and match data.',
    kind: 'probe',
    timeout: 8000,
  },
  {
    name: 'ARES Studio',
    url: 'https://studio.ares-bot.com',
    blurb: 'Supabase project backing the API.',
    kind: 'probe',
    timeout: 8000,
  },
  {
    name: 'Cloudflare',
    url: 'https://www.cloudflarestatus.com',
    blurb: 'CDN and DNS in front of every ARES service.',
    kind: 'statuspage',
    statusApi: 'https://www.cloudflarestatus.com/api/v2/status.json',
    timeout: 7000,
  },
];

const REFRESH_MS = 120_000;
const MAX_HISTORY = 30;
const isWeb = Platform.OS === 'web';

/** Reach an arbitrary origin from the browser without tripping CORS. */
async function probe(cfg: ServiceConfig): Promise<Pick<ServiceState, 'health' | 'detail' | 'responseMs'>> {
  const start = performance.now();
  try {
    await fetch(cfg.url, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(cfg.timeout ?? 8000),
    });
    const responseMs = Math.round(performance.now() - start);
    // An opaque response only tells us the host answered — that's all we need here.
    return {
      health: responseMs > 4000 ? 'degraded' : 'operational',
      detail: responseMs > 4000 ? 'Responding slowly' : 'Reachable',
      responseMs,
    };
  } catch (err) {
    const responseMs = Math.round(performance.now() - start);
    const name = err instanceof Error ? err.name : '';
    if (name === 'TimeoutError') return { health: 'down', detail: 'Request timed out', responseMs: null };
    return { health: 'down', detail: 'Unreachable from your network', responseMs: responseMs || null };
  }
}

/** Read a Statuspage.io v2 summary — these endpoints send permissive CORS headers. */
async function readStatuspage(
  cfg: ServiceConfig,
): Promise<Pick<ServiceState, 'health' | 'detail' | 'responseMs'>> {
  const start = performance.now();
  try {
    const res = await fetch(cfg.statusApi!, {
      cache: 'no-store',
      signal: AbortSignal.timeout(cfg.timeout ?? 7000),
    });
    const responseMs = Math.round(performance.now() - start);
    if (!res.ok) return { health: 'degraded', detail: `Status API HTTP ${res.status}`, responseMs };
    const json = (await res.json()) as { status?: { indicator?: string; description?: string } };
    const indicator = (json.status?.indicator ?? 'none').toLowerCase();
    const description = json.status?.description ?? 'Operational';
    const health: Health =
      indicator === 'none'
        ? 'operational'
        : indicator === 'minor'
          ? 'degraded'
          : indicator === 'major' || indicator === 'critical'
            ? 'down'
            : 'operational';
    return { health, detail: description, responseMs };
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    // Can't read the status feed — that's our problem, not necessarily Cloudflare's.
    return {
      health: 'degraded',
      detail: name === 'TimeoutError' ? 'Status feed timed out' : 'Status feed unavailable',
      responseMs: null,
    };
  }
}

const LABEL: Record<Health, string> = {
  checking: 'Checking…',
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
};

export default function SystemStatusScreen() {
  const t = useTheme();
  const { setPageTitleInfo } = usePageTitleContext();
  const { width } = useWindowDimensions();
  const twoCol = width > 640;
  const amber = t.isDark ? '#FBBF24' : '#D97706';

  const color = useCallback(
    (h: Health) =>
      h === 'operational'
        ? t.c.success
        : h === 'degraded'
          ? amber
          : h === 'down'
            ? t.c.danger
            : t.c.textFaint,
    [t, amber],
  );

  const [services, setServices] = useState<ServiceState[]>(() =>
    SERVICES.map((s) => ({
      name: s.name,
      url: s.url,
      blurb: s.blurb,
      health: 'checking',
      detail: '',
      responseMs: null,
      lastChecked: null,
      history: [],
    })),
  );
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const busyRef = useRef(false);

  useEffect(() => setPageTitleInfo({ customSuffix: 'System status' }), [setPageTitleInfo]);

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const results = await Promise.all(
      SERVICES.map(async (cfg) => ({
        name: cfg.name,
        r: cfg.kind === 'statuspage' ? await readStatuspage(cfg) : await probe(cfg),
      })),
    );
    const now = Date.now();
    setServices((prev) =>
      prev.map((s) => {
        const hit = results.find((x) => x.name === s.name);
        if (!hit) return s;
        const history = [...s.history, hit.r.health === 'operational'].slice(-MAX_HISTORY);
        return { ...s, ...hit.r, lastChecked: now, history };
      }),
    );
    setUpdatedAt(now);
    setCountdown(REFRESH_MS / 1000);
    setBusy(false);
    busyRef.current = false;
  }, []);

  useEffect(() => {
    refresh();
    const tick = setInterval(refresh, REFRESH_MS);
    const clock = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => {
      clearInterval(tick);
      clearInterval(clock);
    };
  }, [refresh]);

  const overall = useMemo<{ health: Health; label: string }>(() => {
    if (services.some((s) => s.health === 'checking')) return { health: 'checking', label: 'Checking systems…' };
    if (services.some((s) => s.health === 'down')) return { health: 'down', label: 'Service disruption' };
    if (services.some((s) => s.health === 'degraded')) return { health: 'degraded', label: 'Partial degradation' };
    return { health: 'operational', label: 'All systems operational' };
  }, [services]);

  const fmtMs = (ms: number | null) => (ms == null ? '—' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);
  const uptime = (h: boolean[]) => (h.length ? Math.round((h.filter(Boolean).length / h.length) * 100) : null);
  const ago = (ts: number | null) => {
    if (!ts) return 'never';
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    return `${Math.round(s / 3600)}h ago`;
  };

  return (
    <View style={styles.content}>
      <PageHeader
        title="System status"
        subtitle="Live reachability checks, run from your browser every two minutes."
      />

      <Reveal>
        <View style={[styles.overall, { borderColor: t.c.border, backgroundColor: t.c.bgSubtle }]}>
          <View style={[styles.pulse, { backgroundColor: color(overall.health) }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.overallText, { color: t.c.text }]}>{overall.label}</Text>
            <Text style={[styles.overallMeta, { color: t.c.textFaint }]}>
              {updatedAt ? `Updated ${ago(updatedAt)}` : 'Running first check…'} · next refresh in {countdown}s
            </Text>
          </View>
          <Pressable
            onPress={refresh}
            disabled={busy}
            style={[
              styles.refreshBtn,
              webTransition(),
              { borderColor: t.c.border, backgroundColor: t.c.surface, opacity: busy ? 0.5 : 1 },
              isWeb && ({ cursor: busy ? 'default' : 'pointer' } as any),
            ]}
          >
            <Feather name="refresh-cw" size={13} color={t.c.textMuted} />
            <Text style={[styles.refreshText, { color: t.c.textMuted }]}>{busy ? 'Checking' : 'Refresh'}</Text>
          </Pressable>
        </View>
      </Reveal>

      <View style={styles.grid}>
        {services.map((s, i) => {
          const up = uptime(s.history);
          return (
            <Reveal
              key={s.name}
              delay={Math.min(i, 4) * 60}
              offset={22}
              style={[styles.gridItem, { width: twoCol ? '50%' : '100%' }]}
            >
              <View style={[styles.card, { borderColor: t.c.border, backgroundColor: t.c.surface }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Pressable
                      onPress={() => Linking.openURL(s.url)}
                      style={isWeb ? ({ cursor: 'pointer' } as any) : undefined}
                    >
                      <Text style={[styles.cardName, { color: t.c.text }]} numberOfLines={1}>
                        {s.name}
                        <Text style={{ color: t.c.textFaint }}>  ↗</Text>
                      </Text>
                    </Pressable>
                    <Text style={[styles.cardBlurb, { color: t.c.textFaint }]} numberOfLines={2}>
                      {s.blurb}
                    </Text>
                  </View>
                  <View style={[styles.badge, { borderColor: color(s.health), backgroundColor: t.c.bgSubtle }]}>
                    <View style={[styles.dot, { backgroundColor: color(s.health) }]} />
                    <Text style={[styles.badgeText, { color: color(s.health) }]}>{LABEL[s.health]}</Text>
                  </View>
                </View>

                <View style={[styles.spark, { borderColor: t.c.hairline }]}>
                  {Array.from({ length: MAX_HISTORY }).map((_, idx) => {
                    const offset = idx - (MAX_HISTORY - s.history.length);
                    const v = offset >= 0 ? s.history[offset] : undefined;
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.sparkBar,
                          {
                            backgroundColor:
                              v === undefined ? t.c.hairline : v ? t.c.success : t.c.danger,
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                <View style={styles.metrics}>
                  <Metric label="Response" value={fmtMs(s.responseMs)} t={t} />
                  <Metric label="Uptime (session)" value={up == null ? '—' : `${up}%`} t={t} />
                  <Metric label="Checked" value={ago(s.lastChecked)} t={t} />
                </View>

                {!!s.detail && s.health !== 'checking' && (
                  <Text style={[styles.detail, { color: s.health === 'operational' ? t.c.textFaint : color(s.health) }]}>
                    {s.detail}
                  </Text>
                )}
              </View>
            </Reveal>
          );
        })}
      </View>

      <Text style={[styles.note, { color: t.c.textFaint }]}>
        These checks run in your browser, so a service marked down may just be blocked by your network or an
        extension. ARES services are reached with an opaque request — we can tell the host answered, not what it
        returned. Cloudflare reads the official{' '}
        <Text
          style={{ color: t.c.accentText, ...(isWeb ? { cursor: 'pointer' } as any : {}) }}
          onPress={() => Linking.openURL('https://www.cloudflarestatus.com')}
        >
          cloudflarestatus.com
        </Text>{' '}
        feed. Session uptime resets on reload.
      </Text>
    </View>
  );
}

function Metric({ label, value, t }: { label: string; value: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: t.c.textFaint }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: t.c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  overall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  pulse: { width: 12, height: 12, borderRadius: 6 },
  overallText: { fontSize: 16, fontWeight: '700' },
  overallMeta: { fontSize: 12, marginTop: 3 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: { fontSize: 12.5, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { padding: 6 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12, height: '100%' },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardName: { fontSize: 15, fontWeight: '700' },
  cardBlurb: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
  spark: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 22,
    borderBottomWidth: 1,
    paddingBottom: 3,
  },
  sparkBar: { flex: 1, height: '100%', borderRadius: 1, minWidth: 2 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  metric: { minWidth: 72 },
  metricLabel: { fontSize: 10.5, fontWeight: '600', marginBottom: 2 },
  metricValue: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  detail: { fontSize: 11.5, lineHeight: 16 },
  note: { fontSize: 11.5, lineHeight: 17, marginTop: 20, maxWidth: 640 },
});
