import { TeamInfo } from '@/api/dashboardInfo';
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

const COLORS = ['#92BFFF', '#94E9B8', '#a78bfa'];

interface UserGraphSectionProps {
  teamInfo: TeamInfo;
}
const EventScores = ({ teamInfo }: UserGraphSectionProps) => {
  const rawData = [
    { name: 'Auto', value: teamInfo.autoOPR ?? 0 },
    { name: 'TeleOp', value: (teamInfo.teleOPR ?? 0) - Math.max(teamInfo.endgameOPR ?? 0, 0) },
    { name: 'Endgame', value: teamInfo.endgameOPR ?? 0 },
  ];

  const MAX_PERCENT = 0.6; // 60%
  const totalRaw = rawData.reduce((sum, d) => sum + d.value, 0);

  // Prevent division by zero
  if (totalRaw === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>OPR Contribution by Phase</Text>
        <Text>No data available</Text>
      </View>
    );
  }

  // Normalize to percentages
  const percentages = rawData.map(d => ({
    ...d,
    percent: d.value / totalRaw,
  }));

  // Check if any value exceeds the max
  const exceedsMax = percentages.some(p => p.percent > MAX_PERCENT);

  let adjustedData;

  if (exceedsMax) {
    // Cap the largest value and scale the rest proportionally
    const capped = percentages.map(p => ({
      ...p,
      capped: Math.min(p.percent, MAX_PERCENT),
    }));

    const totalCapped = capped.reduce((sum, p) => sum + p.capped, 0);

    // Scale values back to match totalRaw
    adjustedData = capped.map(p => ({
      ...p,
      rawValue: p.value,
      value: (p.capped / totalCapped) * totalRaw,
    }));
  } else {
    adjustedData = rawData.map(d => ({
      ...d,
      rawValue: d.value,
      value: d.value,
    }));
  }

  const total = adjustedData.reduce((sum, d) => sum + d.value, 0);

  const legendFormatter = (value: string) => {
    const item = adjustedData.find(d => d.name === value);
    const percentage = item ? ((item.value / total) * 100).toFixed(2) + '%' : '';
    return (
      <Text style={{ color: '#6b7280', margin: 5, fontSize: 12 }}>
        {`${value}  ${percentage}`}
      </Text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const { name, rawValue, value } = payload[0].payload;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(2) + '%' : '0.00%';

      return (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            {`${name}: ${rawValue.toFixed(2)} (${percentage})`}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OPR Contribution by Phase</Text>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={adjustedData}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            innerRadius={60}
            paddingAngle={5}
            cornerRadius={8}
            minAngle={20}
          >
            {adjustedData.map((entry, index) => (
              <Cell key={`cell-${Math.min(index, .8)}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
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
    maxWidth: 500,
    minWidth: 400,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    marginBottom: 12,
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

export default EventScores;