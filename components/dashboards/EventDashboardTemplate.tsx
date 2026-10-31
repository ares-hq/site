import { calculateAllOPRs } from '@/api/algorithms/calcOPR';
import { getAverageOPRs, getEventistoricalData } from '@/api/dashboardInfo';
import { getEventData } from '@/api/event-service';
import { EventInfo, MatchInfo, SupportedYear } from '@/api/utils/types';
import { DEFAULT_SEASON, routeFromSeason } from '@/api/utils/seasons';
import { usePageTitleContext } from '@/app/_layout';
import EventTrends from '@/components/graphs/eventTrends';
import { DashboardSkeleton } from '@/components/shared/Skeleton';
import { StatCard } from '@/components/shared/StatCard';
import { Cell, CellView, HeadCell, TableEmpty, TableHead, TableRow, TableShell } from '@/components/shared/Table';
import { useTheme } from '@/components/shared/theme';
import { CollapsibleSection, PageHeader } from '@/components/shared/ui';
import EventMatchCard from '@/components/teamInfo/eventMatchCard';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Caret from '../../assets/icons/caret-up-down-bold.svg';

const GAME_NAMES: Record<SupportedYear, string> = {
  2019: 'Skystone',
  2020: 'Ultimate Goal',
  2021: 'Freight Frenzy',
  2022: 'Power Play',
  2023: 'Centerstage',
  2024: 'Into the Deep',
  2025: 'Decode',
  2026: 'BioBuzz',
};

type RankRow = {
  teamNumber: number;
  teamName: string;
  opr: number;
  auto: number;
  tele: number;
  endgame: number;
  played: number;
  wins: number;
  losses: number;
  avg: number;
};

type SortKey = 'opr' | 'avg' | 'wins' | 'auto' | 'tele' | 'endgame';

function alliancesOf(m: MatchInfo) {
  return [m.redAlliance, m.blueAlliance];
}

export const EventDashboardTemplate = ({ seasonYear: propSeasonYear }: { seasonYear?: SupportedYear }) => {
  const t = useTheme();
  const { width: winW } = useWindowDimensions();
  const wideCols = winW > 760; // room for per-phase OPR columns
  const showAvg = winW > 560;
  const params = useLocalSearchParams();
  const { setPageTitleInfo } = usePageTitleContext();
  const eventCode = Array.isArray(params.eventCode) ? params.eventCode[0] : params.eventCode;
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const focusMatch = Array.isArray(params.match) ? params.match[0] : params.match;
  const seasonYear: SupportedYear = ((yearParam ? parseInt(yearParam) : propSeasonYear) as SupportedYear) || DEFAULT_SEASON;

  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [availableYears, setAvailableYears] = useState<SupportedYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [seasonAvg, setSeasonAvg] = useState<{ autoOPR: number; teleOPR: number; endgameOPR: number; overallOPR: number } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('opr');

  useEffect(() => {
    if (eventCode) setPageTitleInfo({ customSuffix: `${eventCode} (${GAME_NAMES[seasonYear]})` });
  }, [eventCode, seasonYear, setPageTitleInfo]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!eventCode) return;
        const historical = await getEventistoricalData(eventCode);
        if (cancelled) return;
        const years: SupportedYear[] = [];
        historical.forEach((d, y) => d !== null && years.push(y as SupportedYear));
        years.sort((a, b) => b - a);
        setAvailableYears(years);
      } catch (err) {
        console.error('event years:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventCode]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    (async () => {
      try {
        const [full, avg] = await Promise.all([getEventData(eventCode, seasonYear), getAverageOPRs(seasonYear)]);
        if (cancelled) return;
        if (!full || !full.matches || full.matches.length === 0) {
          setFailed(true);
        } else {
          setEventInfo(full);
          setSeasonAvg(avg);
        }
      } catch (err) {
        console.error('event data:', err);
        setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventCode, seasonYear]);

  const metrics = useMemo(() => {
    const matches = eventInfo?.matches ?? [];
    const nonPractice = matches.filter((m) => m.matchType !== 'PRACTICE');
    const qual = matches.filter((m) => m.matchType === 'QUALIFICATION');
    const playoff = matches.filter((m) => m.matchType === 'PLAYOFF');

    const qualPoints: number[] = [];
    let topScore = 0;
    for (const m of nonPractice) {
      for (const a of alliancesOf(m)) {
        const p = a.totalPoints ?? 0;
        if (p > topScore) topScore = p;
        if (m.matchType === 'QUALIFICATION') qualPoints.push(p);
      }
    }
    const avgQual = qualPoints.length ? qualPoints.reduce((s, n) => s + n, 0) / qualPoints.length : 0;

    // per-team record from qual matches
    const tally = new Map<number, { name: string; played: number; wins: number; pts: number }>();
    for (const m of qual) {
      for (const a of alliancesOf(m)) {
        for (const team of [a.team_1, a.team_2]) {
          if (!team?.teamNumber) continue;
          const cur = tally.get(team.teamNumber) ?? { name: team.teamName || `Team ${team.teamNumber}`, played: 0, wins: 0, pts: 0 };
          cur.played += 1;
          cur.wins += a.win ? 1 : 0;
          cur.pts += a.totalPoints ?? 0;
          tally.set(team.teamNumber, cur);
        }
      }
    }

    const meanOf = (map: Map<number, number>) => {
      const vals = Array.from(map.values()).filter((v) => Number.isFinite(v));
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 0;
    };
    const phaseMatches = (phase: 'auto' | 'tele' | 'endgame') =>
      qual.map((m) => ({
        ...m,
        redAlliance: { ...m.redAlliance, totalPoints: ((m.redAlliance as any)[phase] ?? 0) + (m.blueAlliance.penalty ?? 0) },
        blueAlliance: { ...m.blueAlliance, totalPoints: ((m.blueAlliance as any)[phase] ?? 0) + (m.redAlliance.penalty ?? 0) },
      })) as MatchInfo[];

    const oprMap = calculateAllOPRs(qual);
    const empty = new Map<number, number>();
    const oprAuto = qual.length ? calculateAllOPRs(phaseMatches('auto')) : empty;
    const oprTele = qual.length ? calculateAllOPRs(phaseMatches('tele')) : empty;
    const oprEnd = qual.length ? calculateAllOPRs(phaseMatches('endgame')) : empty;

    const rows: RankRow[] = Array.from(tally.entries()).map(([teamNumber, v]) => ({
      teamNumber,
      teamName: v.name,
      opr: oprMap.get(teamNumber) ?? 0,
      auto: oprAuto.get(teamNumber) ?? 0,
      tele: oprTele.get(teamNumber) ?? 0,
      endgame: oprEnd.get(teamNumber) ?? 0,
      played: v.played,
      wins: v.wins,
      losses: v.played - v.wins,
      avg: v.played ? +(v.pts / v.played).toFixed(1) : 0,
    }));

    const phaseAvg = {
      auto: meanOf(oprAuto),
      tele: meanOf(oprTele),
      endgame: meanOf(oprEnd),
      overall: meanOf(oprMap),
    };

    return {
      teamCount: eventInfo?.teamCount || tally.size,
      qualCount: qual.length,
      playoffCount: playoff.length,
      avgQual: +avgQual.toFixed(1),
      topScore,
      rows,
      phaseAvg,
    };
  }, [eventInfo]);

  const sortedRows = useMemo(() => {
    const rows = [...metrics.rows];
    rows.sort((a, b) => (sortKey === 'wins' ? b.wins - a.wins || b.opr - a.opr : b[sortKey] - a[sortKey]));
    return rows;
  }, [metrics.rows, sortKey]);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <DashboardSkeleton />
      </View>
    );
  }

  if (failed || !eventInfo) {
    return (
      <View style={styles.errorWrap}>
        <Feather name="alert-circle" size={30} color={t.c.textFaint} />
        <Text style={[styles.errorTitle, { color: t.c.text }]}>No data for this event in {GAME_NAMES[seasonYear]}</Text>
        <Text style={[styles.errorSub, { color: t.c.textMuted }]}>
          {eventCode ? `Event ${eventCode}` : 'No event selected'} — try another season.
        </Text>
        {availableYears.length > 0 && (
          <View style={styles.yearChips}>
            {availableYears.map((y) => (
              <Pressable
                key={y}
                onPress={() => router.push(`/analytics/events/${eventCode}?year=${y}` as any)}
                style={[styles.yearChip, { borderColor: t.c.border, backgroundColor: t.c.bgSubtle }]}
              >
                <Text style={{ color: t.c.text, fontSize: 12, fontWeight: '600' }}>{y}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  const status = eventStatus(eventInfo.date);

  return (
    <View style={{ flex: 1 }}>
      <PageHeader
        title={eventInfo.name || eventCode}
        subtitle={[eventInfo.location, eventInfo.date].filter(Boolean).join(' · ')}
        right={
          <View style={styles.headerRight}>
            <View style={[styles.statusPill, { borderColor: status.color, backgroundColor: t.c.bgSubtle }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <View style={[styles.seasonBadge, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
              <View style={{ position: 'relative' }}>
                <Picker
                  selectedValue={seasonYear}
                  onValueChange={(v: SupportedYear) => router.push(`/analytics/events/${eventCode}?year=${v}` as any)}
                  style={styles.pickerHidden}
                >
                  {(availableYears.length ? availableYears : [seasonYear]).map((y) => (
                    <Picker.Item key={y} label={GAME_NAMES[y]} value={y} />
                  ))}
                </Picker>
                <View style={styles.pickerOverlay}>
                  <Text style={{ color: t.c.text, fontSize: 12, fontWeight: '600', flex: 1 }}>{GAME_NAMES[seasonYear]}</Text>
                  <Caret width={12} height={12} fill={t.c.text} stroke={t.c.text} strokeWidth={7} />
                </View>
              </View>
            </View>
          </View>
        }
      />

      <View style={styles.statRow}>
        <StatCard title="Teams" value={metrics.teamCount} icon="users" />
        <StatCard title="Qual Matches" value={metrics.qualCount} icon="grid" />
        <StatCard title="Playoff Matches" value={metrics.playoffCount} icon="award" />
        <StatCard title="Avg Qual Score" value={metrics.avgQual} decimals={1} icon="bar-chart-2" />
        <StatCard title="Top Score" value={metrics.topScore} icon="trending-up" />
      </View>

      <CollapsibleSection title="Scoring vs. season average" storageKey="event-scoring">
        <View style={styles.statRow}>
          <OprCard title="Auto" value={metrics.phaseAvg.auto} avg={seasonAvg?.autoOPR} accent={t.isDark ? '#A78BFA' : '#7C3AED'} icon="zap" />
          <OprCard title="TeleOp" value={metrics.phaseAvg.tele} avg={seasonAvg?.teleOPR} accent={t.isDark ? '#FBBF24' : '#D97706'} icon="radio" />
          <OprCard title="Endgame" value={metrics.phaseAvg.endgame} avg={seasonAvg?.endgameOPR} accent={t.isDark ? '#2DD4BF' : '#0D9488'} icon="flag" />
          <OprCard title="Overall" value={metrics.phaseAvg.overall} avg={seasonAvg?.overallOPR} accent={t.c.accent} icon="activity" />
        </View>
      </CollapsibleSection>

      {metrics.rows.length > 0 && (
        <CollapsibleSection title="Score trends" storageKey="event-trends">
          <EventTrends matches={eventInfo.matches} />
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Event Rankings" count={sortedRows.length || undefined} storageKey="event-rankings">
        <TableShell
          footer={
            sortedRows.length > 0 ? (
              <View style={[styles.tableFooter, { borderTopColor: t.c.border }]}>
                <Text style={[styles.tableFooterText, { color: t.c.textMuted }]}>
                  {sortedRows.length} team{sortedRows.length === 1 ? '' : 's'} ranked
                </Text>
              </View>
            ) : null
          }
        >
          <TableHead>
            <HeadCell label="#" width={40} align="right" />
            <HeadCell label="Team" flex={1.7} />
            <HeadCell label="OPR" width={58} align="right" sortable active={sortKey === 'opr'} onPress={() => setSortKey('opr')} />
            {wideCols ? (
              <>
                <HeadCell label="Auto" width={54} align="right" sortable active={sortKey === 'auto'} onPress={() => setSortKey('auto')} />
                <HeadCell label="Tele" width={54} align="right" sortable active={sortKey === 'tele'} onPress={() => setSortKey('tele')} />
                <HeadCell label="End" width={54} align="right" sortable active={sortKey === 'endgame'} onPress={() => setSortKey('endgame')} />
              </>
            ) : (
              <HeadCell label="A / T / E" width={110} align="right" />
            )}
            <HeadCell label="W-L" width={54} align="right" sortable active={sortKey === 'wins'} onPress={() => setSortKey('wins')} />
            {showAvg && (
              <HeadCell label="Avg" width={52} align="right" sortable active={sortKey === 'avg'} onPress={() => setSortKey('avg')} />
            )}
          </TableHead>

          {sortedRows.length === 0 ? (
            <TableEmpty icon="inbox" text="No qualification results to rank." />
          ) : (
            sortedRows.map((r, i) => (
              <TableRow
                key={r.teamNumber}
                first={i === 0}
                last={i === sortedRows.length - 1}
                onPress={() => router.push(`/dashboards/${routeFromSeason(seasonYear)}?teamnumber=${r.teamNumber}` as any)}
              >
                <Cell width={40} align="right" numeric tone="faint">{i + 1}</Cell>
                <CellView flex={1.7}>
                  <Text style={[styles.rankTeamNum, { color: t.c.accentText }]}>{r.teamNumber}</Text>
                  <Text style={[styles.rankTeamName, { color: t.c.textMuted }]} numberOfLines={1}>{r.teamName}</Text>
                </CellView>
                <Cell width={58} align="right" numeric>{r.opr.toFixed(1)}</Cell>
                {wideCols ? (
                  <>
                    <Cell width={54} align="right" numeric tone="muted">{r.auto.toFixed(1)}</Cell>
                    <Cell width={54} align="right" numeric tone="muted">{r.tele.toFixed(1)}</Cell>
                    <Cell width={54} align="right" numeric tone="muted">{r.endgame.toFixed(1)}</Cell>
                  </>
                ) : (
                  <Cell width={110} align="right" numeric tone="muted" style={{ fontSize: 11.5 }}>
                    {r.auto.toFixed(0)} / {r.tele.toFixed(0)} / {r.endgame.toFixed(0)}
                  </Cell>
                )}
                <Cell width={54} align="right" numeric tone="muted">{r.wins}-{r.losses}</Cell>
                {showAvg && <Cell width={52} align="right" numeric tone="muted">{r.avg.toFixed(1)}</Cell>}
              </TableRow>
            ))
          )}
        </TableShell>
      </CollapsibleSection>

      <CollapsibleSection title="Match Results" count={eventInfo.matches.length} storageKey="event-matches">
        <EventMatchCard eventData={eventInfo} seasonYear={seasonYear} focusMatch={focusMatch} />
      </CollapsibleSection>
    </View>
  );
};

/* ---- helpers ---- */

function eventStatus(dateStr?: string) {
  if (!dateStr) return { label: 'Unknown', color: '#9CA3AF' };
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return { label: 'Completed', color: '#10B981' };
  if (d.toDateString() === today.toDateString()) return { label: 'Live', color: '#F59E0B' };
  return { label: 'Upcoming', color: '#3B82F6' };
}

function OprCard({
  title,
  value,
  avg,
  accent,
  icon,
}: {
  title: string;
  value: number;
  avg?: number;
  accent?: string;
  icon?: React.ComponentProps<typeof StatCard>['icon'];
}) {
  const diff = avg != null ? value - avg : undefined;
  return (
    <StatCard
      title={`${title} OPR`}
      value={value || null}
      decimals={2}
      compact
      accent={accent}
      icon={icon}
      delta={diff != null ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}` : undefined}
      deltaPositive={(diff ?? 0) >= 0}
    />
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  seasonBadge: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  pickerHidden: { opacity: 0, position: 'absolute', height: '100%', width: '100%', zIndex: 10 },
  pickerOverlay: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, width: 150 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  rankTeamNum: { fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rankTeamName: { fontSize: 11.5, flexShrink: 1 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  errorTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorSub: { fontSize: 13, textAlign: 'center' },
  yearChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'center' },
  yearChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  tableFooter: { marginTop: 10, paddingTop: 12, borderTopWidth: 1 },
  tableFooterText: { fontSize: 12, fontWeight: '500' },
});

export default EventDashboardTemplate;
