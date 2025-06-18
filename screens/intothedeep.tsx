import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  LayoutChangeEvent,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import UserGraphSection from '@/components/graphs/overtimeGraph';
import EventPerformance from '@/components/graphs/eventPerformace';
import EventScores from '@/components/graphs/eventScores';
import InfoBlock from '@/components/teamInfo/infoBlock';
import EventCard from '@/components/teamInfo/eventCard';
import { getAverageOPRs, getTeamInfo, getTeamMatches, getWins } from '@/api/dashboardInfo';
import { getFirstAPI } from '@/api/firstAPI';
import { AllianceInfo, EventInfo, MatchInfo, MatchTypeAverages, TeamInfo } from '@/api/types';
import { attachHourlyAverages, getAverageByMatchType, getAveragePlace, getAwards } from '@/api/averageMatchScores';
import { calculateTeamOPR } from '@/api/calcOPR';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  color: 'blue' | 'indigo';
};

type IntoTheDeepProps = {
  teamNumber: number;
};

const StatCard = ({ title, value, change, positive, color }: StatCardProps) => {
  const backgroundColor = color === 'blue' ? '#E6F1FD' : '#EDEEFC';
  const textColor = positive ? '#16a34a' : '#dc2626';

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{value}</Text>
        <View style={styles.changeRow}>
          <Text style={[styles.change, { color: textColor }]}>{change}</Text>
          <Feather name={positive ? 'trending-up' : 'trending-down'} size={11} color={textColor} />
        </View>
      </View>
    </View>
  );
};

const IntoTheDeep = ({teamNumber} : IntoTheDeepProps) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [matches, setMatches] = useState<AllianceInfo[] | null>(null);
  const [eventData, setEventData] = useState<EventInfo[] | null>(null);
  const [averages, setAverages] = useState<AllianceInfo[] | null>(null);
  const [matchTypeAverages, setMatchTypeAverages] = useState<MatchTypeAverages | null>(null);
  const [wins, setWins] = useState<number | null>(0);
  const [highestScore, setHighScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [averageOPR, setAverageOPR] = useState<{
    autoOPR: number;
    teleOPR: number;
    endgameOPR: number;
    overallOPR: number;
  } | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await getTeamInfo(teamNumber);
        const avg = await getAverageOPRs();
        const match = await getTeamMatches(teamNumber);
        const hourlyAverages = await attachHourlyAverages(match ?? []);
        const matchType = await getAverageByMatchType(match ?? []);
        const highScore = match?.reduce((max, m) => Math.max(max, m.totalPoints), 0) ?? 0;
        const wins = await getWins(match ?? []);
        const eventData = await getFirstAPI(data?.events ?? [''], teamNumber);

        if (data) {
          data.averagePlace = getAveragePlace(eventData ?? []);
          data.achievements = getAwards(eventData ?? []);
          setTeamInfo(data);
        }
        if (avg) setAverageOPR(avg);
        if (match) setMatches(match);
        if (hourlyAverages) setAverages(hourlyAverages);
        if (highScore) setHighScore(highScore);
        if (wins) setWins(wins);
        if (eventData) setEventData(eventData);
        if (matchType) setMatchTypeAverages(matchType);
      } catch (err) {
        console.error('Error fetching dashboard info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Overview</Text>
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
        <Text style={styles.header}>Team Information</Text>
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
        <Text style={styles.header}>Events</Text>
      </View>
      
      <View style={styles.eventContainer}>
        {eventData && eventData.map((event, index) => (
          <View key={index} style={{ marginBottom: 5, flexShrink: 0 }}>
            <EventCard key={index} eventData={event} teamNumber={teamNumber}/>
          </View>
        ))}
      </View>
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  header: {
    fontSize: 15,
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
    minWidth: 162,
    height: 97,
    borderRadius: 13,
    padding: 20,
  },
  title: {
    fontSize: 15,
    color: '#6b7280',
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
    color: '#000',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  change: {
    fontSize: 13,
  },
  chartScrollContainer: {
    gap: 16,
    marginBottom: 20,
    flexDirection: 'row',
  },
  eventContainer: {
    marginBottom: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 999,
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default IntoTheDeep;