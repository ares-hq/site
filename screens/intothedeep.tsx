import React, { useState } from 'react';
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
          <Feather name="trending-up" size={11} color={textColor} />
        </View>
      </View>
    </View>
  );
};

const IntoTheDeep = () => {
  const [containerWidth, setContainerWidth] = useState(0);

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
        <StatCard title="Auto OPR" value="72.65" change="+11.01" positive={true} color="indigo" />
        <StatCard title="TeleOp OPR" value="36.71" change="-0.03" positive={false} color="blue" />
        <StatCard title="Endgame OPR" value="15.6" change="+15.03" positive={true} color="indigo" />
        <StatCard title="Overall OPR" value="230.18" change="+6.08" positive={true} color="blue" />
      </View>

      {containerWidth > 0 && (
        <UserGraphSection screenWidth={containerWidth} />
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
          <EventScores />
          <InfoBlock screenWidth={containerWidth}/>
        </ScrollView>
      ) : (
        <View style={styles.chartScrollContainer}>
          <EventPerformance />
          <EventScores />
          <InfoBlock screenWidth={containerWidth}/>
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