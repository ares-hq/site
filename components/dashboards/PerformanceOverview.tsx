import { getTeamCount } from '@/api/dashboardInfo';
import { AllianceInfo, SupportedYear, TeamInfo } from '@/api/utils/types';
import { useCountUp } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type AvgOPR = { autoOPR: number; teleOPR: number; endgameOPR: number; overallOPR: number } | null;

interface Props {
  teamInfo: TeamInfo;
  matches: AllianceInfo[] | null;
  wins: number;
  year: number;
  screenWidth: number;
  averageOPR?: AvgOPR;
}

export default function PerformanceOverview({ teamInfo, matches, wins, year, screenWidth, averageOPR }: Props) {
  const t = useTheme();
  const c = t.c;
  const [teamCount, setTeamCount] = useState(60);
  const narrow = screenWidth > 0 && screenWidth < 520;
  const showOprCol = !(screenWidth > 0 && screenWidth < 430);
  const cw = narrow ? 58 : 68;
  const dw = narrow ? 74 : 86;

  useEffect(() => {
    let cancelled = false;
    getTeamCount(year as SupportedYear)
      .then((n) => !cancelled && n > 1 && setTeamCount(n))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [year]);

  const pctFromRank = useMemo(
    () => (rank?: number | null) => {
      if (rank == null || rank <= 0) return null;
      const p = (1 - (rank - 1) / Math.max(1, teamCount - 1)) * 100;
      const f = Math.max(0, Math.floor(p));
      return f >= 100 ? 99 : f;
    },
    [teamCount],
  );

  const played = matches?.length ?? 0;
  const losses = Math.max(0, played - wins);
  const winPct = played ? Math.round((wins / played) * 100) : 0;
  const penaltyValue = teamInfo.penalties ? Number(String(teamInfo.penalties).replace(/[^0-9.-]+/g, '')) : null;
  const place = teamInfo.averagePlace;
  const placeTag =
    place == null ? null
    : place <= 5 ? { label: 'Elite', color: c.success }
    : place <= 10 ? { label: 'Strong', color: c.success }
    : place <= 20 ? { label: 'Mid', color: c.textMuted }
    : { label: 'Low', color: c.danger };

  const tint = {
    overall: c.accent,
    auto: t.isDark ? '#A78BFA' : '#7C3AED',
    tele: t.isDark ? '#FBBF24' : '#D97706',
    end: t.isDark ? '#2DD4BF' : '#0D9488',
  };
  const rows = [
    { key: 'Overall', rank: teamInfo.overallRank, opr: teamInfo.overallOPR, field: averageOPR?.overallOPR, lead: true, tint: tint.overall },
    { key: 'Auto', rank: teamInfo.autoRank, opr: teamInfo.autoOPR, field: averageOPR?.autoOPR, tint: tint.auto },
    { key: 'TeleOp', rank: teamInfo.teleRank, opr: teamInfo.teleOPR, field: averageOPR?.teleOPR, tint: tint.tele },
    { key: 'Endgame', rank: teamInfo.endgameRank, opr: teamInfo.endgameOPR, field: averageOPR?.endgameOPR, tint: tint.end },
  ];

  const stats: { label: string; value: number; decimals?: number; suffix?: string; render?: React.ReactNode }[] = [
    { label: 'Events', value: eventsAttended(teamInfo) },
    { label: 'Matches', value: played },
    { label: 'Record', value: wins, render: <RecordText wins={wins} losses={losses} c={c} /> },
    { label: 'Win rate', value: winPct, suffix: '%' },
    { label: 'Avg place', value: place ?? 0, render: <PlaceText place={place} tag={placeTag} c={c} /> },
    { label: 'Penalty OPR', value: penaltyValue != null && !isNaN(penaltyValue) ? penaltyValue : 0, decimals: 1 },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.statStrip}>
        {stats.map((s, i) => (
          <View
            key={s.label}
            style={[
              styles.statCell,
              narrow ? { flexBasis: '30%' } : null,
              i > 0 && !(narrow && i % 3 === 0) ? { borderLeftWidth: 1, borderLeftColor: c.border } : null,
            ]}
          >
            <Text style={[styles.statLabel, { color: c.textMuted }]}>{s.label}</Text>
            {s.render ?? <AnimatedStat value={s.value} decimals={s.decimals} suffix={s.suffix} color={c.text} />}
          </View>
        ))}
      </View>

      <View style={styles.tableWrap}>
        <Text style={[styles.tableTitle, { color: c.text }]}>Season ranks</Text>
        <View style={[styles.tRow, styles.tHead, { borderBottomColor: c.border }]}>
          <View style={styles.tPhase}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: c.textFaint }}>Phase</Text>
          </View>
          <Text style={[styles.th, { width: cw, color: c.textFaint }]}>Rank</Text>
          <Text style={[styles.th, { width: cw, color: c.textFaint }]}>Pctl</Text>
          {showOprCol && <Text style={[styles.th, { width: cw, color: c.textFaint }]}>OPR</Text>}
          <Text style={[styles.th, { width: dw, color: c.textFaint }]}>Δ</Text>
        </View>
        {rows.map((r, idx) => {
          const pct = pctFromRank(r.rank);
          const d = typeof r.opr === 'number' && typeof r.field === 'number' ? r.opr - r.field : null;
          return (
            <View
              key={r.key}
              style={[
                styles.tRow,
                idx !== rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                idx % 2 === 1 && { backgroundColor: c.bgSubtle },
              ]}
            >
              <View style={[styles.rowBar, { backgroundColor: r.tint }]} />
              <View style={styles.tPhase}>
                <Text style={[styles.tPhaseTxt, { color: c.text, fontWeight: r.lead ? '800' : '600' }]}>{r.key}</Text>
              </View>
              <Text style={[styles.tCell, { width: cw, color: c.text }]}>{r.rank ? `#${r.rank}` : '—'}</Text>
              <Text style={[styles.tCell, { width: cw, color: c.textMuted }]}>{pct == null ? '—' : `P${pct}`}</Text>
              {showOprCol && (
                <Text style={[styles.tCell, { width: cw, color: c.textMuted }]}>{typeof r.opr === 'number' ? r.opr.toFixed(1) : '—'}</Text>
              )}
              <View style={[styles.tDelta, { width: dw }]}>
                {d == null ? (
                  <Text style={{ color: c.textFaint, fontSize: 12.5 }}>—</Text>
                ) : (
                  <>
                    <Feather name={d >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={11} color={d >= 0 ? c.success : c.danger} />
                    <Text style={{ color: d >= 0 ? c.success : c.danger, fontSize: 12.5, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                      {Math.abs(d).toFixed(1)}
                    </Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
        <Text style={[styles.caption, { color: c.textFaint }]}>
          Pctl = season percentile among {teamCount} ranked teams · Δ = OPR gap to the average.
        </Text>
      </View>
    </View>
  );
}

function AnimatedStat({ value, decimals = 0, suffix, color }: { value: number; decimals?: number; suffix?: string; color: string }) {
  const shown = useCountUp(value, { decimals });
  return (
    <Text style={[styles.statVal, { color }]}>
      {shown.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix ?? ''}
    </Text>
  );
}

function RecordText({ wins, losses, c }: { wins: number; losses: number; c: any }) {
  return (
    <Text style={[styles.statVal, { color: c.text }]}>
      {wins}
      <Text style={{ color: c.textFaint, fontSize: 13, fontWeight: '600' }}> – {losses}</Text>
    </Text>
  );
}

function PlaceText({ place, tag, c }: { place?: number | null; tag: { label: string; color: string } | null; c: any }) {
  const [open, setOpen] = useState(false);
  const tiers = [
    { label: 'Elite', range: 'avg place ≤ 5', color: c.success },
    { label: 'Strong', range: '6 – 10', color: c.success },
    { label: 'Mid', range: '11 – 20', color: c.textMuted },
    { label: 'Low', range: '21+', color: c.danger },
  ];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={[styles.statVal, { color: c.text }]}>{place ?? '—'}</Text>
      {tag && (
        <View style={{ position: 'relative', zIndex: 200 }}>
          <Pressable
            onHoverIn={() => setOpen(true)}
            onHoverOut={() => setOpen(false)}
            onPress={() => setOpen((v) => !v)}
            style={[styles.pill, { borderColor: tag.color }, Platform.OS === 'web' ? ({ cursor: 'help' } as any) : null]}
          >
            <Text style={{ color: tag.color, fontSize: 10, fontWeight: '700' }}>{tag.label}</Text>
          </Pressable>
          {open && (
            <View style={[styles.tierPop, { backgroundColor: c.raised, borderColor: c.borderStrong }]}>
              <Text style={[styles.tierHead, { color: c.textMuted }]}>Placement tier — from average finish</Text>
              {tiers.map((ti) => {
                const active = ti.label === tag.label;
                return (
                  <View key={ti.label} style={styles.tierRow}>
                    <View style={[styles.tierDot, { backgroundColor: ti.color }]} />
                    <Text style={[styles.tierName, { color: active ? c.text : c.textMuted, fontWeight: active ? '800' : '500' }]}>
                      {ti.label}
                    </Text>
                    <Text style={[styles.tierRange, { color: c.textFaint }]}>{ti.range}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function eventsAttended(teamInfo: TeamInfo): number {
  const ev = teamInfo.eventsAttended as unknown;
  if (typeof ev === 'string') return ev.replace(/[[\]\s]/g, '').split(',').filter(Boolean).length;
  if (typeof ev === 'number') return ev;
  return teamInfo.events?.length ?? 0;
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  statStrip: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, position: 'relative', zIndex: 50 },
  statCell: { flexGrow: 1, flexBasis: 100, paddingHorizontal: 14, gap: 3 },
  statLabel: { fontSize: 11.5, fontWeight: '500' },
  statVal: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },

  tableWrap: { marginTop: 4 },
  tableTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10 },
  tRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  rowBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  tHead: { minHeight: 0, paddingBottom: 9, borderBottomWidth: 1 },
  th: { paddingHorizontal: 7, textAlign: 'right', fontSize: 11, fontWeight: '700' },
  tPhase: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7 },
  tPhaseTxt: { fontSize: 13, fontWeight: '600' },
  tCell: { paddingHorizontal: 7, textAlign: 'right', fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  tDelta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 2, paddingHorizontal: 7 },
  caption: { fontSize: 10.5, marginTop: 10 },
  pill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 999, borderWidth: 1 },
  tierPop: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: 6,
    minWidth: 190,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 5,
    zIndex: 300,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 18px 44px rgba(15,23,42,0.28)' } as any)
      : { elevation: 12, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 10 } }),
  },
  tierHead: { fontSize: 10.5, fontWeight: '700', marginBottom: 2 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  tierDot: { width: 7, height: 7, borderRadius: 2 },
  tierName: { fontSize: 12, flex: 0, width: 46 },
  tierRange: { fontSize: 11, fontVariant: ['tabular-nums'] },
});
