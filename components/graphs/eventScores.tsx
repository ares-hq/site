// eventScores.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const contributionData = [
  { name: 'Auto', value: 72.65 },
  { name: 'TeleOp', value: 36.71 },
  { name: 'Endgame', value: 15.6 },
];

const COLORS = ['#3B82F6', '#10B981', '#a78bfa'];

const EventScores = () => {
  const total = contributionData.reduce((sum, d) => sum + d.value, 0);
  const legendFormatter = (value: string, entry: any) => {
    const item = contributionData.find((d) => d.name === value);
    const percentage = item ? ((item.value / total) * 100).toFixed(1) + '%' : '';
    return (
      <Text style={{ color: '#000' }}>{`${value}  ${percentage}`}</Text>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OPR Contribution by Phase</Text>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={contributionData}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            innerRadius={60}
            paddingAngle={2}
            cornerRadius={8}
            label={false}
          >
            {contributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, borderColor: '#e5e7eb', fontSize: 12 }}
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            formatter={legendFormatter}
          />
        </PieChart>
      </ResponsiveContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
});

export default EventScores;

