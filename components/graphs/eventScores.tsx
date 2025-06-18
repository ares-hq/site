import { TeamInfo } from '@/api/types';
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

  const MAX_PERCENT = 0.6;
  const MIN_PERCENT = 0.00001;

  const totalRaw = rawData.reduce((sum, d) => sum + (d.value > 0 ? d.value : 0), 0);

  const contributionData = rawData.map(d => {
    const clampedRaw = d.value > 0 ? d.value : 0;
    const percentage = totalRaw > 0 ? clampedRaw / totalRaw : 0;
    const boundedPercentage = Math.max(
      Math.min(percentage, MAX_PERCENT),
      d.value <= 0 ? MIN_PERCENT : 0
    );
    return {
      ...d,
      rawValue: d.value,
      value: boundedPercentage * totalRaw,
    };
  });

  const total = contributionData.reduce((sum, d) => sum + d.value, 0);

  const legendFormatter = (value: string) => {
    const item = contributionData.find(d => d.name === value);
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
            data={contributionData}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            innerRadius={60}
            paddingAngle={5}
            cornerRadius={8}
            minAngle={20}
          >
            {contributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{outline: 'none'}}/>
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