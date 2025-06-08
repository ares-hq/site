import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import UserGraphSection from '@/components/graphs/overtimeGraph';

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
            <Feather name="trending-up" size={12} color={textColor} />
        </View>
        </View>
    </View>
  );
};

const IntoTheDeep = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Overview</Text>
      </View>

      <View style={styles.cardRow}>
        <StatCard
          title="Auto OPR"
          value="72.65"
          change="+11.01"
          positive={true}
          color="indigo"
        />
        <StatCard
          title="TeleOp OPR"
          value="36.71"
          change="-0.03"
          positive={false}
          color="blue"
        />
        <StatCard
          title="Endgame OPR"
          value="15.6"
          change="+15.03"
          positive={true}
          color="indigo"
        />
        <StatCard
          title="Overall OPR"
          value="230.18"
          change="+6.08"
          positive={true}
          color="blue"
        />
      </View>

      <UserGraphSection />
      <View style={styles.headerRow}>
        <Text style={styles.header}>Team Information</Text>
      </View>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Events</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    fontSize: 14,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    minWidth: 150,
    height: 90,
    borderRadius: 12,
    padding: 18,
  },
  title: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 24,
    color: '#000',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  change: {
    fontSize: 12,
  },
});

export default IntoTheDeep;