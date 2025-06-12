import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import UserGraphSection from '@/components/graphs/overtimeGraph';
import EventPerformance from '@/components/graphs/eventPerformace';
import EventScores from '@/components/graphs/eventScores';
import InfoBlock from '@/components/teamInfo/infoBlock';
import EventCard from '@/components/teamInfo/eventCard';
import { getAverageOPRs, getTeamInfo, TeamInfo } from '@/api/dashboardInfo';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  color: 'blue' | 'indigo';
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, positive, color }) => {
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

const IntoTheDeep = () => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [averageOPR, setAverageOPR] = useState<{
    autoOPR: number;
    teleOPR: number;
    endgameOPR: number;
    overallOPR: number;
  } | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const data = await getTeamInfo(3081);
      if (data) setTeamInfo(data);
    };
    fetchInfo();
      const fetchAvg = async () => {
      const avg = await getAverageOPRs();
      setAverageOPR(avg);
    };
    fetchAvg();
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
          title="Auto OPR" 
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

      {containerWidth > 0 && teamInfo &&(
        <UserGraphSection screenWidth={containerWidth} teamInfo={teamInfo}/>
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
          <EventPerformance />
          {teamInfo && <EventScores teamInfo={teamInfo} />}
          {teamInfo && (
            <InfoBlock screenWidth={containerWidth} teamInfo={teamInfo} />
          )}
        </ScrollView>
      ) : (
        <View style={styles.chartScrollContainer}>
          <EventPerformance />
          {teamInfo && <EventScores teamInfo={teamInfo} />}
          {teamInfo && (
            <InfoBlock screenWidth={containerWidth} teamInfo={teamInfo} />
          )}
        </View>
      )}


      <View style={styles.headerRow}>
        <Text style={styles.header}>Events</Text>
      </View>
      
      <View style={styles.eventContainer}>
        <EventCard />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // ensure layout width can be measured
    paddingHorizontal: 4,
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
});

export default IntoTheDeep;