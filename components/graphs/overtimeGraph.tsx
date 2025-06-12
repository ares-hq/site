import { TeamInfo } from '@/api/dashboardInfo';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ComposedChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartDataPoint {
  name: string;
  current: number;
  average: number;
}

interface UserGraphSectionProps {
  screenWidth: number;
  teamInfo: TeamInfo;
}

interface LayoutEvent {
  nativeEvent: {
    layout: {
      width: number;
      height: number;
    };
  };
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const UserGraphSection = ({ screenWidth, teamInfo }: UserGraphSectionProps) => {
  const [chartWrapperWidth, setChartWrapperWidth] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('Match Score');

  const onChartWrapperLayout = (event: LayoutEvent): void => {
    const { width } = event.nativeEvent.layout;
    setChartWrapperWidth(width);
  };

  const chartData: ChartDataPoint[] = [
    { name: 'Jan', current: 8000, average: 10000 },
    { name: 'Feb', current: 6000, average: 12000 },
    { name: 'Mar', current: 13000, average: 15000 },
    { name: 'Apr', current: 22000, average: 10000 },
    { name: 'May', current: 17000, average: 14000 },
    { name: 'Jun', current: 19000, average: 16000 },
    { name: 'Jul', current: 2200, average: 20000 },
  ];

  const tabs: string[] = ['Match Score', 'Overall OPR', 'Penalties'];

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipLabel}>{label}</Text>
          {payload.map((entry: any, index: number) => (
            <Text key={index} style={[styles.tooltipValue, { color: entry.color }]}>
              {entry.name === 'current' ? 'Current Team' : 'Average'}: {entry.value.toLocaleString()}
            </Text>
          ))}
        </View>
      );
    }
    return null;
  };

  const trafficData = [
    { name: 'Events Attended', value: 15, total: 20 },
    { name: 'Matches Played', value: 120, total: 200 },
    { name: 'Wins', value: 102, total: 120 },
    { name: 'Average Place', value: 3.2, total: 5 },
  ];

  const TeamData = () => (
      <View style={styles.trafficContainer}>
        <View style={styles.trafficHeader}>
          <Text style={styles.trafficTitle}>Team Data</Text>
          <Text style={styles.trafficSubtitle}>Current Season</Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.topRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricName}>{trafficData[0].name}</Text>
              <View style={styles.metricValue}>
                <Text style={styles.valueText}>{trafficData[0].value}</Text>
              </View>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricName}>{trafficData[1].name}</Text>
              <View style={styles.metricValue}>
                <Text style={styles.valueText}>{trafficData[1].value}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricName}>{trafficData[2].name}</Text>
              <View style={styles.metricValue}>
                <Text style={styles.valueText}>{trafficData[2].value}</Text>
                <Text style={styles.totalText}>/ {trafficData[2].total}</Text> {/* only for Wins */}
              </View>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFilled,
                    {
                      width: `${(trafficData[2].value / trafficData[2].total) * 100}%`,
                      backgroundColor: '#10b981',
                    },
                  ]}
                />
                <View style={styles.barEmpty} />
              </View>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricName}>{trafficData[3].name}</Text>
              <View style={styles.metricValue}>
                <Text style={styles.valueText}>{trafficData[3].value.toFixed(1)}</Text>
                <Text style={styles.totalText}>/ {trafficData[3].total}</Text>
              </View>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFilled,
                    {
                      width: `${(trafficData[3].value / trafficData[3].total) * 100}%`,
                      backgroundColor: '#10b981',
                    },
                  ]}
                />
                <View style={styles.barEmpty} />
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>Penalties OPR</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{teamInfo.penalties != null ? Number(teamInfo.penalties).toFixed(2) : '--'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>Overall Rank</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{teamInfo.overallRank}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>Auto Rank</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{teamInfo.autoRank}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>TeleOp Rank</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{teamInfo.teleRank}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '500' }}>Endgame Rank</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{teamInfo.endgameRank}</Text>
          </View>
        </View>
      </View>
  );

  const ChartContent = () => (
    <View style={styles.graphContainer}>
      <View style={styles.tabRow}>
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabButton}
            >
              <Text style={activeTab === tab ? styles.activeTab : styles.inactiveTab}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.divider} />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.circle, { backgroundColor: '#000' }]} />
            <Text style={styles.legendLabel}>Current Team</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.circle, { backgroundColor: 'rgba(59,130,246,0.4)' }]} />
            <Text style={styles.legendLabel}>Average</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartWrapper} onLayout={onChartWrapperLayout}>
        {chartWrapperWidth > 0 && (
          <ResponsiveContainer width={chartWrapperWidth} height={325}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="averageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgba(59, 130, 246, 0.4)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="rgba(59, 130, 246, 0.4)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter' }}
                interval={0}
                tickMargin={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af', fontFamily: 'Inter' }}
                tickCount={4}
                tickMargin={15}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: '#d1d5db',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#000"
                strokeWidth={2}
                fill="url(#currentGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#000' }}
              />
              <Area
                type="monotone"
                dataKey="average"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth={1}
                strokeDasharray="6 3"
                fill="url(#averageGradient)"
                dot={false}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </View>
    </View>
  );

  return (
    <View>
      {screenWidth > 820 ? (
        <View style={styles.section}>
          <ChartContent />
          <TeamData />
        </View>
      ) : (
        <ScrollView horizontal contentContainerStyle={styles.section} showsVerticalScrollIndicator={false}>
          <ChartContent />
          <TeamData />
        </ScrollView>
      )} 
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    gap: 12.6,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 22,
  },
  graphContainer: {
    minWidth: 500,
    flex: 1,
    padding: 17,
    backgroundColor: '#F9F9FA',
    borderRadius: 16,
  },
  chartWrapper: {
    borderRadius: 12.6,
    marginTop: 9,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingVertical: 4.5,
    paddingHorizontal: 9,
  },
  activeTab: {
    color: '#000',
    fontSize: 12.6,
  },
  inactiveTab: {
    color: '#9ca3af',
    fontSize: 12.6,
  },
  trafficContainer: {
    width: 302.4,
    padding: 17,
    backgroundColor: '#F9F9FA',
    borderRadius: 16,
  },
  trafficHeader: {
    marginBottom: 17,
  },
  trafficTitle: {
    fontWeight: '700',
    fontSize: 17.1,
    marginBottom: 1.8,
    color: '#111827',
  },
  trafficSubtitle: {
    fontSize: 12.6,
    color: '#6b7280',
  },
  metricsGrid: {
    gap: 12.6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    paddingHorizontal: 12.6,
    paddingTop: 12.6,
    borderRadius: 9,
  },
  metricName: {
    fontSize: 12.6,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 9,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 9,
  },
  valueText: {
    fontSize: 19.8,
    fontWeight: '700',
    color: '#111827',
  },
  totalText: {
    fontSize: 12.6,
    color: '#9CA3AF',
    marginLeft: 4.5,
  },
  barContainer: {
    height: 4.5,
    width: '100%',
    borderRadius: 1.8,
    flexDirection: 'row',
    marginBottom: 12.6,
  },
  barFilled: {
    borderRadius: 1.8,
  },
  barEmpty: {
    flex: 1,
  },
  tabRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12.6,
  },
  divider: {
    width: 0.54,
    height: 17.1,
    marginHorizontal: 4.5,
    backgroundColor: '#d1d5db',
  },
  legend: {
    paddingHorizontal: 9,
    flexDirection: 'row',
    gap: 17.1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6.3,
  },
  circle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    fontSize: 12.6,
    color: '#000',
  },
  tooltip: {
    backgroundColor: '#fff',
    padding: 9,
    borderRadius: 6.3,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3.6,
    borderWidth: 0.9,
    borderColor: '#e5e7eb',
  },
  tooltipLabel: {
    fontSize: 12.6,
    fontWeight: '600',
    marginBottom: 4.5,
    color: '#000',
  },
  tooltipValue: {
    fontSize: 11.7,
    marginBottom: 1.8,
  },
});

export default UserGraphSection;