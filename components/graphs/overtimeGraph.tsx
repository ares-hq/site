import { AllianceInfo, TeamInfo } from '@/api/utils/types';
import TeamRadar from '@/components/dashboards/TeamRadar';
import { useTheme } from '@/components/shared/theme';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Area, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// SVG <text> defaults to serif — force the app's system sans stack on every axis tick.
const CHART_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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
  const th = useTheme();

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
      <View style={[styles.tooltip, { backgroundColor: th.c.raised, borderColor: th.c.border }]}>
        <Text style={[styles.tooltipLabel, { color: th.c.text }]}>
          {`Match ${label ? label.replace(/^M\\s*/, '') : ''}`}
        </Text>
        {payload.map((entry: any, index: number) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: entry.name === 'current' ? th.c.accent : th.c.textFaint }} />
            <Text style={[styles.tooltipValue, { color: th.c.textMuted }]}>
              {entry.name === 'current' ? 'This team' : 'Field avg'}: {entry.value.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  return null;
};

  const ChartContent = () => (
    <View style={[
      styles.graphContainer,
      screenWidth <= 820 && styles.graphContainerMobile,
      { backgroundColor: th.c.surface, borderColor: th.c.border, borderWidth: 1 },
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
                { color: activeTab === tab ? th.c.text : th.c.textFaint }
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {screenWidth > 820 && (
          <View style={[
            styles.divider,
            { backgroundColor: th.c.border }
          ]} />
        )}
        <View style={[styles.legend, screenWidth <= 820 && styles.legendMobile]}>
          <View style={styles.legendItem}>
            <View style={[styles.circle, { backgroundColor: th.c.accent }]} />
            <Text style={[styles.legendLabel, { color: th.c.textMuted }]}>
              {screenWidth <= 820 ? 'Team' : 'This team'}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.circle, { backgroundColor: th.c.textFaint }]} />
            <Text style={[styles.legendLabel, { color: th.c.textMuted }]}>
              {screenWidth <= 820 ? 'Avg' : 'Field average'}
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
                  <stop offset="5%" stopColor={th.c.accent} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={th.c.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: th.c.textMuted, fontFamily: CHART_FONT }}
                tickMargin={15}
                interval={(matchData.length > 9) ? Math.ceil((matchData.length - 2) / 8) : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: th.c.textMuted, fontFamily: CHART_FONT }}
                tickCount={4}
                tickMargin={15}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: th.c.borderStrong, strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="average"
                stroke={th.c.textFaint}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                fill="none"
                dot={false}
                activeDot={false}
              />
              <Area
                type="monotone"
                dataKey="current"
                stroke={th.c.accent}
                strokeWidth={2.4}
                fill="url(#currentGradient)"
                dot={false}
                activeDot={{ r: 4, fill: th.c.accent, stroke: th.c.surface, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </View>
    </View>
  );

  const sideBySide = screenWidth > 820;

  return (
    <View style={[styles.section, !sideBySide && styles.sectionMobile]}>
      <View style={styles.graphSlot}>
        <ChartContent />
      </View>
      <View style={[styles.radarSlot, !sideBySide && styles.radarSlotMobile]}>
        <TeamRadar teamInfo={teamInfo} matches={matches} wins={wins} year={year} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tdCard: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  tdTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, marginBottom: 2 },
  tdSub: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  tdGroup: { gap: 9 },
  tdDivider: { height: 1, marginVertical: 4 },
  tdLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 20 },
  tdLineLabel: { fontSize: 12.5, fontWeight: '500' },
  tdVal: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tdRank: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tdPct: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'], minWidth: 30, textAlign: 'right' },
  winTrack: { width: 60, height: 6, borderRadius: 3, overflow: 'hidden' },
  pill: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999, borderWidth: 1 },
  section: {
    flexDirection: 'row',
    gap: 12.6,
    borderRadius: 16,
    alignItems: 'stretch',
  },
  sectionMobile: {
    flexDirection: 'column',
    gap: 12.6,
  },
  graphSlot: {
    flex: 1.55,
    minWidth: 0,
  },
  radarSlot: {
    flex: 1,
    minWidth: 0,
  },
  radarSlotMobile: {
    width: '100%',
  },
  graphContainer: {
    minWidth: 0,
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