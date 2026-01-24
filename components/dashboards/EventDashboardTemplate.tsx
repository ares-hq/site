import { calculateTeamOPR } from '@/api/algorithms/calcOPR';
import { getEventistoricalData } from '@/api/dashboardInfo';
import { getEventData } from '@/api/event-service';
import { EventInfo, MatchTypeAverages, SupportedYear } from '@/api/utils/types';
import { usePageTitleContext } from '@/app/_layout';
import EventPerformance from '@/components/graphs/eventPerformace';
import EventMatchCard from '@/components/teamInfo/eventMatchCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Caret from '../../assets/icons/caret-up-down-bold.svg';
import { Feather } from '@expo/vector-icons';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  color: 'blue' | 'indigo';
  isMobile?: boolean;
};

const StatCard = ({ title, value, change, positive, color, isMobile }: StatCardProps) => {
  const { isDarkMode } = useDarkMode();
  
  const getBackgroundColor = () => {
    if (isDarkMode) {
      return color === 'blue' ? 'rgba(30, 58, 138, 0.4)' : 'rgba(55, 48, 163, 0.4)';
    }
    return color === 'blue' ? '#E6F1FD' : '#EDEEFC';
  };

  const textColor = positive ? '#16a34a' : '#dc2626';

  return (
    <View style={[
      isMobile ? styles.cardMobile : styles.card,
      { backgroundColor: getBackgroundColor() }
    ]}>
      <Text style={[
        isMobile ? styles.titleMobile : styles.title,
        { color: isDarkMode ? '#D1D5DB' : '#6b7280' }
      ]}>
        {title}
      </Text>
      <View style={isMobile ? styles.rowMobile : styles.row}>
        <Text style={[
          isMobile ? styles.valueMobile : styles.value,
          { color: isDarkMode ? '#F9FAFB' : '#000' }
        ]}>
          {value}
        </Text>
        <View style={styles.changeRow}>
          <Text style={[styles.change, { color: textColor }]}>{change}</Text>
          <Feather name={positive ? 'trending-up' : 'trending-down'} size={isMobile ? 9 : 11} color={textColor} />
        </View>
      </View>
    </View>
  );
};

const GAME_NAMES: Record<SupportedYear, string> = {
  2019: '2019 - Skystone',
  2020: '2020 - Ultimate Goal',
  2021: '2021 - Freight Frenzy',
  2022: '2022 - Power Play',
  2023: '2023 - Centerstage',
  2024: '2024 - Into the Deep',
  2025: '2025 - Decode',
};

const YEAR_TO_ROUTE: Record<SupportedYear, string> = {
  2019: 'rise',
  2020: 'gamechangers',
  2021: 'forward',
  2022: 'energize',
  2023: 'inshow',
  2024: 'intothedeep',
  2025: 'age',
};

interface EventDashboardProps {
  seasonYear?: SupportedYear;
}

export const EventDashboardTemplate = ({ seasonYear: propSeasonYear }: EventDashboardProps) => {
  const params = useLocalSearchParams();
  const { setPageTitleInfo } = usePageTitleContext();
  const eventCode = Array.isArray(params.eventCode) ? params.eventCode[0] : params.eventCode;
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const seasonYear: SupportedYear = (yearParam ? parseInt(yearParam) : propSeasonYear) as SupportedYear || 2025;

  const [containerWidth, setContainerWidth] = useState(0);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [availableYears, setAvailableYears] = useState<SupportedYear[]>([]);
  const [matchTypeAverages, setMatchTypeAverages] = useState<MatchTypeAverages | null>(null);
  const [highestScore, setHighScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noEventSelected, setNoEventSelected] = useState(false);
  const [noDataForEvent, setNoDataForEvent] = useState(false);
  const { isDarkMode } = useDarkMode();
  const [averageOPR, setAverageOPR] = useState<{
    autoOPR: number;
    teleOPR: number;
    endgameOPR: number;
    overallOPR: number;
  } | null>(null);
  const [team14584OPR, setTeam14584OPR] = useState<{
    autoOPR: number;
    teleOPR: number;
    endgameOPR: number;
    overallOPR: number;
  } | null>(null);

  useEffect(() => {
    if (eventCode) {
      const seasonName = GAME_NAMES[seasonYear];
      setPageTitleInfo({
        customSuffix: `${eventCode} (${seasonName})`,
      });
    }
  }, [eventCode, seasonYear, setPageTitleInfo]);

  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        if (!eventCode) {
          return;
        }

        const historicalData = await getEventistoricalData(eventCode);
        const yearsWithData: SupportedYear[] = [];
        historicalData.forEach((data, year) => {
          if (data !== null) {
            yearsWithData.push(year);
          }
        });
        yearsWithData.sort((a, b) => b - a);
        setAvailableYears(yearsWithData);
      } catch (err) {
        console.error('Error fetching available years:', err);
      }
    };
    fetchAvailableYears();
  }, [eventCode]);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setNoDataForEvent(false);
      
      try {
        if (!eventCode) {
          setNoEventSelected(true);
          setLoading(false);
          return;
        }

        const fullEventData = await getEventData(eventCode, seasonYear);
        
        if (!fullEventData) {
          setNoDataForEvent(true);
          setLoading(false);
          return;
        }

        setEventInfo(fullEventData);

        // Compute per-team OPRs for this event and set averages
        try {
          const matches = fullEventData.matches || [];
          const teamSet = new Set<number>();
          matches.forEach((m) => {
            if (m.redAlliance.team_1?.teamNumber) teamSet.add(m.redAlliance.team_1.teamNumber);
            if (m.redAlliance.team_2?.teamNumber) teamSet.add(m.redAlliance.team_2.teamNumber);
            if (m.blueAlliance.team_1?.teamNumber) teamSet.add(m.blueAlliance.team_1.teamNumber);
            if (m.blueAlliance.team_2?.teamNumber) teamSet.add(m.blueAlliance.team_2.teamNumber);
          });

          const teams = Array.from(teamSet);
          if (teams.length > 0) {
            const overallOPRs: number[] = [];
            const teleOPRs: number[] = [];
            const autoOPRs: number[] = [];
            const endgameOPRs: number[] = [];

            // Filter matches to include only qualification matches
            const qualificationMatches = matches.filter((m) => m.matchType === 'QUALIFICATION');

            const teleMatches = qualificationMatches.map((m) => ({
              ...m,
              redAlliance: { ...m.redAlliance, totalPoints: m.redAlliance.tele ?? 0, penalty: 0 },
              blueAlliance: { ...m.blueAlliance, totalPoints: m.blueAlliance.tele ?? 0, penalty: 0 },
            }));

            const autoMatches = qualificationMatches.map((m) => ({
              ...m,
              redAlliance: { ...m.redAlliance, totalPoints: (m.redAlliance.auto ?? 0), penalty: 0 },
              blueAlliance: { ...m.blueAlliance, totalPoints: (m.blueAlliance.auto ?? 0), penalty: 0 },
            }));

            const endgameMatches = qualificationMatches.map((m) => ({
              ...m,
              redAlliance: { ...m.redAlliance, totalPoints: (m.redAlliance.endgame ?? 0), penalty: 0 },
              blueAlliance: { ...m.blueAlliance, totalPoints: (m.blueAlliance.endgame ?? 0), penalty: 0 },
            }));

            for (const t of teams) {
              const oprOverall = calculateTeamOPR(qualificationMatches, t);
              const oprTele = calculateTeamOPR(teleMatches, t);
              const oprAuto = calculateTeamOPR(autoMatches, t);
              const oprEndgame = calculateTeamOPR(endgameMatches, t);
              if (t === 327) {
                console.log(`[DEBUG] Team 327 OPR - Overall: ${oprOverall}, Tele: ${oprTele}, Auto: ${oprAuto}, Endgame: ${oprEndgame}`);
                console.log(`[DEBUG] Team 327 matches count: ${qualificationMatches.filter(m => m.redAlliance.team_1?.teamNumber === t || m.redAlliance.team_2?.teamNumber === t || m.blueAlliance.team_1?.teamNumber === t || m.blueAlliance.team_2?.teamNumber === t).length}`);
              }
              overallOPRs.push(oprOverall);
              teleOPRs.push(oprTele);
              autoOPRs.push(oprAuto);
              endgameOPRs.push(oprEndgame);
            }

            const avgOverall = overallOPRs.reduce((s, v) => s + v, 0) / overallOPRs.length;
            const avgTele = teleOPRs.reduce((s, v) => s + v, 0) / teleOPRs.length;
            const avgAuto = autoOPRs.reduce((s, v) => s + v, 0) / autoOPRs.length;
            const avgEndgame = endgameOPRs.reduce((s, v) => s + v, 0) / endgameOPRs.length;

            setAverageOPR({
              autoOPR: Number(avgAuto.toFixed(2)),
              teleOPR: Number(avgTele.toFixed(2)),
              endgameOPR: Number(avgEndgame.toFixed(2)),
              overallOPR: Number(avgOverall.toFixed(2)),
            });

            // Compute OPRs for specific team 14584 if present
            const specificTeam = 14584;
            if (teams.includes(specificTeam)) {
              try {
                const tOverall = calculateTeamOPR(matches, specificTeam);
                const tTele = calculateTeamOPR(teleMatches, specificTeam);
                const tAuto = calculateTeamOPR(autoMatches, specificTeam);
                const tEnd = calculateTeamOPR(endgameMatches, specificTeam);
                setTeam14584OPR({
                  autoOPR: Number(tAuto.toFixed(2)),
                  teleOPR: Number(tTele.toFixed(2)),
                  endgameOPR: Number(tEnd.toFixed(2)),
                  overallOPR: Number(tOverall.toFixed(2)),
                });
              } catch (err) {
                console.error('Error computing OPR for team 14584:', err);
              }
            } else {
              setTeam14584OPR(null);
            }
          }
        } catch (err) {
          console.error('Error computing event OPR averages:', err);
        }
      } catch (err) {
        console.error('Error fetching event dashboard info:', err);
        setNoDataForEvent(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventCode, seasonYear]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
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

  if (loading) {
    return (
      <View style={[
        styles.loadingOverlay,
      ]} onLayout={handleLayout}>
        <View style={[
          styles.loadingContainer,
        ]}>
          <ActivityIndicator size="large" color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          <Text style={[
            styles.loadingText,
            { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
          ]}>
            Loading Event Data...
          </Text>
        </View>
      </View>
    );
  }

  if (noEventSelected) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
      ]}>
        <Text style={[
          styles.errorText,
          { color: isDarkMode ? '#F87171' : '#DC2626' }
        ]}>
          No event selected
        </Text>
      </View>
    );
  }

  if (noDataForEvent) {
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
            Event Overview - {getSeasonDisplayText()}
          </Text>
        </View>
        <Text style={[
          styles.errorText,
          { color: isDarkMode ? '#F87171' : '#DC2626' }
        ]}>
          No data available for event {eventCode}
        </Text>
        <Text style={[
          styles.subErrorText,
          { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
        ]}>
          Check if the event code is correct or if data is available for {seasonYear}.
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
    ]} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          {eventInfo?.name} ({eventCode}) Overview
        </Text>
        <View style={[
          styles.seasonBadge,
          {
            backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)'
          }
        ]}>
          <View style={{ position: 'relative' }}>
            <Picker
              selectedValue={seasonYear}
              onValueChange={(itemValue: SupportedYear) => {
                const selectedYear = itemValue as SupportedYear;
                router.push(`/analytics/events/${eventCode}?year=${selectedYear}` as any);
              }}
              style={[
                styles.picker,
                { 
                  outline: 'none',
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                  fontWeight: '600',
                  fontSize: 12,
                  opacity: 0.0,
                  position: 'absolute',
                  height: '100%',
                  width: '100%',
                  zIndex: 10,
                }
              ]}
              itemStyle={[
                styles.pickerItem,
                { 
                  color: 'red'
                }
              ]}
            >
              {availableYears.map((year) => (
                <Picker.Item 
                  key={year} 
                  label={GAME_NAMES[year]} 
                  value={year}
                  style={{color: 'red'}}
                />
              ))}
            </Picker>

            {/* Custom Icon Overlay */}
            <View 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 7,
                paddingVertical: 7,
                pointerEvents: 'none',
                width: 160,
              }}
            >
              <Text style={{
                color: isDarkMode ? '#F9FAFB' : '#111827',
                fontSize: 12,
                fontWeight: '600',
                flex: 1,
                // alignSelf: 'flex-end'
              }}>
                {GAME_NAMES[seasonYear]}
              </Text>
                  <Caret width={12} height={12} fill={isDarkMode ? '#F9FAFB' : '#111827'} stroke={isDarkMode ? '#F9FAFB' : '#111827'} strokeWidth={7}/>
            </View>
          </View>
        </View>
      </View>

      <View style={containerWidth < 900 ? styles.cardRowMobile : styles.cardRow}>
        <StatCard 
          title="Avg Auto OPR"
          value={averageOPR && !isNaN(averageOPR.autoOPR ?? NaN) ? (averageOPR.autoOPR as number).toFixed(2) : '--'}           
          change={
            team14584OPR && averageOPR
              ? `${(team14584OPR.autoOPR - averageOPR.autoOPR >= 0 ? '+' : '')}${(team14584OPR.autoOPR - averageOPR.autoOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(team14584OPR && averageOPR && team14584OPR.autoOPR - averageOPR.autoOPR >= 0)}
          color="indigo"
          isMobile={containerWidth < 900}
        />
        <StatCard 
          title="Avg TeleOp OPR" 
          value={averageOPR && !isNaN(averageOPR.teleOPR ?? NaN) ? averageOPR.teleOPR.toFixed(2) : '--'}           
          change={
            team14584OPR && averageOPR
              ? `${(team14584OPR.teleOPR - averageOPR.teleOPR >= 0 ? '+' : '')}${(team14584OPR.teleOPR - averageOPR.teleOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(team14584OPR && averageOPR && team14584OPR.teleOPR - averageOPR.teleOPR >= 0)}
          color="blue"
          isMobile={containerWidth < 900}
        />
        <StatCard 
          title="Avg Endgame OPR" 
          value={averageOPR && !isNaN(averageOPR.endgameOPR ?? NaN) ? (averageOPR.endgameOPR as number).toFixed(2) : '--'}           
          change={
            team14584OPR && averageOPR
              ? `${(team14584OPR.endgameOPR - averageOPR.endgameOPR >= 0 ? '+' : '')}${(team14584OPR.endgameOPR - averageOPR.endgameOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(team14584OPR && averageOPR && team14584OPR.endgameOPR - averageOPR.endgameOPR >= 0)}
          color="indigo"
          isMobile={containerWidth < 900}
        />
        <StatCard 
          title="Avg Overall OPR" 
          value={averageOPR && !isNaN(averageOPR.overallOPR ?? NaN) ? averageOPR.overallOPR.toFixed(2) : '--'}           
          change={
            team14584OPR && averageOPR
              ? `${(team14584OPR.overallOPR - averageOPR.overallOPR >= 0 ? '+' : '')}${(team14584OPR.overallOPR - averageOPR.overallOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(team14584OPR && averageOPR && team14584OPR.overallOPR - averageOPR.overallOPR >= 0)}
          color="blue"
          isMobile={containerWidth < 900}
        />
      </View>

      {/* {team14584OPR && (
        <View style={{ marginTop: 8, marginBottom: 8, paddingHorizontal: 6 }}>
          <Text style={[styles.header, { fontSize: 13, marginBottom: 6, color: isDarkMode ? '#F9FAFB' : '#111827' }]}>Team 14584 OPR (event)</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827' }}>Auto: {team14584OPR.autoOPR.toFixed(2)}</Text>
            <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827' }}>Tele: {team14584OPR.teleOPR.toFixed(2)}</Text>
            <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827' }}>Endgame: {team14584OPR.endgameOPR.toFixed(2)}</Text>
            <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827' }}>Overall: {team14584OPR.overallOPR.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {eventInfo && eventInfo.matches && (
        <View style={{ marginTop: 12, marginBottom: 12, paddingHorizontal: 6, paddingVertical: 8, backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)', borderRadius: 6 }}>
          <Text style={[styles.header, { fontSize: 13, marginBottom: 8, color: isDarkMode ? '#FBBF24' : '#D97706' }]}>DEBUG: Avg Scores by Section</Text>
          {(() => {
            const matches = eventInfo.matches;
            const autoScores = matches.map(m => (m.redAlliance.auto || 0) + (m.blueAlliance.auto || 0));
            const teleScores = matches.map(m => (m.redAlliance.tele || 0) + (m.blueAlliance.tele || 0));
            const endgameScores = matches.map(m => (m.redAlliance.endgame || 0) + (m.blueAlliance.endgame || 0));
            
            const avgAuto = autoScores.length > 0 ? autoScores.reduce((a, b) => a + b, 0) / autoScores.length : 0;
            const avgTele = teleScores.length > 0 ? teleScores.reduce((a, b) => a + b, 0) / teleScores.length : 0;
            const avgEndgame = endgameScores.length > 0 ? endgameScores.reduce((a, b) => a + b, 0) / endgameScores.length : 0;
            
            return (
              <View style={{ gap: 4 }}>
                <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827', fontSize: 12 }}>Avg Auto (both alliances): {avgAuto.toFixed(2)}</Text>
                <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827', fontSize: 12 }}>Avg TeleOp (both alliances): {avgTele.toFixed(2)}</Text>
                <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827', fontSize: 12 }}>Avg Endgame (both alliances): {avgEndgame.toFixed(2)}</Text>
                <Text style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 11, marginTop: 6 }}>Total matches: {matches.length}</Text>
              </View>
            );
          })()}
        </View>
      )} */}

      {/* <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Event Information
        </Text>
      </View> */}
      
      {/* {eventInfo && (
        <InfoBlock screenWidth={containerWidth} teamInfo={eventInfo} highScore={highestScore}/>
      )} */}

      {/* <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Performance
        </Text>
      </View> */}
      
      {containerWidth < 600 ? (
        <View style={[styles.chartScrollContainer, styles.chartScrollContainerMobile]}>
          {matchTypeAverages && (
            <View style={styles.mobileChartWrapper}>
              <EventPerformance matchType={matchTypeAverages}/>
            </View>
          )}
          {/* {eventInfo && (
            <View style={styles.mobileChartWrapper}>
              <EventScores teamInfo={eventInfo} />
            </View>
          )} */}
        </View>
      ) : (
        <View style={styles.chartScrollContainer}>
          {matchTypeAverages && <EventPerformance matchType={matchTypeAverages}/>}
          {/* {eventInfo && <EventScores teamInfo={eventInfo} />} */}
        </View>
      )}

      {eventInfo && (
        <EventMatchCard eventData={eventInfo} seasonYear={seasonYear} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    position: 'relative',
  },
  seasonBadge: {
    paddingHorizontal: 7,
    borderRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  header: {
    fontSize: 15,
    fontWeight: '600',
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
  picker: {
    height: 28,
    width: 155,
  },
  pickerItem: {
    fontSize: 12,
    fontWeight: '600',
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

export default EventDashboardTemplate;