import { attachHourlyAverages, getAverageByMatchType, getAveragePlace, getAwards } from '@/api/algorithms/averageMatchScores';
import { getUpcomingEventsOnly } from '@/api/basic-event-service';
import { getAverageOPRs, getCurrentUserTeam, getTeamHistoricalData, getTeamInfo, getTeamMatches, getWins } from '@/api/dashboardInfo';
import { getFirstAPI } from '@/api/event-service';
import { AllianceInfo, EventInfo, MatchTypeAverages, SupportedYear, TeamInfo } from '@/api/utils/types';
import { usePageTitleContext } from '@/app/_layout';
import EventPerformance from '@/components/graphs/eventPerformace';
import EventScores from '@/components/graphs/eventScores';
import UserGraphSection from '@/components/graphs/overtimeGraph';
import EventCard from '@/components/teamInfo/eventCard';
import InfoBlock from '@/components/teamInfo/infoBlock';
import { useDarkMode } from '@/context/DarkModeContext';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Caret from '../../assets/icons/caret-up-down-bold.svg';

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
        
        historicalData.forEach((data, year) => {
          if (data !== null) {
            yearsWithData.push(year);
          }
        });
        
        // Sort years in descending order
        yearsWithData.sort((a, b) => b - a);
        setAvailableYears(yearsWithData);
      } catch (err) {
        console.error('Error fetching available years:', err);
      }
    };
    
    fetchAvailableYears();
  }, [teamnumber]);

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
        console.error(match)

        const [enhancedMatches, matchType, wins] = await Promise.all([
          attachHourlyAverages(match ?? [], seasonYear),
          getAverageByMatchType(match ?? []),
          getWins(match ?? []),
        ]);
        
        
        const highScore = match?.reduce((max, m) => Math.max(max, m.totalPoints), 0) ?? 0;
        
        const events = data?.events ?? [];
        console.log('Events for team:', events);
        
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
            Loading {getSeasonDisplayText()}...
          </Text>
        </View>
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

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
    ]} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[
            styles.header,
            { color: isDarkMode ? '#F9FAFB' : '#111827' }
          ]}>
            {teamInfo?.teamName} ({teamInfo?.teamNumber}) Overview
          </Text>
          {Number(teamParam) === 14584 && (
            <Image 
              source={require('../../assets/images/2023PioneerPatch.png')}
              style={{
                width: 32,
                height: 32,
                resizeMode: 'contain',
              }}
            />
          )}
        </View>
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
                const route = YEAR_TO_ROUTE[selectedYear];
                const queryString = teamnumber ? `?teamnumber=${teamnumber}` : '';
                router.push(`/dashboards/${route}${queryString}` as any);
              }}
              style={[
                styles.picker,
                { 
                  outline: 'none',
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                  fontWeight: '600',
                  fontSize: 12,
                  opacity: 0.0, // Nearly invisible but still clickable
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
          title={`Auto OPR`}
          value={teamInfo?.autoOPR?.toFixed(2) ?? '--'} 
          change={
            averageOPR && teamInfo?.autoOPR != null
              ? `${(teamInfo.autoOPR - averageOPR.autoOPR >= 0 ? '+' : '')}${(teamInfo.autoOPR - averageOPR.autoOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(averageOPR && teamInfo?.autoOPR != null && teamInfo.autoOPR - averageOPR.autoOPR >= 0)}
          color="indigo"
          isMobile={containerWidth < 900}
        />
        <StatCard 
          title="TeleOp OPR" 
          value={teamInfo?.teleOPR?.toFixed(2) ?? '--'} 
          change={
            averageOPR && teamInfo?.teleOPR != null
              ? `${(teamInfo.teleOPR - averageOPR.teleOPR >= 0 ? '+' : '')}${(teamInfo.teleOPR - averageOPR.teleOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(averageOPR && teamInfo?.teleOPR != null && teamInfo.teleOPR - averageOPR.teleOPR >= 0)}
          color="blue"
          isMobile={containerWidth < 900}
        />
        <StatCard 
          title="Endgame OPR" 
          value={teamInfo?.endgameOPR?.toFixed(2) ?? '--'} 
          change={
            averageOPR && teamInfo?.endgameOPR != null
              ? `${(teamInfo.endgameOPR - averageOPR.endgameOPR >= 0 ? '+' : '')}${(teamInfo.endgameOPR - averageOPR.endgameOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(averageOPR && teamInfo?.endgameOPR != null && teamInfo.endgameOPR - averageOPR.endgameOPR >= 0)}
          color="indigo"
          isMobile={containerWidth < 900}
        />
        <StatCard 
          title="Overall OPR" 
          value={teamInfo?.overallOPR?.toFixed(2) ?? '--'} 
          change={
            averageOPR && teamInfo?.overallOPR != null
              ? `${(teamInfo.overallOPR - averageOPR.overallOPR >= 0 ? '+' : '')}${(teamInfo.overallOPR - averageOPR.overallOPR).toFixed(2)}`
              : '--'
          }
          positive={!!(averageOPR && teamInfo?.overallOPR != null && teamInfo.overallOPR - averageOPR.overallOPR >= 0)}
          color="blue"
          isMobile={containerWidth < 900}
        />
      </View>

      {containerWidth > 0 && teamInfo && matches && averages && wins &&(
        <UserGraphSection matches={matches} averages={averages} screenWidth={containerWidth} teamInfo={teamInfo} wins={wins} year={seasonYear}/>
      )}

      <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Team Information
        </Text>
      </View>
      
      {teamInfo && (
        <InfoBlock screenWidth={containerWidth} teamInfo={teamInfo} highScore={highestScore}/>
      )}

      <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Performance
        </Text>
      </View>
      
      {containerWidth < 600 ? (
        <View style={[styles.chartScrollContainer, styles.chartScrollContainerMobile]}>
          {matchTypeAverages && (
            <View style={styles.mobileChartWrapper}>
              <EventPerformance matchType={matchTypeAverages}/>
            </View>
          )}
          {teamInfo && (
            <View style={styles.mobileChartWrapper}>
              <EventScores teamInfo={teamInfo} />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.chartScrollContainer}>
          {matchTypeAverages && <EventPerformance matchType={matchTypeAverages}/>}
          {teamInfo && <EventScores teamInfo={teamInfo} />}
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Events
        </Text>
      </View>
      
      <View style={styles.eventContainer}>
        {upcomingEvents && upcomingEvents.map((event, index) => (
          <View key={`upcoming-${event.eventCode || index}`} style={{ marginBottom: 5, flexShrink: 0 }}>
            <EventCard eventData={event} teamNumber={teamInfo?.teamNumber || 0} seasonYear={seasonYear} />
          </View>
        ))}
        {eventData && eventData.map((event, index) => (
          <View key={`completed-${event.eventCode || index}`} style={{ marginBottom: 5, flexShrink: 0 }}>
            <EventCard eventData={event} teamNumber={teamInfo?.teamNumber || 0} seasonYear={seasonYear} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  header: {
    fontSize: 13, // Reduced font size for better fit on mobile
    fontWeight: '600',
    paddingRight: 10, // Added right padding
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