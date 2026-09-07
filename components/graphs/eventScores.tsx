import { TeamInfo } from '@/api/utils/types';
import { useTheme } from '@/components/shared/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

// Auto / TeleOp / Endgame — the same distinct, non-blue hues used across the app.
const PHASE = {
  light: ['#7C3AED', '#D97706', '#0D9488'],
  dark: ['#A78BFA', '#FBBF24', '#2DD4BF'],
};

type AvgOPR = { autoOPR: number; teleOPR: number; endgameOPR: number; overallOPR: number } | null;

interface UserGraphSectionProps {
  teamInfo: TeamInfo;
  /** kept for API compatibility; no longer rendered */
  averageOPR?: AvgOPR;
}

const EventScores = ({ teamInfo }: UserGraphSectionProps) => {
  const t = useTheme();
  const c = t.c;
  const COLORS = t.isDark ? PHASE.dark : PHASE.light;

  const auto = teamInfo.autoOPR ?? 0;
  const teleRaw = teamInfo.teleOPR ?? 0;
  const endgame = teamInfo.endgameOPR ?? 0;
  const tele = teleRaw - Math.max(endgame, 0); // teleOPR includes endgame in this dataset
  const overall = teamInfo.overallOPR ?? auto + teleRaw;

  const phases = [
    { name: 'Auto', value: auto },
    { name: 'TeleOp', value: tele },
    { name: 'Endgame', value: endgame },
  ];

  const positiveTotal = phases.reduce((s, p) => s + Math.max(p.value, 0), 0) || 1;
  const chartData = phases.map((p) => ({
    ...p,
    // floor tiny slices so they still render as a rounded arc, not a sharp sliver
    slice: Math.max(p.value, positiveTotal * 0.05),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const pct = ((Math.max(d.value, 0) / positiveTotal) * 100).toFixed(0);
    return (
      <View style={[styles.tooltip, { backgroundColor: c.raised, borderColor: c.border }]}>
        <Text style={[styles.tooltipText, { color: c.text }]}>{d.name}</Text>
        <Text style={[styles.tooltipSub, { color: c.textMuted }]}>{d.value.toFixed(1)} OPR · {pct}% of output</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
      <Text style={[styles.title, { color: c.text }]}>OPR contribution by phase</Text>
      <Text style={[styles.sub, { color: c.textMuted }]}>Where this team&apos;s scoring output comes from</Text>

      <View style={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="slice"
              nameKey="name"
              outerRadius="92%"
              innerRadius="62%"
              paddingAngle={3}
              cornerRadius={10}
              minAngle={20}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ outline: 'none' }} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <View style={styles.centerLabel} pointerEvents="none">
          <Text style={[styles.centerNum, { color: c.text }]}>{overall.toFixed(1)}</Text>
          <Text style={[styles.centerCap, { color: c.textFaint }]}>Total OPR</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {phases.map((p, i) => (
          <View key={p.name} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
            <Text style={[styles.legendName, { color: c.textMuted }]}>{p.name}</Text>
            <Text style={[styles.legendVal, { color: c.text }]}>{p.value.toFixed(1)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    flex: 1,
    minWidth: 250,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'column',
  },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  sub: { fontSize: 11.5, marginTop: 3, marginBottom: 4 },
  chartArea: { flex: 1, minHeight: 0, position: 'relative' },
  centerLabel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centerNum: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  centerCap: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8, justifyContent: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 2 },
  legendName: { fontSize: 11, fontWeight: '500' },
  legendVal: { fontSize: 11.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tooltip: { borderRadius: 8, padding: 9, borderWidth: 1, gap: 1 },
  tooltipText: { fontSize: 12, fontWeight: '700' },
  tooltipSub: { fontSize: 11, fontWeight: '600' },
});

export default EventScores;
