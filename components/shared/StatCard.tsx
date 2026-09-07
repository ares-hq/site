import { useCountUp, webTransition } from '@/components/shared/motion';
import { ToneName, useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  /** number → animated count-up; string/null → shown verbatim (e.g. "—") */
  value: number | string | null | undefined;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** e.g. "+2.41" — rendered with an up/down arrow */
  delta?: string;
  deltaPositive?: boolean;
  /** categorical marker shown as a thin left rule + icon tint (never a fill) */
  tone?: ToneName | 'plain';
  /** opt-in accent colour — tints the icon only. Nothing when omitted. */
  accent?: string;
  icon?: keyof typeof Feather.glyphMap;
  compact?: boolean;
  onPress?: () => void;
};

export function StatCard({
  title,
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  delta,
  deltaPositive = true,
  tone = 'plain',
  accent,
  icon,
  compact = false,
  onPress,
}: Props) {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  const numeric = typeof value === 'number' && Number.isFinite(value);
  const animated = useCountUp(numeric ? (value as number) : 0, { decimals });
  const shown = numeric
    ? `${prefix}${animated.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`
    : value == null || value === ''
      ? '—'
      : String(value);

  void tone; // categorical colour intentionally not shown on the card surface
  const deltaColor = deltaPositive ? t.c.success : t.c.danger;
  const interactive = !!onPress;

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={[
        styles.card,
        compact && styles.cardCompact,
        webTransition(),
        {
          backgroundColor: t.c.surface,
          borderColor: hovered && interactive ? t.c.accent : t.c.border,
        },
        hovered && interactive && { transform: [{ translateY: -2 }], ...t.shadow.sm },
      ]}
    >
      <View style={styles.titleRow}>
        {icon && (
          <Feather name={icon} size={compact ? 13 : 14} color={accent ?? t.c.textFaint} />
        )}
        <Text
          style={[styles.title, compact && styles.titleCompact, { color: t.c.textMuted }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, compact && styles.valueCompact, { color: t.c.text }]} numberOfLines={1}>
          {shown}
        </Text>
        {!!delta && (
          <View style={styles.deltaRow}>
            <Feather
              name={deltaPositive ? 'arrow-up-right' : 'arrow-down-right'}
              size={compact ? 11 : 13}
              color={deltaColor}
            />
            <Text style={[styles.delta, compact && styles.deltaCompact, { color: deltaColor }]}>
              {delta}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 200,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    justifyContent: 'space-between',
  },
  cardCompact: {
    minWidth: 150,
    borderRadius: 12,
    padding: 13,
    gap: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { fontSize: 13, fontWeight: '500', letterSpacing: 0.1 },
  titleCompact: { fontSize: 12 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  value: { fontSize: 25, fontWeight: '700', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  valueCompact: { fontSize: 18 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 3 },
  delta: { fontSize: 12.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
  deltaCompact: { fontSize: 11 },
});

export default StatCard;
