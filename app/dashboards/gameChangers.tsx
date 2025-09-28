import { attachHourlyAverages, getAverageByMatchType, getAveragePlace, getAwards } from '@/api/averageMatchScores';
import { getAverageOPRs, getCurrentUserTeam, getTeamInfo, getTeamMatches, getWins, SupportedYear } from '@/api/dashboardInfo';
import { getFirstAPI } from '@/api/firstAPI';
import { AllianceInfo, EventInfo, MatchTypeAverages, TeamInfo } from '@/api/types';
import EventPerformance from '@/components/graphs/eventPerformace';
import EventScores from '@/components/graphs/eventScores';
import UserGraphSection from '@/components/graphs/overtimeGraph';
import EventCard from '@/components/teamInfo/eventCard';
import InfoBlock from '@/components/teamInfo/infoBlock';
import { useDarkMode } from '@/context/DarkModeContext';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    LayoutChangeEvent,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  color: 'blue' | 'indigo';
};

const StatCard = ({ title, value, change, positive, color }: StatCardProps) => {
  const { isDarkMode } = useDarkMode();
  
  const getBackgroundColor = () => {
    if (isDarkMode) {
      return color === 'blue' ? 'rgba(30, 58, 138, 0.4)' : 'rgba(55, 48, 163, 0.4)';
    }
    return color === 'blue' ? '#E6F1FD' : '#EDEEFC';
  };

  const textColor = positive ? '#16a34a' : '#dc2626';

  return (
    <View style={[styles.card, { backgroundColor: getBackgroundColor() }]}>
      <Text style={[
        styles.title,
        { color: isDarkMode ? '#D1D5DB' : '#6b7280' }
      ]}>
        {title}
      </Text>
      <View style={styles.row}>
        <Text style={[
          styles.value,
          { color: isDarkMode ? '#F9FAFB' : '#000' }
        ]}>
          {value}
        </Text>
        <View style={styles.changeRow}>
          <Text style={[styles.change, { color: textColor }]}>{change}</Text>
          <Feather name={positive ? 'trending-up' : 'trending-down'} size={11} color={textColor} />
        </View>
      </View>
    </View>
  );
};

const gameChangers = () => {  
  const params = useLocalSearchParams();
  const teamParam = Array.isArray(params.teamnumber) ? params.teamnumber[0] : params.teamnumber;
  const yearParamRaw =
    (Array.isArray(params.year) ? params.year[0] : (params.year as string | undefined)) ??
    (Array.isArray(params.season) ? params.season[0] : (params.season as string | undefined));
  
  // Parse and validate the year
  const parsedYear = Number(yearParamRaw) || 2020; // Default to 2022 instead of current year
  const seasonYear: SupportedYear = [2019, 2020, 2021, 2022, 2023, 2024, 2025].includes(parsedYear as SupportedYear) 
    ? (parsedYear as SupportedYear) 
    : 2020; // Default to 2022 if invalid year
    
  const { teamnumber } = useLocalSearchParams();
  const [containerWidth, setContainerWidth] = useState(0);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [matches, setMatches] = useState<AllianceInfo[] | null>(null);
  const [eventData, setEventData] = useState<EventInfo[] | null>(null);
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
        // Ensure it's a number
        teamNumber = typeof userTeam === 'string' ? parseInt(userTeam, 10) : userTeam;
      } else {
        teamNumber = Number(teamnumber);
      }
      
      if (isNaN(teamNumber)) {
        console.error('Invalid team number:', teamNumber);
        setLoading(false);
        return;
      }

      // Pass the seasonYear to all API calls
      const data = await getTeamInfo(teamNumber, seasonYear);
      console.log('Team info received:', data); // Debug log
      
      if (!data) {
        setNoDataForYear(true);
        setLoading(false);
        return;
      }
      
      const avg = await getAverageOPRs(seasonYear);
      const match = await getTeamMatches(teamNumber, seasonYear);
      const enhancedMatches = await attachHourlyAverages(match ?? [], seasonYear);
      const matchType = await getAverageByMatchType(match ?? []);
      const highScore = match?.reduce((max, m) => Math.max(max, m.totalPoints), 0) ?? 0;
      const wins = await getWins(match ?? []);
      
      // Make sure we have events before calling getFirstAPI
      const events = data?.events ?? [];
      console.log('Events for team:', events); // Debug log
      
      const eventData = events.length > 0 ? await getFirstAPI(events, teamNumber, seasonYear) : [];
      console.log('Event data received:', eventData); // Debug log

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
      if (matchType) setMatchTypeAverages(matchType);
    } catch (err) {
      console.error('Error fetching dashboard info for year', seasonYear, ':', err);
      setNoDataForYear(true);
    } finally {
      setLoading(false);
    }
  };
  fetchInfo();
}, [teamnumber, seasonYear]); // Add seasonYear to dependencies

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const getSeasonDisplayText = () => {
    // Map years to game names if you have them, otherwise just show the year
    const gameNames: Record<SupportedYear, string> = {
      2019: '2019 - Skystone',
      2020: '2020 - Ultimate Goal',
      2021: '2021 - Freight Frenzy',
      2022: '2022 - Power Play',
      2023: '2023 - Centerstage',
      2024: '2024 - Into the Deep',
      2025: '2025 - Decode',
    };
    
    return gameNames[seasonYear] || `${seasonYear} Season`;
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
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Overview
        </Text>
        <View style={styles.seasonBadge}>
          <Text style={[
            styles.seasonText,
            { 
              color: isDarkMode ? '#E5E7EB' : '#374151',
              backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
            }
          ]}>
            {getSeasonDisplayText()}
          </Text>
        </View>
      </View>

      <View style={styles.cardRow}>
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
        />
      </View>

      {containerWidth > 0 && teamInfo && matches && averages && wins &&(
        <UserGraphSection matches={matches} averages={averages} screenWidth={containerWidth} teamInfo={teamInfo} wins={wins}/>
      )}

      <View style={styles.headerRow}>
        <Text style={[
          styles.header,
          { color: isDarkMode ? '#F9FAFB' : '#111827' }
        ]}>
          Team Information
        </Text>
      </View>
      
      {containerWidth < 1250 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          {matchTypeAverages && <EventPerformance matchType={matchTypeAverages}/>}
          {teamInfo && <EventScores teamInfo={teamInfo} />}
          {teamInfo && (
            <View style={{ minWidth: 550, flexShrink: 0 }}>
              <InfoBlock screenWidth={containerWidth} teamInfo={teamInfo} highScore={highestScore}/>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.chartScrollContainer}>
          {matchTypeAverages && <EventPerformance matchType={matchTypeAverages}/>}
          {teamInfo && <EventScores teamInfo={teamInfo} />}
          {teamInfo && (
            <InfoBlock screenWidth={containerWidth} teamInfo={teamInfo} highScore={highestScore}/>
          )}
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
        {eventData && eventData.map((event, index) => (
          <View key={index} style={{ marginBottom: 5, flexShrink: 0 }}>
            <EventCard eventData={event} teamNumber={teamInfo?.teamNumber || 0} />
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
    marginBottom: 9,
  },
  header: {
    fontSize: 15,
    fontWeight: '600',
  },
  seasonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  card: {
    flex: 1,
    minWidth: 220,
    height: 97,
    borderRadius: 13,
    padding: 20,
  },
  title: {
    fontSize: 15,
    marginBottom: 9,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  value: {
    fontSize: 26,
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

export default gameChangers;