import { attachHourlyAverages, getAverageByMatchType, getAveragePlace, getAwards } from '@/api/algorithms/averageMatchScores';
import { getUpcomingEventsOnly } from '@/api/basic-event-service';
import { getAverageOPRs, getCurrentUserTeam, getTeamHistoricalData, getTeamInfo, getTeamMatches, getWins } from '@/api/dashboardInfo';
import { getFirstAPI } from '@/api/event-service';
import { AllianceInfo, EventInfo, MatchTypeAverages, SupportedYear, TeamInfo } from '@/api/utils/types';
import { routeFromSeason } from '@/api/utils/seasons';
import { usePageTitleContext } from '@/app/_layout';
import EventPerformance from '@/components/graphs/eventPerformace';
import EventScores from '@/components/graphs/eventScores';
import UserGraphSection from '@/components/graphs/overtimeGraph';
import PerformanceOverview from '@/components/dashboards/PerformanceOverview';
import InfoBlock from '@/components/teamInfo/infoBlock';
import MatchResultRow from '@/components/teamInfo/MatchResultRow';
import { useCountUp, webTransition } from '@/components/shared/motion';
import { DashboardSkeleton } from '@/components/shared/Skeleton';
import { useTheme } from '@/components/shared/theme';
import { CollapsibleSection, PageHeader, SectionHeader } from '@/components/shared/ui';
import { useDarkMode } from '@/context/DarkModeContext';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Caret from '../../assets/icons/caret-up-down-bold.svg';

const GAME_NAMES: Record<SupportedYear, string> = {
  2019: '2019 - Skystone',
  2020: '2020 - Ultimate Goal',
  2021: '2021 - Freight Frenzy',
  2022: '2022 - Power Play',
  2023: '2023 - Centerstage',
  2024: '2024 - Into the Deep',
  2025: '2025 - Decode',
  2026: '2026 - BioBuzz',
};

interface DashboardProps {
  seasonYear: SupportedYear;
}

export const DashboardTemplate = ({ seasonYear }: DashboardProps) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setPageTitleInfo } = usePageTitleContext();
  const teamParam = Array.isArray(params.teamnumber) ? params.teamnumber[0] : params.teamnumber;

  const { teamnumber } = useLocalSearchParams();
  const [containerWidth, setContainerWidth] = useState(0);
  const [availableYears, setAvailableYears] = useState<SupportedYear[]>([]);
  const [seasonStanding, setSeasonStanding] = useState<{ ordinal: number; total: number } | null>(null);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [matches, setMatches] = useState<AllianceInfo[] | null>(null);
  const [eventData, setEventData] = useState<EventInfo[] | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventInfo[] | null>(null);
  const [averages, setAverages] = useState<AllianceInfo[] | null>(null);
  const [matchTypeAverages, setMatchTypeAverages] = useState<MatchTypeAverages | null>(null);
  const [wins, setWins] = useState<number | null>(0);
  const [highestScore, setHighScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noTeamSelected, setNoTeamSelected] = useState(false);
  const [noDataForYear, setNoDataForYear] = useState(false);
  const { isDarkMode } = useDarkMode();
  const t = useTheme();
  const [averageOPR, setAverageOPR] = useState<{
    autoOPR: number;
    teleOPR: number;
    endgameOPR: number;
    overallOPR: number;
  } | null>(null);

  // Update browser tab title with team and season
  useEffect(() => {
    if (teamnumber) {
      const seasonName = GAME_NAMES[seasonYear];
      setPageTitleInfo({
        customSuffix: `Team ${teamnumber} (${seasonName})`,
      });
    }
  }, [teamnumber, seasonYear, setPageTitleInfo]);

  // Fetch available years for the team
  useEffect(() => {
    const fetchAvailableYears = async () => {
      let teamNumber: number;
      try {
        if (!teamnumber) {
          const userTeam = await getCurrentUserTeam();
          if (!userTeam) {
            return;
          }
          teamNumber = typeof userTeam === 'string' ? parseInt(userTeam, 10) : userTeam;
        } else {
          teamNumber = Number(teamnumber);
        }
        
        if (isNaN(teamNumber)) {
          return;
        }

        const historicalData = await getTeamHistoricalData(teamNumber);
        const yearsWithData: SupportedYear[] = [];
        const oprByYear: { year: SupportedYear; opr: number }[] = [];

        historicalData.forEach((data, year) => {
          if (data !== null) {
            yearsWithData.push(year);
            oprByYear.push({ year, opr: data.overallOPR ?? 0 });
          }
        });

        // Sort years in descending order
        yearsWithData.sort((a, b) => b - a);
        setAvailableYears(yearsWithData);

        // Rank the viewed season by overall OPR against every season the team has on record.
        if (oprByYear.length > 0) {
          const sorted = [...oprByYear].sort((a, b) => b.opr - a.opr);
          const idx = sorted.findIndex((s) => s.year === seasonYear);
          setSeasonStanding(idx >= 0 ? { ordinal: idx + 1, total: sorted.length } : null);
        } else {
          setSeasonStanding(null);
        }
      } catch (err) {
        console.error('Error fetching available years:', err);
      }
    };
    
    fetchAvailableYears();
  }, [teamnumber, seasonYear]);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      setNoDataForYear(false);
      
      let teamNumber: number;
      try {
        if (!teamnumber) {
          const userTeam = await getCurrentUserTeam();
          if (!userTeam) {
            setNoTeamSelected(true);
            setLoading(false);
            return;
          }
          teamNumber = typeof userTeam === 'string' ? parseInt(userTeam, 10) : userTeam;
        } else {
          teamNumber = Number(teamnumber);
        }
        
        if (isNaN(teamNumber)) {
          console.error('Invalid team number:', teamNumber);
          setLoading(false);
          return;
        }

        const [data, avg] = await Promise.all([
          getTeamInfo(teamNumber, seasonYear),
          getAverageOPRs(seasonYear),
        ]);
        
        if (!data) {
          setNoDataForYear(true);
          setLoading(false);
          return;
        }
        
        const match = await getTeamMatches(teamNumber, seasonYear);

        const [enhancedMatches, matchType, wins] = await Promise.all([
          attachHourlyAverages(match ?? [], seasonYear),
          getAverageByMatchType(match ?? []),
          getWins(match ?? []),
        ]);
        
        
        const highScore = match?.reduce((max, m) => Math.max(max, m.totalPoints), 0) ?? 0;
        
        const events = data?.events ?? [];

        const [eventData, upcomingEventData] = await Promise.all([
          events.length > 0 ? getFirstAPI(events, teamNumber, seasonYear) : Promise.resolve([]),
          getUpcomingEventsOnly(seasonYear, teamNumber)
        ]);

        if (data) {
          data.averagePlace = getAveragePlace(eventData ?? []);
          data.achievements = getAwards(eventData ?? []);
          setTeamInfo(data);
        }
        if (avg) setAverageOPR(avg);
        if (enhancedMatches) {
          setMatches(enhancedMatches);
          setAverages(enhancedMatches);
        }
        if (highScore) setHighScore(highScore);
        if (wins) setWins(wins);
        if (eventData) setEventData(eventData);
        if (upcomingEventData) setUpcomingEvents(upcomingEventData);
        if (matchType) setMatchTypeAverages(matchType);
      } catch (err) {
        console.error('Error fetching dashboard info for year', seasonYear, ':', err);
        setNoDataForYear(true);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [teamnumber, seasonYear]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    // Only update if width changed significantly (more than 5px difference)
    setContainerWidth((prevWidth) => {
      if (Math.abs(width - prevWidth) > 5) {
        return width;
      }
      return prevWidth;
    });
  };

  const getSeasonDisplayText = () => {
    return GAME_NAMES[seasonYear] || `${seasonYear} Season`;
  };

  const allEvents: { event: EventInfo; kind: 'upcoming' | 'completed' }[] = [
    ...(upcomingEvents ?? []).map((event) => ({ event, kind: 'upcoming' as const })),
    ...(eventData ?? []).map((event) => ({ event, kind: 'completed' as const })),
  ];

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }]} onLayout={handleLayout}>
        <DashboardSkeleton />
      </View>
    );
  }

  if (noTeamSelected) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
      ]}>
        <Text style={[
          styles.errorText,
          { color: isDarkMode ? '#F87171' : '#DC2626' }
        ]}>
          Please select an Affiliated team to view data
        </Text>
      </View>
    );
  }

  if (noDataForYear) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
      ]}>
        <View style={styles.headerRow}>
          <Text style={[
            styles.header,
            { color: isDarkMode ? '#F9FAFB' : '#111827' }
          ]}>
            Overview - {getSeasonDisplayText()}
          </Text>
        </View>
        <Text style={[
          styles.errorText,
          { color: isDarkMode ? '#F87171' : '#DC2626' }
        ]}>
          No data available for team {teamParam || 'selected'} in {getSeasonDisplayText()}
        </Text>
        <Text style={[
          styles.subErrorText,
          { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
        ]}>
          Try selecting a different year or check if the team participated in {seasonYear}.
        </Text>
      </View>
    );
  }

  const seasonName = GAME_NAMES[seasonYear]?.replace(/^\d+\s*-\s*/, '') ?? `${seasonYear} season`;
  const ordinalLabel = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const standingText = (() => {
    if (!seasonStanding) return null;
    const { ordinal, total } = seasonStanding;
    if (total <= 1) return 'Only season on record';
    if (ordinal === 1) return `Best of ${total} seasons on record`;
    return `${ordinalLabel(ordinal)}-best of ${total} seasons`;
  })();
  const subtitleBits = [seasonName, standingText].filter(Boolean).join('  ·  ');

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <PageHeader
        title={`${teamInfo?.teamNumber} ${teamInfo?.teamName}`}
        subtitle={subtitleBits}
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {Number(teamParam) === 14584 && (
              <Image source={require('../../assets/images/2023PioneerPatch.png')} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
            )}
            <View style={[styles.seasonBadge, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
              <View style={{ position: 'relative' }}>
                <Picker
                  selectedValue={seasonYear}
                  onValueChange={(itemValue: SupportedYear) => {
                    const route = routeFromSeason(itemValue as SupportedYear);
                    const queryString = teamnumber ? `?teamnumber=${teamnumber}` : '';
                    router.push(`/dashboards/${route}${queryString}` as any);
                  }}
                  style={[styles.picker, { outline: 'none', borderWidth: 0, backgroundColor: 'transparent', opacity: 0, position: 'absolute', height: '100%', width: '100%', zIndex: 10 } as any]}
                >
                  {availableYears.map((year) => (
                    <Picker.Item key={year} label={GAME_NAMES[year]} value={year} />
                  ))}
                </Picker>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 7, pointerEvents: 'none', width: 190 }}>
                  <Text numberOfLines={1} style={{ color: t.c.text, fontSize: 12, fontWeight: '600', flex: 1 }}>{GAME_NAMES[seasonYear]}</Text>
                  <Caret width={12} height={12} fill={t.c.text} stroke={t.c.text} strokeWidth={7} />
                </View>
              </View>
            </View>
          </View>
        }
      />

      <OprBreakdownCard teamInfo={teamInfo} averageOPR={averageOPR} />

      <CollapsibleSection title="Trend" storageKey="team-trend">
        {containerWidth > 0 && teamInfo && matches && averages && wins ? (
          <UserGraphSection matches={matches} averages={averages} screenWidth={containerWidth} teamInfo={teamInfo} wins={wins} year={seasonYear} />
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection title="Performance Overview" storageKey="team-overview">
        {teamInfo && (
          <PerformanceOverview
            teamInfo={teamInfo}
            matches={matches}
            wins={wins ?? 0}
            year={seasonYear}
            screenWidth={containerWidth}
            averageOPR={averageOPR}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Team Information" storageKey="team-info">
        {teamInfo && <InfoBlock screenWidth={containerWidth} teamInfo={teamInfo} highScore={highestScore} />}
      </CollapsibleSection>

      <CollapsibleSection title="Performance" storageKey="team-performance">
        {containerWidth < 600 ? (
          <View style={[styles.chartScrollContainer, styles.chartScrollContainerMobile]}>
            {matchTypeAverages && <View style={styles.mobileChartWrapper}><EventPerformance matchType={matchTypeAverages} matches={matches} year={seasonYear} /></View>}
            {teamInfo && <View style={styles.mobileChartWrapper}><EventScores teamInfo={teamInfo} averageOPR={averageOPR} /></View>}
          </View>
        ) : (
          <View style={styles.chartScrollContainer}>
            {matchTypeAverages && <EventPerformance matchType={matchTypeAverages} matches={matches} year={seasonYear} />}
            {teamInfo && <EventScores teamInfo={teamInfo} averageOPR={averageOPR} />}
          </View>
        )}
      </CollapsibleSection>

      <SectionHeader title="Events" count={allEvents.length} />
      <View style={[styles.eventsCard, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
        {allEvents.length === 0 ? (
          <Text style={{ color: t.c.textMuted, fontSize: 13, padding: 18, textAlign: 'center' }}>
            No events recorded for this team in {GAME_NAMES[seasonYear]}.
          </Text>
        ) : (
          allEvents.map(({ event, kind }, i) => (
            <EventRow
              key={`${kind}-${event.eventCode || i}`}
              event={event}
              teamNumber={teamInfo?.teamNumber ?? 0}
              seasonYear={seasonYear}
              last={i === allEvents.length - 1}
              onOpen={() => router.push(`/analytics/events/${event.eventCode}?year=${seasonYear}` as any)}
              onTeam={(n) => router.push(`/dashboards/${routeFromSeason(seasonYear)}?teamnumber=${n}` as any)}
            />
          ))
        )}
      </View>
    </View>
  );
};

/** Compact, expandable event summary. Expanded = this team's matches at the event. */
function EventRow({
  event,
  teamNumber,
  seasonYear,
  last,
  onOpen,
  onTeam,
}: {
  event: EventInfo;
  teamNumber: number;
  seasonYear: SupportedYear;
  last: boolean;
  onOpen: () => void;
  onTeam: (n: number) => void;
}) {
  const t = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hl, setHl] = useState<number | undefined>(teamNumber || undefined);
  const onTeamPress = (n: number) => {
    if (hl === n) onTeam(n);
    else setHl(n);
  };

  const status = (() => {
    const d = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return { label: 'Completed', color: t.c.success };
    if (d.toDateString() === today.toDateString()) return { label: 'Live', color: '#F59E0B' };
    return { label: 'Upcoming', color: t.c.accent };
  })();

  const stats = [
    event.place ? { k: 'Place', v: event.place } : null,
    event.record ? { k: 'Record', v: event.record } : null,
    event.OPR ? { k: 'OPR', v: String(event.OPR) } : null,
    event.winRate != null && event.winRate > 0 ? { k: 'Win', v: `${event.winRate}%` } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  const teamMatches = (event.matches ?? []).filter((m) => m.matchType !== 'PRACTICE');

  const awards = (event.achievements ?? '')
    .split(/[•,]/)
    .map((s) => s.trim())
    .filter((s) => s && !/^(no awards received|none)$/i.test(s));

  return (
    <View style={{ borderBottomColor: t.c.hairline, borderBottomWidth: last && !expanded ? 0 : 1 }}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ hovered }: any) => [
          styles.eventRow,
          webTransition('background-color'),
          { backgroundColor: hovered || expanded ? t.c.rowHover : 'transparent' },
        ]}
      >
        <Feather
          name="chevron-right"
          size={15}
          color={expanded ? t.c.accent : t.c.textFaint}
          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={[styles.eventName, { color: t.c.text }]} numberOfLines={1}>{event.name}</Text>
            <View style={[styles.eventStatus, { borderColor: status.color }]}>
              <Text style={{ color: status.color, fontSize: 10.5, fontWeight: '700' }}>{status.label}</Text>
            </View>
            {awards.length > 0 && (
              <View style={styles.awardBadge}>
                <Feather name="award" size={11} color={t.isDark ? '#FBBF24' : '#B45309'} />
                <Text style={{ color: t.isDark ? '#FBBF24' : '#B45309', fontSize: 10.5, fontWeight: '700' }}>
                  {awards.length}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.eventMeta, { color: t.c.textFaint }]} numberOfLines={1}>
            {[event.date, event.location].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
        <View style={styles.eventStats}>
          {stats.map((s) => (
            <View key={s.k} style={styles.eventStat}>
              <Text style={[styles.eventStatV, { color: t.c.text }]}>{s.v}</Text>
              <Text style={[styles.eventStatK, { color: t.c.textFaint }]}>{s.k}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      {expanded && (
        <View style={[styles.eventExpand, { backgroundColor: t.c.bg, borderTopColor: t.c.hairline }]}>
          {awards.length > 0 && (
            <View style={styles.awardRow}>
              <Feather name="award" size={13} color={t.isDark ? '#FBBF24' : '#B45309'} />
              {awards.map((a) => (
                <View key={a} style={[styles.awardChip, { borderColor: t.isDark ? 'rgba(251,191,36,0.5)' : '#F59E0B' }]}>
                  <Text style={{ color: t.isDark ? '#FCD34D' : '#B45309', fontSize: 11.5, fontWeight: '600' }}>{a}</Text>
                </View>
              ))}
            </View>
          )}
          {teamMatches.length > 0 ? (
            teamMatches.map((m, i) => (
              <MatchResultRow
                key={`${m.matchNumber}-${i}`}
                match={m}
                seasonYear={seasonYear}
                eventCode={event.eventCode}
                highlightTeam={hl}
                first={i === 0}
                last={i === teamMatches.length - 1}
                onTeam={onTeamPress}
              />
            ))
          ) : (
            <Text style={{ color: t.c.textFaint, fontSize: 12.5, paddingVertical: 10 }}>
              Match schedule not available yet.
            </Text>
          )}
          <Pressable onPress={onOpen} style={({ hovered }: any) => [styles.eventOpenBtn, { borderColor: hovered ? t.c.accent : t.c.border, marginTop: 12 }]}>
            <Text style={{ color: t.c.accentText, fontSize: 12, fontWeight: '600' }}>Open full event dashboard</Text>
            <Feather name="arrow-right" size={13} color={t.c.accentText} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

type AvgOPR = { autoOPR: number; teleOPR: number; endgameOPR: number; overallOPR: number } | null;

/** "Season OPR" card — big overall number + a tight per-phase breakdown row underneath. */
function OprBreakdownCard({ teamInfo, averageOPR }: { teamInfo: TeamInfo | null; averageOPR: AvgOPR }) {
  const t = useTheme();

  const overall = teamInfo?.overallOPR ?? 0;
  const shown = useCountUp(overall, { decimals: 1 });
  const overallDiff = averageOPR ? overall - averageOPR.overallOPR : undefined;

  const phases = [
    { key: 'auto' as const, label: 'Auto', val: teamInfo?.autoOPR ?? 0, avg: averageOPR?.autoOPR },
    { key: 'tele' as const, label: 'TeleOp', val: teamInfo?.teleOPR ?? 0, avg: averageOPR?.teleOPR },
    { key: 'end' as const, label: 'Endgame', val: teamInfo?.endgameOPR ?? 0, avg: averageOPR?.endgameOPR },
  ];

  return (
    <View style={[styles.oprCard, { backgroundColor: t.c.surface, borderColor: t.c.border }]}>
      <View style={styles.oprHead}>
        <Text style={[styles.oprLabel, { color: t.c.textMuted }]}>Season OPR</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <Text style={[styles.oprBig, { color: t.c.text }]}>
            {shown.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </Text>
          {overallDiff != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 6 }}>
              <Feather name={overallDiff >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={13} color={overallDiff >= 0 ? t.c.success : t.c.danger} />
              <Text style={{ color: overallDiff >= 0 ? t.c.success : t.c.danger, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                {Math.abs(overallDiff).toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.oprPhases, { borderTopColor: t.c.hairline }]}>
        {phases.map((p, i) => {
          const d = p.avg != null ? p.val - p.avg : undefined;
          return (
            <View key={p.key} style={[styles.oprPhase, i > 0 && { borderLeftWidth: 1, borderLeftColor: t.c.hairline, paddingLeft: 14 }]}>
              <Text style={[styles.oprPhaseLabel, { color: t.c.textMuted }]}>{p.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                <Text style={[styles.oprPhaseVal, { color: t.c.text }]}>{p.val.toFixed(1)}</Text>
                {d != null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                    <Feather name={d >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={10} color={d >= 0 ? t.c.success : t.c.danger} />
                    <Text style={{ color: d >= 0 ? t.c.success : t.c.danger, fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
                      {Math.abs(d).toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    position: 'relative',
  },
  oprCard: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 14, marginBottom: 4 },
  oprHead: { gap: 2 },
  oprLabel: { fontSize: 11.5, fontWeight: '600', marginBottom: 3 },
  oprBig: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  oprPhases: { flexDirection: 'row', gap: 14, borderTopWidth: 1, paddingTop: 12, flexWrap: 'wrap' },
  oprPhase: { flex: 1, minWidth: 88 },
  oprPhaseLabel: { fontSize: 11.5, fontWeight: '500' },
  oprPhaseVal: { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  glance: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  glanceItems: { flexDirection: 'row', gap: 22, flexWrap: 'wrap' },
  glanceItem: { alignItems: 'flex-start' },
  glanceV: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  glanceK: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 },
  wrTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingRight: 10,
  },
  seasonBadge: {
    paddingHorizontal: 7,
    borderRadius: 20,
  },
  picker: {
    height: 28,
    width: 155,
  },
  pickerItem: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
    marginBottom: 13,
  },
  cardRowMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    minWidth: 220,
    height: 97,
    borderRadius: 13,
    padding: 20,
  },
  cardMobile: {
    flex: 1,
    minWidth: 160,
    height: 80,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    marginBottom: 9,
  },
  titleMobile: {
    fontSize: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  rowMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
  },
  valueMobile: {
    fontSize: 18,
    fontWeight: '700',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  change: {
    fontSize: 13,
    fontWeight: '600',
  },
  chartScrollContainer: {
    gap: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  chartScrollContainerMobile: {
    flexDirection: 'column',
  },
  mobileChartWrapper: {
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 320,
  },
  eventContainer: {
    marginBottom: -20,
  },
  eventsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  eventName: { fontSize: 14, fontWeight: '600' },
  eventStatus: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
  },
  eventMeta: { fontSize: 11.5, marginTop: 2 },
  awardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.5)',
  },
  awardRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', paddingVertical: 10 },
  awardChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  eventStats: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  eventStat: { alignItems: 'flex-end' },
  eventStatV: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  eventStatK: { fontSize: 10.5, fontWeight: '600', marginTop: 1 },
  eventExpand: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 4, borderTopWidth: 1 },
  matchLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  matchCode: { width: 52, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  matchOutcome: { width: 14, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  matchScore: { width: 78, fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  matchTeams: { flex: 1, fontSize: 11.5 },
  eventOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 50,
  },
  subErrorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
});

export default DashboardTemplate;