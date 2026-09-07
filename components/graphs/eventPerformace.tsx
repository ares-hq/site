import { getAverageByMatchType } from '@/api/algorithms/averageMatchScores';
import { getTeamMatches } from '@/api/dashboardInfo';
import { AllianceInfo, MatchTypeAverages, SupportedYear } from '@/api/utils/types';
import { CMP_COLORS, MAX_COMPARE } from '@/components/shared/compare';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bar, BarChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// SVG <text> defaults to a serif face — force the app's system sans stack.
const CHART_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

interface UserGraphSectionProps {
  matchType: MatchTypeAverages;
  matches?: AllianceInfo[] | null;
  year?: number;
}

type Cmp = { num: number; qual: number; finals: number };

const EventPerformance = ({ matchType, matches, year }: UserGraphSectionProps) => {
  const t = useTheme();
  const c = t.c;
  const palette = t.isDark ? CMP_COLORS.dark : CMP_COLORS.light;

  const [cmpInput, setCmpInput] = useState('');
  const [cmpOpen, setCmpOpen] = useState(false);
  const [cmps, setCmps] = useState<Cmp[]>([]);
  const [cmpBusy, setCmpBusy] = useState(false);
  const [cmpErr, setCmpErr] = useState(false);

  const fieldMean = (type: 'QUALIFICATION' | 'PLAYOFF') => {
    const vals = (matches ?? [])
      .filter((m) => m.matchType === type && typeof m.averagePoints === 'number')
      .map((m) => m.averagePoints as number);
    return vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : 0;
  };

  const mkRow = (name: string, teamVal: number, fieldVal: number, pick: (cm: Cmp) => number) => {
    const row: any = { name, team: +teamVal.toFixed(1), field: +fieldVal.toFixed(1) };
    cmps.forEach((cm, i) => (row[`cmp${i}`] = +pick(cm).toFixed(1)));
    return row;
  };
  const data = [
    mkRow('Qualifier', matchType.qual ?? 0, fieldMean('QUALIFICATION'), (cm) => cm.qual),
    mkRow('Finals', matchType.finals ?? 0, fieldMean('PLAYOFF'), (cm) => cm.finals),
  ];
  const hasField = data.some((d) => d.field > 0);
  const seriesCount = 1 + (hasField ? 1 : 0) + cmps.length;
  const barSize = seriesCount <= 1 ? 34 : seriesCount === 2 ? 24 : seriesCount === 3 ? 17 : seriesCount <= 5 ? 12 : 9;

  const runCompare = async () => {
    const n = parseInt(cmpInput.trim(), 10);
    if (!Number.isFinite(n) || n <= 0 || !year || cmps.some((cm) => cm.num === n) || cmps.length >= MAX_COMPARE) return;
    setCmpBusy(true);
    setCmpErr(false);
    try {
      const m = await getTeamMatches(n, year as SupportedYear);
      const avg = getAverageByMatchType(m ?? []);
      if (avg && (avg.qual || avg.finals)) {
        setCmps((prev) => [...prev, { num: n, qual: +(avg.qual ?? 0).toFixed(1), finals: +(avg.finals ?? 0).toFixed(1) }]);
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
  const removeCmp = (num: number) => setCmps((prev) => prev.filter((cm) => cm.num !== num));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const delta = d.field > 0 ? d.team - d.field : null;
    return (
      <View style={[styles.tooltip, { backgroundColor: c.raised, borderColor: c.border }]}>
        <Text style={[styles.tooltipText, { color: c.text }]}>{label}</Text>
        <Text style={[styles.tooltipSub, { color: c.accentText }]}>This team {d.team.toFixed(1)}</Text>
        {d.field > 0 && <Text style={[styles.tooltipSub, { color: c.textMuted }]}>Field {d.field.toFixed(1)}</Text>}
        {cmps.map((cm, i) => (
          <Text key={cm.num} style={[styles.tooltipSub, { color: palette[i] }]}>Team {cm.num} {Number(d[`cmp${i}`] ?? 0).toFixed(1)}</Text>
        ))}
        {delta != null && (
          <Text style={[styles.tooltipSub, { color: delta >= 0 ? c.success : c.danger }]}>
            Δ {delta >= 0 ? '+' : '−'}{Math.abs(delta).toFixed(1)}
          </Text>
        )}
      </View>
    );
  };

  const legendFormatter = (v: string) => {
    let txt = v;
    if (v === 'team') txt = 'This team';
    else if (v === 'field') txt = 'Field average';
    else if (v.startsWith('cmp')) txt = `Team ${cmps[Number(v.slice(3))]?.num ?? ''}`;
    return <Text style={{ color: c.textMuted, fontSize: 11 }}>{txt}</Text>;
  };

  const canAdd = cmps.length < MAX_COMPARE;

  return (
    <View style={[styles.container, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={[styles.title, { color: c.text }]}>Match score vs field</Text>
          {cmps.length === 0 ? (
            <Text style={[styles.sub, { color: c.textMuted }]} numberOfLines={1}>Team average by match type, with the event baseline</Text>
          ) : (
            <View style={styles.chipTray}>
              {cmps.map((cm, i) => (
                <Pressable key={cm.num} onPress={() => removeCmp(cm.num)} style={[styles.cmpChip, { borderColor: palette[i] }]}>
                  <View style={[styles.cmpDot, { backgroundColor: palette[i] }]} />
                  <Text style={[styles.cmpChipTxt, { color: c.textMuted }]}>{cm.num}</Text>
                  <Feather name="x" size={10} color={c.textFaint} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
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

      <View style={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 14, right: 6, bottom: 0, left: -22 }} barCategoryGap="24%">
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: c.textMuted, fontFamily: CHART_FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: c.textFaint, fontFamily: CHART_FONT }} axisLine={false} tickLine={false} tickCount={4} />
            <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
            {(hasField || cmps.length > 0) && (
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontFamily: CHART_FONT, fontSize: 11 }} formatter={legendFormatter} />
            )}
            <Bar dataKey="team" name="team" radius={[5, 5, 0, 0]} barSize={barSize} fill={c.accent}>
              {seriesCount === 1 && (
                <LabelList dataKey="team" position="top" style={{ fill: c.textMuted, fontSize: 10.5, fontFamily: CHART_FONT }} />
              )}
            </Bar>
            {hasField && <Bar dataKey="field" name="field" radius={[5, 5, 0, 0]} barSize={barSize} fill={c.textFaint} fillOpacity={0.55} />}
            {cmps.map((cm, i) => (
              <Bar key={cm.num} dataKey={`cmp${i}`} name={`cmp${i}`} radius={[5, 5, 0, 0]} barSize={barSize} fill={palette[i]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </View>

      {!hasField && cmps.length === 0 && (
        <View style={styles.noteRow}>
          <Feather name="info" size={11} color={c.textFaint} />
          <Text style={[styles.note, { color: c.textFaint }]}>Field baseline unavailable for this season.</Text>
        </View>
      )}
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
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headText: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  sub: { fontSize: 11.5, marginTop: 3, marginBottom: 6 },
  chipTray: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 5, marginBottom: 4 },
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
  cmpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  cmpDot: { width: 7, height: 7, borderRadius: 2 },
  cmpChipTxt: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cmpInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cmpInput: {
    width: 58,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 2,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  chartArea: { flex: 1, minHeight: 0 },
  tooltip: { borderRadius: 8, padding: 9, borderWidth: 1, gap: 1 },
  tooltipText: { fontSize: 12, fontWeight: '700' },
  tooltipSub: { fontSize: 11, fontWeight: '600' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  note: { fontSize: 10.5 },
});

export default EventPerformance;
