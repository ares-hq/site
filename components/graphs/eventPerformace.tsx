// eventPerformance.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

const rankData = [
  { name: 'Auto', value: 1000, fill: '#a78bfa' },
  { name: 'TeleOp', value: 2021, fill: '#6ee7b7' },
  { name: 'Endgame', value: 202, fill: '#60a5fa' },
];

const EventPerformance = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OPR Rank by Phase</Text>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rankData}
          margin={{ top: 10, right: 0, bottom: 0, left: -25 }}
          barCategoryGap="25%"
          barGap={4}
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
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 12, backgroundColor: 'white', fontFamily: 'Arial' }}
          />
          <Bar dataKey="value" radius={6} barSize={30}>
            {rankData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
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
    width: 300,
    padding: 20,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 16,
    marginBottom: 22,
    color: '#000',
  },
});

export default EventPerformance;