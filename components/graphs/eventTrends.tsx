import { MatchInfo } from '@/api/utils/types';
import { useTheme } from '@/components/shared/theme';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Area,
  Bar,
  BarChart,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

interface Props {
  matches: MatchInfo[];
}

export default function EventTrends({ matches }: Props) {
  const t = useTheme();
  const c = t.c;

  const { histogram, mean, timeline } = useMemo(() => {
    const scored: number[] = [];
    for (const m of matches) {
      if (m.matchType === 'PRACTICE') continue;
      for (const a of [m.redAlliance, m.blueAlliance]) {
        const p = a?.totalPoints ?? 0;
        if (Number.isFinite(p)) scored.push(p);
      }
    }
    const max = scored.length ? Math.max(...scored) : 0;
    const avg = scored.length ? scored.reduce((s, n) => s + n, 0) / scored.length : 0;

    // 6 evenly-sized buckets on a "nice" step
    const BUCKETS = 6;
    const step = Math.max(25, Math.ceil(max / BUCKETS / 25) * 25);
    const hist = Array.from({ length: BUCKETS }, (_, i) => ({ range: `${i * step}–${(i + 1) * step}`, count: 0 }));
    for (const s of scored) hist[Math.min(BUCKETS - 1, Math.floor(s / step))].count += 1;

    // every match in play order: high / low / average alliance score
    const ordered = matches
      .filter((m) => m.matchType !== 'PRACTICE')
      .slice()
      .sort((a, b) => {
        const d = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (d) return d;
        const ta = a.matchType === 'QUALIFICATION' ? 0 : 1;
        const tb = b.matchType === 'QUALIFICATION' ? 0 : 1;
        if (ta !== tb) return ta - tb;
        return parseInt(a.matchNumber, 10) - parseInt(b.matchNumber, 10);
      });
    const tl = ordered.map((m, i) => {
      const r = m.redAlliance?.totalPoints ?? 0;
      const bl = m.blueAlliance?.totalPoints ?? 0;
      return {
        i: i + 1,
        label: `${m.matchType === 'QUALIFICATION' ? 'Q' : 'P'}${m.matchNumber}`,
        hi: Math.max(r, bl),
        lo: Math.min(r, bl),
        avg: +((r + bl) / 2).toFixed(1),
      };
    });

    return { histogram: hist, mean: avg, timeline: tl };
  }, [matches]);

  const DistTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <View style={[styles.tip, { backgroundColor: c.raised, borderColor: c.border }]}>
        <Text style={[styles.tipText, { color: c.text }]}>{d.range} pts</Text>
        <Text style={[styles.tipSub, { color: c.textMuted }]}>{d.count} alliance{d.count === 1 ? '' : 's'}</Text>
      </View>
    );
  };
  const TlTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <View style={[styles.tip, { backgroundColor: c.raised, borderColor: c.border }]}>
        <Text style={[styles.tipText, { color: c.text }]}>{d.label}</Text>
        <Text style={[styles.tipSub, { color: c.accentText }]}>avg {d.avg.toFixed(0)}</Text>
        <Text style={[styles.tipSub, { color: c.textMuted }]}>high {d.hi} · low {d.lo}</Text>
      </View>
    );
  };

  const axisTick = { fontSize: 10, fill: c.textFaint, fontFamily: CHART_FONT };

  return (
    <View style={styles.row}>
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Alliance score distribution</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>How often alliances landed in each score range · avg {mean.toFixed(0)}</Text>
        <View style={styles.chartArea}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 8, right: 6, bottom: 0, left: -18 }} barCategoryGap="16%">
              <XAxis dataKey="range" interval={0} tick={{ ...axisTick, fontSize: 8.5 }} axisLine={false} tickLine={false} tickMargin={6} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} tickCount={4} />
              <Tooltip cursor={{ fill: 'transparent' }} content={<DistTip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill={c.accent} />
            </BarChart>
          </ResponsiveContainer>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.title, { color: c.text }]}>Match scores over the event</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Average alliance score per match, in play order</Text>
        <View style={styles.chartArea}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="tlFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.accent} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="i"
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                interval={timeline.length > 8 ? Math.ceil(timeline.length / 6) : 0}
                tickMargin={6}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} tickCount={4} />
              <Tooltip cursor={{ stroke: c.borderStrong, strokeDasharray: '3 3' }} content={<TlTip />} />
              {mean > 0 && <ReferenceLine y={mean} stroke={c.textFaint} strokeDasharray="4 4" />}
              <Line type="monotone" dataKey="hi" stroke={c.hairline} strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="lo" stroke={c.hairline} strokeWidth={1} dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="avg" stroke="none" fill="url(#tlFill)" isAnimationActive={false} />
              <Line type="monotone" dataKey="avg" stroke={c.accent} strokeWidth={2.4} dot={false} isAnimationActive animationDuration={650} />
            </ComposedChart>
          </ResponsiveContainer>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 4 },
  card: { flex: 1, minWidth: 260, height: 300, borderWidth: 1, borderRadius: 16, padding: 16 },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  sub: { fontSize: 11.5, marginTop: 3, marginBottom: 6 },
  chartArea: { flex: 1, minHeight: 0 },
  tip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  tipText: { fontSize: 12, fontWeight: '700' },
  tipSub: { fontSize: 11, marginTop: 1 },
});
