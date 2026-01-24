import { MatchTypeAverages } from '@/api/utils/types';
import { useDarkMode } from '@/context/DarkModeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  const { isDarkMode } = useDarkMode();
  
  if (active && payload && payload.length > 0) {
    const { name, payload: data } = payload[0];
    const matchScore = data['Match Score'];

    return (
      <View style={[
        styles.tooltip,
        {
          backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        }
      ]}>
        <Text style={[
          styles.tooltipText,
          { color: isDarkMode ? '#F9FAFB' : '#000' }
        ]}>
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
  const { isDarkMode } = useDarkMode();

  const rankData = [
    { name: 'Qualifier', 'Match Score': matchType.qual, fill: '#9F9FF8' },
    { name: 'Finals', 'Match Score': matchType.finals, fill: '#96E2D6' },
  ];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#f9fafb',
        borderColor: isDarkMode ? '#374151' : 'transparent',
        // borderWidth: 1,
      }
    ]}>
      <Text style={[
        styles.title,
        { color: isDarkMode ? '#F9FAFB' : '#000' }
      ]}>
        Average Match Score
      </Text>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rankData}
          margin={{ top: 10, right: 0, bottom: 0, left: -25 }}
          barCategoryGap="25%"
        >
          <XAxis
            dataKey="name"
            tick={{ 
              fontSize: 12, 
              fill: isDarkMode ? '#9CA3AF' : '#6b7280', 
              fontFamily: 'Arial' 
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ 
              fontSize: 12, 
              fill: isDarkMode ? '#6B7280' : '#9ca3af', 
              fontFamily: 'Arial' 
            }}
            axisLine={false}
            tickLine={false}
            tickCount={4}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="Match Score" radius={6} barSize={30} minPointSize={5}>
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
    flex: 1,
    minWidth: 300,
    minHeight: 300,
    padding: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 16,
    marginBottom: 22,
  },
  tooltip: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
  },
  tooltipText: {
    fontSize: 12,
  },
});

export default EventPerformance;