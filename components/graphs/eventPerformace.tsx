// eventPerformance.tsx
import { MatchTypeAverages } from '@/api/types';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length > 0) {
    const { name, payload: data } = payload[0];
    const matchScore = data['Match Score'];

    return (
      <View style={styles.tooltip}>
        <Text style={styles.tooltipText}>
          {`${name}: ${matchScore.toFixed(2)}`}
        </Text>
      </View>
    );
  }
  return null;
};

interface UserGraphSectionProps {
  matchType: MatchTypeAverages;
}

const EventPerformance = ({ matchType }: UserGraphSectionProps) => {
  const rankData = [
    { name: 'Qualifier', 'Match Score': matchType.qual, fill: '#9F9FF8' },
    { name: 'Finals', 'Match Score': matchType.finals, fill: '#96E2D6' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Average Match Score</Text>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rankData}
          margin={{ top: 10, right: 0, bottom: 0, left: -25 }}
          barCategoryGap="25%"
        >
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6b7280', fontFamily: 'Arial' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'Arial' }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            // contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 12, backgroundColor: 'white', fontFamily: 'Arial', marginBottom: -5 }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="Match Score" radius={6} barSize={30}>
            {rankData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: 250,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 16,
    marginBottom: 22,
    color: '#000',
  },
  tooltip: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  tooltipText: {
    fontSize: 12,
    color: '#000',
  },
});

export default EventPerformance;