import { getTeamCount, getTeamInfo } from '@/api/dashboardInfo';
import { AllianceInfo, SupportedYear, TeamInfo } from '@/api/utils/types';
import { CMP_COLORS, MAX_COMPARE } from '@/components/shared/compare';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const CHART_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

interface Props {
  teamInfo: TeamInfo;
  matches: AllianceInfo[] | null;
  wins: number;
  year: number;
}

export default function TeamRadar({ teamInfo, matches, wins, year }: Props) {
  const t = useTheme();
  const c = t.c;
  const palette = t.isDark ? CMP_COLORS.dark : CMP_COLORS.light;
  const [teamCount, setTeamCount] = useState(60);
  const [cmpInput, setCmpInput] = useState('');
  const [cmpOpen, setCmpOpen] = useState(false);
  const [cmps, setCmps] = useState<TeamInfo[]>([]);
  const [cmpBusy, setCmpBusy] = useState(false);
  const [cmpErr, setCmpErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTeamCount(year as SupportedYear)
      .then((n) => !cancelled && n > 1 && setTeamCount(n))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [year]);

  const pct = useCallback(
    (rank?: number | null) => {
      if (rank == null || rank <= 0) return 0;
      const p = (1 - (rank - 1) / Math.max(1, teamCount - 1)) * 100;
      const f = Math.max(0, Math.floor(p));
      return f >= 100 ? 99 : f;
    },
    [teamCount],
  );
  const winPct = matches?.length ? Math.round((wins / matches.length) * 100) : 0;

  const data = useMemo(() => {
    const rows: any[] = [
      { axis: 'Overall', team: pct(teamInfo.overallRank) },
      { axis: 'Auto', team: pct(teamInfo.autoRank) },
      { axis: 'TeleOp', team: pct(teamInfo.teleRank) },
      { axis: 'Endgame', team: pct(teamInfo.endgameRank) },
      { axis: 'Win rate', team: winPct },
    ];
    rows.forEach((r) => (r.median = 50));
    cmps.forEach((cm, ci) => {
      const vals = [pct(cm.overallRank), pct(cm.autoRank), pct(cm.teleRank), pct(cm.endgameRank), 50];
      rows.forEach((r, i) => (r[`cmp${ci}`] = vals[i]));
    });
    return rows;
  }, [teamInfo, winPct, cmps, pct]);

  const runCompare = async () => {
    const n = parseInt(cmpInput.trim(), 10);
    if (!Number.isFinite(n) || n <= 0 || n === teamInfo.teamNumber || cmps.some((cm) => cm.teamNumber === n) || cmps.length >= MAX_COMPARE) return;
    setCmpBusy(true);
    setCmpErr(false);
    try {
      const info = await getTeamInfo(n, year as SupportedYear);
      if (info) {
        setCmps((prev) => [...prev, info]);
        setCmpInput('');
        setCmpOpen(false);
      } else {
        setCmpErr(true);
      }
    } catch {
      setCmpErr(true);
    } finally {
      setCmpBusy(false);
    }
  };
  const removeCmp = (n?: number) => setCmps((prev) => prev.filter((cm) => cm.teamNumber !== n));
  const canAdd = cmps.length < MAX_COMPARE;

  const Tip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <View style={[styles.tip, t.shadow.pop, { backgroundColor: c.raised, borderColor: c.border }]}>
        <Text style={[styles.tipTitle, { color: c.text }]}>{label}</Text>
        {payload.map((p: any) => {
          const cmpIdx = p.dataKey?.startsWith?.('cmp') ? Number(p.dataKey.slice(3)) : -1;
          const color =
            p.name === 'This team' ? c.accentText : cmpIdx >= 0 ? palette[cmpIdx] : c.textFaint;
          return (
            <Text key={p.name} style={{ color, fontSize: 11.5, fontWeight: '600' }}>
              {p.name}: {Math.round(p.value)}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: c.text }]}>Team profile</Text>
        <View style={styles.cmpControl}>
          {cmpOpen && canAdd ? (
            <View style={[styles.cmpInputWrap, { backgroundColor: c.field, borderColor: cmpErr ? c.danger : c.border }]}>
              <TextInput
                autoFocus
                style={[styles.cmpInput, { color: c.text }]}
                placeholder="Team #"
                placeholderTextColor={c.textFaint}
                keyboardType="number-pad"
                value={cmpInput}
                onChangeText={(v) => { setCmpInput(v); setCmpErr(false); }}
                onSubmitEditing={runCompare}
              />
              <Pressable onPress={runCompare} hitSlop={6}>
                <Feather name={cmpBusy ? 'loader' : 'arrow-right'} size={13} color={c.accentText} />
              </Pressable>
            </View>
          ) : canAdd ? (
            <Pressable onPress={() => setCmpOpen(true)} style={[styles.cmpBtn, { borderColor: c.border }]}>
              <Feather name="plus" size={11} color={c.textMuted} />
              <Text style={[styles.cmpBtnTxt, { color: c.textMuted }]}>Compare</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: c.accent }]} />
          <Text style={[styles.legendTxt, { color: c.textMuted }]}>This team</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dashMark, { borderColor: c.textFaint }]} />
          <Text style={[styles.legendTxt, { color: c.textMuted }]}>Field median</Text>
        </View>
        {cmps.map((cm, i) => (
          <Pressable key={cm.teamNumber} onPress={() => removeCmp(cm.teamNumber)} style={[styles.chip, { borderColor: palette[i] }]}>
            <View style={[styles.dot, { backgroundColor: palette[i] }]} />
            <Text style={[styles.legendTxt, { color: c.textMuted }]}>{cm.teamNumber}</Text>
            <Feather name="x" size={10} color={c.textFaint} />
          </Pressable>
        ))}
      </View>

      <View style={{ flex: 1, minHeight: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%" margin={{ top: 6, right: 22, bottom: 6, left: 22 }}>
            <defs>
              <linearGradient id="radarTeam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.accent} stopOpacity={0.3} />
                <stop offset="100%" stopColor={c.accent} stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <PolarGrid stroke={c.hairline} />
            <PolarAngleAxis dataKey="axis" tick={{ fill: c.textMuted, fontSize: 11, fontFamily: CHART_FONT }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Field median" dataKey="median" stroke={c.textFaint} strokeDasharray="4 4" strokeWidth={1} fill="none" isAnimationActive={false} />
            {cmps.map((cm, i) => (
              <Radar
                key={cm.teamNumber}
                name={`Team ${cm.teamNumber}`}
                dataKey={`cmp${i}`}
                stroke={palette[i]}
                strokeWidth={2}
                fill={palette[i]}
                fillOpacity={0.06}
                isAnimationActive
                animationDuration={450}
              />
            ))}
            <Radar
              name="This team"
              dataKey="team"
              stroke={c.accent}
              strokeWidth={2.4}
              fill="url(#radarTeam)"
              dot={{ r: 3, fill: c.accent, stroke: c.surface, strokeWidth: 1.5 }}
              isAnimationActive
              animationDuration={700}
            />
            <Tooltip content={<Tip />} />
          </RadarChart>
        </ResponsiveContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 280, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  legend: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendTxt: { fontSize: 11, fontWeight: '500' },
  dot: { width: 7, height: 7, borderRadius: 2 },
  dashMark: { width: 12, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  cmpControl: { minWidth: 92, alignItems: 'flex-end' },
  cmpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  cmpBtnTxt: { fontSize: 11, fontWeight: '600' },
  cmpInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cmpInput: {
    width: 58,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  tip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  tipTitle: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
});
