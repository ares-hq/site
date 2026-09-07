import { useCountUp } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

export type MetaItemDef = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  /** number → animated count-up; string/null → shown verbatim ("Loading…") */
  value: number | string | null | undefined;
  decimals?: number;
  suffix?: string;
};

/**
 * The small "Teams Loaded · Last Updated" style header stat row used across
 * the analytics templates. Right-aligned, icon + label + bold value.
 * Numeric values animate up (kept from the old ranking header).
 */
export function MetaRow({ items }: { items: MetaItemDef[] }) {
  const { width } = useWindowDimensions();
  const small = width < 768;
  return (
    <View style={[styles.row, small ? styles.rowMobile : styles.rowDesktop, styles.right]}>
      {items.map((it) => (
        <MetaItem key={it.label} item={it} small={small} />
      ))}
    </View>
  );
}

function MetaItem({ item, small }: { item: MetaItemDef; small: boolean }) {
  const t = useTheme();
  const numeric = typeof item.value === 'number' && Number.isFinite(item.value);
  const animated = useCountUp(numeric ? (item.value as number) : 0, { decimals: item.decimals ?? 0 });
  const shown = numeric
    ? `${animated.toLocaleString(undefined, {
        minimumFractionDigits: item.decimals ?? 0,
        maximumFractionDigits: item.decimals ?? 0,
      })}${item.suffix ?? ''}`
    : item.value == null || item.value === ''
      ? '—'
      : String(item.value);

  return (
    <View style={[styles.item, small ? styles.itemMobile : styles.itemDesktop]}>
      <View style={[styles.iconWrap, small && { marginRight: 8, paddingTop: 1 }]}>
        <Feather name={item.icon} size={small ? 18 : 22} color={t.c.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[small ? styles.labelMobile : styles.label, { color: t.c.textMuted }]}>{item.label}</Text>
        <Text style={[small ? styles.valueMobile : styles.value, { color: t.c.text }]}>{shown}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: 10 },
  rowDesktop: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 28, flexWrap: 'wrap', rowGap: 12 },
  rowMobile: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingHorizontal: 4, flexWrap: 'wrap', rowGap: 10 },
  right: { alignSelf: 'flex-end', marginTop: 8, maxWidth: '100%' },
  item: { flexDirection: 'row', alignItems: 'center' },
  itemMobile: { paddingHorizontal: 2 },
  itemDesktop: { minWidth: 120 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  label: { fontSize: 14, marginBottom: 2 },
  labelMobile: { fontSize: 12, marginBottom: 1 },
  value: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  valueMobile: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

export default MetaRow;
