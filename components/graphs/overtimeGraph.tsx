import { AllianceInfo, TeamInfo } from '@/api/types';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Area, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface UserGraphSectionProps {
  screenWidth: number;
  teamInfo: TeamInfo;
  matches: AllianceInfo[] | null;
  averages?: AllianceInfo[]; // Now optional since averages are included in matches
  wins: number;
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

const UserGraphSection = ({ screenWidth, teamInfo, matches, averages, wins }: UserGraphSectionProps) => {
  const [chartWrapperWidth, setChartWrapperWidth] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('Match Score');
  const { isDarkMode } = useDarkMode();

  function getBarColor(): string {
    if (teamInfo.averagePlace == null) return '#9ca3af'; // gray for no data
    if (teamInfo.averagePlace <= 5) return '#10b981'; // green
    if (teamInfo.averagePlace <= 10) return '#facc15'; // yellow
    if (teamInfo.averagePlace <= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  const onChartWrapperLayout = (event: LayoutEvent): void => {
    const { width } = event.nativeEvent.layout;
    setChartWrapperWidth(width);
  };

  const tabKeyMap: Record<string, keyof AllianceInfo> = {
    'Match Score': 'totalPoints',
    'Driver Period': 'tele',
    'Penalties': 'penalty',
  };

  const matchData = matches
    ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((match, index, sortedMatches) => {
      const activeKey = tabKeyMap[activeTab];
      
      // Get the corresponding average key
      const averageKey = activeKey === 'totalPoints' ? 'averagePoints' :
                        activeKey === 'tele' ? 'averageTele' :
                        activeKey === 'penalty' ? 'averagePenalty' : 
                        'averagePoints';

      let averageValue = Number(match[averageKey as keyof AllianceInfo] ?? 0);
      
      // Apply smoothing to make the average line more fluid
      if (index > 0 && index < sortedMatches.length - 1) {
        const prevAvg = Number(sortedMatches[index - 1][averageKey as keyof AllianceInfo] ?? averageValue);
        const nextAvg = Number(sortedMatches[index + 1][averageKey as keyof AllianceInfo] ?? averageValue);
        
        // Simple moving average smoothing (30% of neighboring values)
        averageValue = Number((0.4 * averageValue + 0.3 * prevAvg + 0.3 * nextAvg).toFixed(2));
      }

      return {
        name: `M${index + 1}`,
        current: match[activeKey] ?? 0,
        average: averageValue,
      };
    }) ?? [];

  const tabs: string[] = ['Match Score', 'Driver Period', 'Penalties'];

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <View
        style={[
          styles.tooltip,
          {
            backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
            borderColor: isDarkMode ? '#374151' : '#e5e7eb',
          },
        ]}
      >
        <Text
          style={[
            styles.tooltipLabel,
            { color: isDarkMode ? '#F9FAFB' : '#000' },
          ]}
        >
          {`Match ${label ? label.replace(/^M\\s*/, '') : ''}`}
        </Text>
        {payload.map((entry: any, index: number) => (
          <Text
            key={index}
            style={[
              styles.tooltipValue,
              { color: isDarkMode ? '#D1D5DB' : '#374151' },
            ]}
          >
            {entry.name === 'current' ? 'Current Team' : 'Average'}: {entry.value.toLocaleString()}
          </Text>
        ))}
      </View>
    );
  }
  return null;
};

  const trafficData = [
    {
      name: 'Events Attended',
      value: (teamInfo.eventsAttended as string | undefined)?.replace(/[\[\]\s]/g, '')
        .split(',').filter(Boolean).length ?? 0,
      total: 20
    },
    { name: 'Matches Played', value: matches?.length ?? 0, total: 200 },
    { name: 'Wins', value: wins, total: matches?.length ?? 0},
    { 
      name: 'Average Place', 
      value: teamInfo.averagePlace ? teamInfo.averagePlace <= 5 ? 10 : teamInfo.averagePlace <= 10 ? 7.5 : teamInfo.averagePlace <= 20 ? 5 : 2.5 : 0.01,
      total: 10,
    },
  ];

  const TeamData = () => (
      <View style={[
        styles.trafficContainer,
        {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FA',
        }
      ]}>
        <View style={styles.trafficHeader}>
          <Text style={[
            styles.trafficTitle,
            { color: isDarkMode ? '#F9FAFB' : '#111827' }
          ]}>
            Team Data
          </Text>
          <Text style={[
            styles.trafficSubtitle,
            { color: isDarkMode ? '#9CA3AF' : '#6b7280' }
          ]}>
            Current Season
          </Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.topRow}>
            <View style={[
              styles.metricCard,
              {
                backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
              }
            ]}>
              <Text style={[
                styles.metricName,
                { color: isDarkMode ? '#D1D5DB' : '#374151' }
              ]}>
                {trafficData[0].name}
              </Text>
              <View style={styles.metricValue}>
                <Text style={[
                  styles.valueText,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' }
                ]}>
                  {trafficData[0].value}
                </Text>
              </View>
            </View>
            <View style={[
              styles.metricCard,
              {
                backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
              }
            ]}>
              <Text style={[
                styles.metricName,
                { color: isDarkMode ? '#D1D5DB' : '#374151' }
              ]}>
                {trafficData[1].name}
              </Text>
              <View style={styles.metricValue}>
                <Text style={[
                  styles.valueText,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' }
                ]}>
                  {trafficData[1].value}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <View style={[
              styles.metricCard,
              {
                backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
              }
            ]}>
              <Text style={[
                styles.metricName,
                { color: isDarkMode ? '#D1D5DB' : '#374151' }
              ]}>
                {trafficData[2].name}
              </Text>
              <View style={styles.metricValue}>
                <Text style={[
                  styles.valueText,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' }
                ]}>
                  {trafficData[2].value}
                </Text>
                <Text style={[
                  styles.totalText,
                  { color: isDarkMode ? '#6B7280' : '#9CA3AF' }
                ]}>
                  / {trafficData[2].total}
                </Text>
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
                <View style={[
                  styles.barEmpty,
                  { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }
                ]} />
              </View>
            </View>

          <View style={[
            styles.metricCard,
            {
              backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
            }
          ]}>
            <Text style={[
              styles.metricName,
              { color: isDarkMode ? '#D1D5DB' : '#374151' }
            ]}>
              {trafficData[3].name}
            </Text>
            <View style={styles.metricValue}>
              <Text style={[
                styles.valueText,
                { color: isDarkMode ? '#F9FAFB' : '#111827' }
              ]}>
                {teamInfo.averagePlace}
              </Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFilled,
                  {
                    width: trafficData[3].value /  trafficData[3].total * 100,
                    backgroundColor: getBarColor(),
                  },
                ]}
              />
              <View style={[
                styles.barEmpty,
                { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }
              ]} />
            </View>
          </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={[
              { fontSize: 12, fontWeight: '500' },
              { color: isDarkMode ? '#D1D5DB' : '#374151' }
            ]}>
              Penalties OPR
            </Text>
            <Text style={[
              { fontSize: 14, fontWeight: '600' },
              { color: isDarkMode ? '#F9FAFB' : '#111827' }
            ]}>
              {teamInfo.penalties != null ? Number(teamInfo.penalties).toFixed(2) : '--'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={[
              { fontSize: 12, fontWeight: '500' },
              { color: isDarkMode ? '#D1D5DB' : '#374151' }
            ]}>
              Overall Rank
            </Text>
            <Text style={[
              { fontSize: 14, fontWeight: '600' },
              { color: isDarkMode ? '#F9FAFB' : '#111827' }
            ]}>
              {teamInfo.overallRank}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={[
              { fontSize: 12, fontWeight: '500' },
              { color: isDarkMode ? '#D1D5DB' : '#374151' }
            ]}>
              Auto Rank
            </Text>
            <Text style={[
              { fontSize: 14, fontWeight: '600' },
              { color: isDarkMode ? '#F9FAFB' : '#111827' }
            ]}>
              {teamInfo.autoRank}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={[
              { fontSize: 12, fontWeight: '500' },
              { color: isDarkMode ? '#D1D5DB' : '#374151' }
            ]}>
              TeleOp Rank
            </Text>
            <Text style={[
              { fontSize: 14, fontWeight: '600' },
              { color: isDarkMode ? '#F9FAFB' : '#111827' }
            ]}>
              {teamInfo.teleRank}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            <Text style={[
              { fontSize: 12, fontWeight: '500' },
              { color: isDarkMode ? '#D1D5DB' : '#374151' }
            ]}>
              Endgame Rank
            </Text>
            <Text style={[
              { fontSize: 14, fontWeight: '600' },
              { color: isDarkMode ? '#F9FAFB' : '#111827' }
            ]}>
              {teamInfo.endgameRank}
            </Text>
          </View>
        </View>
      </View>
  );

  const ChartContent = () => (
    <View style={[
      styles.graphContainer,
      {
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FA',
      }
    ]}>
      <View style={styles.tabRow}>
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabButton}
            >
              <Text style={[
                activeTab === tab ? styles.activeTab : styles.inactiveTab,
                {
                  color: activeTab === tab 
                    ? (isDarkMode ? '#F9FAFB' : '#000')
                    : (isDarkMode ? '#6B7280' : '#9ca3af')
                }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[
          styles.divider,
          { backgroundColor: isDarkMode ? '#4B5563' : '#d1d5db' }
        ]} />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[
              styles.circle, 
              { backgroundColor: isDarkMode ? '#F9FAFB' : '#000' }
            ]} />
            <Text style={[
              styles.legendLabel,
              { color: isDarkMode ? '#F9FAFB' : '#000' }
            ]}>
              Current Team
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.circle, { backgroundColor: 'rgba(59,130,246,0.4)' }]} />
            <Text style={[
              styles.legendLabel,
              { color: isDarkMode ? '#F9FAFB' : '#000' }
            ]}>
              Average
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartWrapper} onLayout={onChartWrapperLayout}>
        {chartWrapperWidth > 0 && (
          <ResponsiveContainer width={chartWrapperWidth} height={325}>
            <ComposedChart data={matchData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDarkMode ? "#F9FAFB" : "#000"} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={isDarkMode ? "#F9FAFB" : "#000"} stopOpacity={0} />
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
                tick={{ 
                  fontSize: 10, 
                  fill: isDarkMode ? '#6B7280' : '#9ca3af', 
                  fontFamily: 'Inter' 
                }}
                tickMargin={15}
                interval={(matchData.length > 9) ? Math.ceil((matchData.length - 2) / 8) : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 10, 
                  fill: isDarkMode ? '#6B7280' : '#9ca3af', 
                  fontFamily: 'Inter' 
                }}
                tickCount={4}
                tickMargin={15}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: isDarkMode ? '#4B5563' : '#d1d5db',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke={isDarkMode ? "#F9FAFB" : "#000"}
                strokeWidth={2}
                fill="url(#currentGradient)"
                dot={false}
                activeDot={{ r: 4, fill: isDarkMode ? "#F9FAFB" : "#000" }}
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
        <View style={[
          styles.section, 
          { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff' }
        ]}>
          <ChartContent />
          <TeamData />
        </View>
      ) : (
        <ScrollView 
          horizontal 
          contentContainerStyle={[
            styles.section,
            { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff' }
          ]} 
          showsVerticalScrollIndicator={false}
        >
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
    borderRadius: 16,
    marginBottom: 22,
  },
  graphContainer: {
    minWidth: 500,
    flex: 1,
    padding: 17,
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
    fontSize: 12.6,
  },
  inactiveTab: {
    fontSize: 12.6,
  },
  trafficContainer: {
    width: 302.4,
    padding: 17,
    borderRadius: 16,
  },
  trafficHeader: {
    marginBottom: 17,
  },
  trafficTitle: {
    fontWeight: '700',
    fontSize: 17.1,
    marginBottom: 1.8,
  },
  trafficSubtitle: {
    fontSize: 12.6,
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
    paddingHorizontal: 12.6,
    paddingTop: 12.6,
    borderRadius: 9,
  },
  metricName: {
    fontSize: 12.6,
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
  },
  totalText: {
    fontSize: 12.6,
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
    borderRadius: 1.8,
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
  },
  tooltip: {
    padding: 9,
    borderRadius: 6.3,
    elevation: 3.6,
    borderWidth: 0.9,
  },
  tooltipLabel: {
    fontSize: 12.6,
    fontWeight: '600',
    marginBottom: 4.5,
  },
  tooltipValue: {
    fontSize: 11.7,
    marginBottom: 1.8,
  },
});

export default UserGraphSection;