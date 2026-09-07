import { TeamInfo } from '@/api/utils/types';
import { webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  screenWidth: number;
  teamInfo: TeamInfo;
  highScore: number;
}

function openLink(url: string) {
  const prefixed = url.startsWith('http') ? url : `https://${url}`;
  Linking.openURL(prefixed).catch(() => Alert.alert("Can't open URL", url));
}

const InfoBox = ({ screenWidth, teamInfo, highScore }: Props) => {
  const t = useTheme();
  const c = t.c;
  const cols = screenWidth > 0 && screenWidth < 520 ? 2 : screenWidth < 860 ? 3 : 5;

  type Cell = { icon: keyof typeof Feather.glyphMap; label: string; value: string; href?: string };
  const cells: Cell[] = [
    { icon: 'shield', label: 'Team name', value: teamInfo.teamName || '—' },
    { icon: 'map-pin', label: 'Location', value: teamInfo.location || '—' },
    { icon: 'calendar', label: 'Founded', value: teamInfo.founded && teamInfo.founded !== 'N/A' ? teamInfo.founded : '—' },
    { icon: 'zap', label: 'Highest score', value: highScore ? String(highScore) : '—' },
    {
      icon: 'link',
      label: 'Website',
      value: teamInfo.website && teamInfo.website !== 'None' ? teamInfo.website.replace(/^https?:\/\//, '') : '—',
      href: teamInfo.website && teamInfo.website !== 'None' ? teamInfo.website : undefined,
    },
  ];

  const awards = (teamInfo.achievements ?? '')
    .split(/\s*[•,]\s*/)
    .map((s) => s.trim())
    .filter((s) => s && !/^(none|none this season|no awards received|n\/?a|—|-)$/i.test(s));

  const stacked: { icon: keyof typeof Feather.glyphMap; label: string; value: string }[] = [
    { icon: 'users', label: 'Sponsors', value: teamInfo.sponsors || '—' },
    {
      icon: 'award',
      label: 'Achievements',
      value: awards.length ? awards.join(' • ') : 'None this season',
    },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {cells.map((cell) => {
          const inner = (
            <View style={[styles.cell, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.cellHead}>
                <Feather name={cell.icon} size={12} color={c.textFaint} />
                <Text style={[styles.label, { color: c.textMuted }]}>{cell.label}</Text>
              </View>
              <Text style={[styles.value, { color: cell.href ? c.accentText : c.text }]} numberOfLines={1}>
                {cell.value}
              </Text>
            </View>
          );
          return (
            <View key={cell.label} style={{ width: `${100 / cols}%` }}>
              {cell.href ? (
                <Pressable onPress={() => openLink(cell.href!)} style={webTransition()}>
                  {inner}
                </Pressable>
              ) : (
                inner
              )}
            </View>
          );
        })}
      </View>

      {stacked.map((s) => (
        <View key={s.label} style={[styles.cellFull, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.cellHead}>
            <Feather name={s.icon} size={12} color={c.textFaint} />
            <Text style={[styles.label, { color: c.textMuted }]}>{s.label}</Text>
          </View>
          <Text style={[styles.valueMulti, { color: c.text }]}>{s.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    margin: 4,
    minHeight: 70,
    justifyContent: 'space-between',
    ...(Platform.OS === 'web' ? {} : {}),
  },
  cellFull: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  cellHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  label: { fontSize: 11.5, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '600' },
  valueMulti: { fontSize: 13, fontWeight: '500', lineHeight: 19 },
});

export default InfoBox;
