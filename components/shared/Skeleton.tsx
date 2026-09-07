import { useDarkMode } from '@/context/DarkModeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, Platform, StyleSheet, View, ViewStyle } from 'react-native';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
};

/** A single pulsing placeholder block. Theme-aware; respects reduced motion via opacity floor. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const { isDarkMode } = useDarkMode();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.07)',
          opacity: pulse,
        },
        style as any,
      ]}
    />
  );
}

/** Stacked lines of text-height skeletons. */
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  gap = 8,
  lineHeight = 12,
}: {
  lines?: number;
  lastLineWidth?: DimensionValue;
  gap?: number;
  lineHeight?: number;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          radius={6}
        />
      ))}
    </View>
  );
}

const cardStyle: ViewStyle = {
  borderRadius: 14,
  padding: 18,
  borderWidth: 1,
};

/** Full-page placeholder for the team analytics / rankings table. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  const { isDarkMode } = useDarkMode();
  const border = isDarkMode ? '#3F3F3F' : '#E5E7EB';
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <View style={[styles.row, { borderColor: border }]}>
        <Skeleton width={90} height={14} />
        <Skeleton width={140} height={14} />
        <Skeleton width={50} height={14} />
        <Skeleton width={50} height={14} />
      </View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[styles.row, { borderColor: 'transparent' }]}>
          <Skeleton width={70} height={12} />
          <Skeleton width={i % 2 ? 180 : 120} height={12} />
          <Skeleton width={44} height={12} />
          <Skeleton width={44} height={12} />
        </View>
      ))}
    </View>
  );
}

/** Full-page placeholder for a team dashboard (stat cards + chart + info). */
export function DashboardSkeleton() {
  const { isDarkMode } = useDarkMode();
  const border = isDarkMode ? '#3F3F3F' : '#E5E7EB';
  return (
    <View style={{ gap: 16, paddingHorizontal: 4 }}>
      <View style={styles.headerRow}>
        <Skeleton width={220} height={18} />
        <Skeleton width={150} height={26} radius={20} />
      </View>
      <View style={styles.cardRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[cardStyle, styles.statCard, { borderColor: border }]}>
            <Skeleton width={80} height={12} />
            <Skeleton width={110} height={24} />
          </View>
        ))}
      </View>
      <Skeleton height={260} radius={16} />
      <View style={styles.headerRow}>
        <Skeleton width={160} height={16} />
      </View>
      <View style={styles.cardRow}>
        <View style={[cardStyle, { flex: 1, minWidth: 260, borderColor: border, gap: 10 }]}>
          <SkeletonText lines={4} />
        </View>
        <View style={[cardStyle, { flex: 1, minWidth: 260, borderColor: border, gap: 10 }]}>
          <SkeletonText lines={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
  },
  statCard: {
    flex: 1,
    minWidth: 220,
    height: 97,
    justifyContent: 'space-between',
  },
});
