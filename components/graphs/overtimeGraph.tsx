import { getTeamCount } from '@/api/dashboardInfo';
import { AllianceInfo, TeamInfo } from '@/api/utils/types';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Area, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface UserGraphSectionProps {
  screenWidth: number;
  teamInfo: TeamInfo;
  matches: AllianceInfo[] | null;
  averages?: AllianceInfo[]; // Now optional since averages are included in matches
  wins: number;
  year: number;
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

const UserGraphSection = ({ screenWidth, teamInfo, matches, averages, wins, year }: UserGraphSectionProps) => {
  const [chartWrapperWidth, setChartWrapperWidth] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('Match Score');
  const [teamCount, setTeamCount] = useState<number>(60); // default to 60
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    const fetchTeamCount = async () => {
      try {
        const count = await getTeamCount(year as any); // cast to SupportedYear
        setTeamCount(count);
      } catch (error) {
        console.error('Failed to fetch team count:', error);
      }
    };
    fetchTeamCount();
  }, [year]);

  // Helper function to calculate percentile from rank (lower rank = higher percentile)
  const rankToPercentile = (rank: number | null | undefined): number | null => {
    if (rank == null || rank <= 0) return null;
    // Percentile calculation: (teams ranked worse / total teams) * 100
    // Formula: (1 - (rank - 1) / (estimated_total_teams - 1)) * 100
    // Using actual team count for the year
    const estimatedTotalTeams = teamCount;
    const percentile = (1 - (rank - 1) / (estimatedTotalTeams - 1)) * 100;
    return Math.max(0, Math.floor(percentile)) == 100 ? 99 : Math.max(0, Math.floor(percentile));
  };

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
      // support both string (CSV) and numeric representations
      value: (() => {
        const ev = teamInfo.eventsAttended as unknown;
        if (typeof ev === 'string') return ev.replace(/[\[\]\s]/g, '').split(',').filter(Boolean).length;
        if (typeof ev === 'number') return ev;
        return 0;
      })(),
      total: 20
    },
    { name: 'Matches Played', value: matches?.length ?? 0, total: 200 },
    { name: 'Wins', value: wins, total: matches?.length ?? 0},
    { 
      name: 'Average Place', 
      // Normalize average place so higher is better for the visual (10 = top, 0 = bottom)
      value: teamInfo.averagePlace != null
        ? teamInfo.averagePlace <= 5 ? 10
        : teamInfo.averagePlace <= 10 ? 7.5
        : teamInfo.averagePlace <= 20 ? 5
        : 2.5
        : 0.01,
      total: 10,
    },
  ];

  // Penalty metrics (penalties stored as string in TeamInfo)
  const penaltyValue = teamInfo.penalties ? Number(String(teamInfo.penalties).replace(/[^0-9.-]+/g, '')) : null;

  const TeamData = () => (
      <View style={[
        styles.trafficContainer,
        screenWidth <= 820 && styles.trafficContainerMobile,
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
            styles.trafficSubheader,
            { color: isDarkMode ? '#9CA3AF' : '#6b7280' }
          ]}>
            Performance Overview
          </Text>
        </View>
        
        <View style={styles.metricsCompactGrid}>
          {/* Events Attended */}
          <View style={[styles.compactMetricCard]}>
            <Text style={[styles.compactLabel, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>Events Attended</Text>
            <Text style={[styles.compactValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{trafficData[0].value}</Text>
          </View>

          {/* Matches Played */}
          <View style={[styles.compactMetricCard]}>
            <Text style={[styles.compactLabel, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>Matches Played</Text>
            <Text style={[styles.compactValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{trafficData[1].value}</Text>
          </View>

          {/* Wins with visual bar */}
          <View style={[styles.compactMetricCard]}>
            <View style={styles.compactHeader}>
              <Text style={[styles.compactLabel, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>Wins</Text>
              <View style={styles.winsValueRow}>
                <Text style={[styles.compactValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{wins}</Text>
                <Text style={[styles.winsTotal, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>/{matches?.length ?? 0}</Text>
              </View>
            </View>
            {(() => {
              const winPct = matches?.length ? (wins / matches.length) * 100 : 0;
              let winColor = '#ef4444';
              if (winPct >= 60) winColor = '#10b981';
              else if (winPct >= 40) winColor = '#facc15';
              return (
                <View style={[styles.winBarSmall, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }]}>
                  <View 
                    style={[
                      styles.winBarFillSmall, 
                      { 
                        width: `${winPct}%`,
                        backgroundColor: winColor
                      }
                    ]} 
                  />
                </View>
              );
            })()}
          </View>

          {/* Average Place with visual indicator */}
          <View style={[styles.compactMetricCard]}>
            <View style={styles.compactHeader}>
              <Text style={[styles.compactLabel, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>Avg Place</Text>
              <Text style={[styles.compactValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.averagePlace ?? '--'}</Text>
            </View>
            {(() => {
              const place = teamInfo.averagePlace;
              if (place == null) return null;
              let badgeColor = '#ef4444';
              let badgeLabel = 'Poor';
              if (place <= 5) { 
                badgeColor = '#10b981'; 
                badgeLabel = 'Excellent'; 
              } else if (place <= 10) { 
                badgeColor = '#06b6d4'; 
                badgeLabel = 'Good'; 
              } else if (place <= 20) { 
                badgeColor = '#f97316'; 
                badgeLabel = 'Fair'; 
              }
              return (
                <View style={[styles.placeBadge, { backgroundColor: badgeColor }]}>
                  <Text style={styles.placeBadgeText}>{badgeLabel}</Text>
                </View>
              );
            })()}
          </View>
        </View>

        {/* Penalty Rank Box */}
        <View style={[styles.penaltyBoxTop, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
          <View style={styles.rankRowsBottom}>
            <View style={styles.rankItemBottom}>
              <Text style={[styles.rankLabelSmall, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Penalty Rank</Text>
              <Text style={[styles.rankValueSmall, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.penaltyRank ?? '--'}</Text>
              <Text style={[styles.rankSubtext, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>{rankToPercentile(teamInfo.penaltyRank) != null ? `P${rankToPercentile(teamInfo.penaltyRank)}` : '--'}</Text>
            </View>
            <View style={styles.rankItemBottom}>
              <Text style={[styles.rankLabelSmall, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Penalty OPR</Text>
              <Text style={[styles.rankValueSmall, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{penaltyValue != null && !isNaN(penaltyValue) ? penaltyValue.toFixed(1) : '--'}</Text>
            </View>
          </View>
        </View>

        {/* Ranks Box */}
        <View style={[styles.ranksBoxBottom, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]}>
          <View style={styles.rankHeader}>
            <Text style={[styles.rankTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>Ranks</Text>
          </View>
          <View style={styles.rankRowsBottom}>
            <View style={styles.rankItemBottom}>
              <Text style={[styles.rankLabelSmall, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Overall</Text>
              <Text style={[styles.rankValueSmall, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.overallRank ?? '--'}</Text>
              <Text style={[styles.rankSubtext, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>{rankToPercentile(teamInfo.overallRank) != null ? `P${rankToPercentile(teamInfo.overallRank)}` : '--'}</Text>
            </View>
            <View style={styles.rankItemBottom}>
              <Text style={[styles.rankLabelSmall, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Auto</Text>
              <Text style={[styles.rankValueSmall, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.autoRank ?? '--'}</Text>
              <Text style={[styles.rankSubtext, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>{rankToPercentile(teamInfo.autoRank) != null ? `P${rankToPercentile(teamInfo.autoRank)}` : '--'}</Text>
            </View>
            <View style={styles.rankItemBottom}>
              <Text style={[styles.rankLabelSmall, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Tele</Text>
              <Text style={[styles.rankValueSmall, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.teleRank ?? '--'}</Text>
              <Text style={[styles.rankSubtext, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>{rankToPercentile(teamInfo.teleRank) != null ? `P${rankToPercentile(teamInfo.teleRank)}` : '--'}</Text>
            </View>
            <View style={styles.rankItemBottom}>
              <Text style={[styles.rankLabelSmall, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>End</Text>
              <Text style={[styles.rankValueSmall, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.endgameRank ?? '--'}</Text>
              <Text style={[styles.rankSubtext, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>{rankToPercentile(teamInfo.endgameRank) != null ? `P${rankToPercentile(teamInfo.endgameRank)}` : '--'}</Text>
            </View>
          </View>
        </View>
      </View>
  );

  const ChartContent = () => (
    <View style={[
      styles.graphContainer,
      screenWidth <= 820 && styles.graphContainerMobile,
      {
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FA',
      }
    ]}>
      <View style={[styles.tabRow, screenWidth <= 820 && styles.tabRowMobile]}>
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
        {screenWidth > 820 && (
          <View style={[
            styles.divider,
            { backgroundColor: isDarkMode ? '#4B5563' : '#d1d5db' }
          ]} />
        )}
        <View style={[styles.legend, screenWidth <= 820 && styles.legendMobile]}>
          <View style={styles.legendItem}>
            <View style={[
              styles.circle, 
              { backgroundColor: isDarkMode ? '#F9FAFB' : '#000' }
            ]} />
            <Text style={[
              styles.legendLabel,
              { color: isDarkMode ? '#F9FAFB' : '#000' }
            ]}>
              {screenWidth <= 820 ? 'Team' : 'Current Team'}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.circle, { backgroundColor: 'rgba(59,130,246,0.4)' }]} />
            <Text style={[
              styles.legendLabel,
              { color: isDarkMode ? '#F9FAFB' : '#000' }
            ]}>
              {screenWidth <= 820 ? 'Avg' : 'Average'}
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
                  fill: isDarkMode ? '#9CA3AF' : '#6b7280', 
                  fontFamily: 'Arial' 
                }}
                tickMargin={15}
                interval={(matchData.length > 9) ? Math.ceil((matchData.length - 2) / 8) : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 10, 
                  fill: isDarkMode ? '#9CA3AF' : '#6b7280', 
                  fontFamily: 'Arial' 
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
        <View
          style={[
            styles.section,
            styles.sectionMobile,
            { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff' }
          ]}
        >
          <ChartContent />
          <TeamData />
        </View>
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
    minWidth: 0,
    flex: 1,
    padding: 17,
    borderRadius: 16,
  },
  sectionMobile: {
    flexDirection: 'column',
    gap: 12.6,
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
    padding: 14,
    borderRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  /* Mobile overrides */
  graphContainerMobile: {
    width: '100%',
    minWidth: 0,
  },
  trafficContainerMobile: {
    width: '100%',
  },
  metricsCompactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  compactMetricCard: {
    flex: 1,
    minWidth: '48%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  compactHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  compactValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  winsValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  winsTotal: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  winBarSmall: {
    height: 16,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
    width: '100%',
  },
  winBarFillSmall: {
    height: '100%',
    borderRadius: 3,
  },
  placeIndicator: {
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  placeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: 4,
    marginTop: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 16,
  },
  placeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  penaltyBoxTop: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  ranksBoxBottom: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  rankRowsBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  rankItemBottom: {
    flex: 1,
    alignItems: 'center',
    minWidth: 40,
  },
  rankLabelSmall: {
    fontSize: 10,
    fontWeight: '500',
  },
  rankValueSmall: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  rankSubtext: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '500',
  },
  trafficHeader: {
    marginBottom: 0,
    alignItems: 'center',
  },
  rankHeader: {
    marginBottom: 5,
    marginTop: -5,
    alignItems: 'center',
  },
  rankTitle: {
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 0,
    textAlign: 'center',
  },
  trafficTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 0,
    textAlign: 'center',
  },
  trafficSubheader: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
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
    height: 6,
    width: '100%',
    borderRadius: 6,
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  barFilled: {
    borderRadius: 6,
    height: '100%',
    minWidth: 6,
  },
  barEmpty: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  tabRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12.6,
  },
  tabRowMobile: {
    flexDirection: 'column',
    alignItems: 'center',
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
  legendMobile: {
    marginTop: 8,
    justifyContent: 'center',
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