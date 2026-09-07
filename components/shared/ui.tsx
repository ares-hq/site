import { webTransition } from '@/components/shared/motion';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { cardStyle, useTheme } from './theme';

const isWeb = Platform.OS === 'web';

/** Rounded, bordered surface used everywhere a group of content sits together. */
export function Card({
  children,
  elevated = false,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const base = cardStyle(t, elevated);
  return <View style={[base, !padded && { padding: 0 }, style]}>{children}</View>;
}

/** In-page section label: "Performance", "Events", "Team Information"… */
export function SectionHeader({
  title,
  action,
  count,
  collapsible = false,
  collapsed = false,
  onToggle,
  style,
}: {
  title: string;
  action?: React.ReactNode;
  count?: number;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();

  const label = (
    <View style={styles.titleGroup}>
      {collapsible && (
        <Feather
          name="chevron-right"
          size={16}
          color={t.c.textMuted}
          style={{ transform: [{ rotate: collapsed ? '0deg' : '90deg' }] }}
        />
      )}
      <Text style={[t.font.h2 as TextStyle, { color: t.c.text }]}>{title}</Text>
      {count != null && (
        <View style={[styles.countPill, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
          <Text style={[styles.countText, { color: t.c.textMuted }]}>{count}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.sectionHeader, style]}>
      {collapsible ? (
        <Pressable
          onPress={onToggle}
          style={[styles.toggle, webTransition('background-color'), isWeb && ({ cursor: 'pointer' } as any)]}
        >
          {label}
        </Pressable>
      ) : (
        label
      )}
      {action}
    </View>
  );
}

/**
 * A titled section that collapses on click. Optionally remembers its state
 * per `storageKey` in localStorage (web).
 */
export function CollapsibleSection({
  title,
  count,
  defaultCollapsed = false,
  storageKey,
  action,
  children,
}: {
  title: string;
  count?: number;
  defaultCollapsed?: boolean;
  storageKey?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (isWeb && storageKey && typeof window !== 'undefined') {
      try {
        const v = window.localStorage.getItem(`ares:section:${storageKey}`);
        if (v === '0') return false;
        if (v === '1') return true;
      } catch {
        /* ignore */
      }
    }
    return defaultCollapsed;
  });

  useEffect(() => {
    if (isWeb && storageKey && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`ares:section:${storageKey}`, collapsed ? '1' : '0');
      } catch {
        /* ignore */
      }
    }
  }, [collapsed, storageKey]);

  return (
    <View>
      <SectionHeader
        title={title}
        count={count}
        collapsible
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        action={action}
      />
      {!collapsed && children}
    </View>
  );
}

/** Top-of-page title + optional subtitle + right-aligned meta slot. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, minWidth: 200 }}>
        <Text style={[t.font.display as TextStyle, { color: t.c.text }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[t.font.body as TextStyle, { color: t.c.textMuted, marginTop: 4 }]}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

/** Small pill: filters, tags, counts. */
export function Chip({
  label,
  active = false,
  onPress,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.chip,
        webTransition(),
        {
          backgroundColor: active ? t.c.accentSoft : t.c.bgSubtle,
          borderColor: active ? t.c.accent : t.c.border,
        },
      ]}
    >
      {icon}
      <Text style={[t.font.caption as TextStyle, { color: active ? t.c.accentText : t.c.textMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Text button used for "Show all" / "Show less" affordances. */
export function TextButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.textBtn,
        webTransition(),
        { borderColor: hovered ? t.c.accent : t.c.border, backgroundColor: hovered ? t.c.surfaceHover : 'transparent' },
      ]}
    >
      <Text style={[styles.textBtnLabel, { color: hovered ? t.c.accentText : t.c.textMuted }]}>{label}</Text>
      {icon && <Feather name={icon} size={13} color={hovered ? t.c.accentText : t.c.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    gap: 12,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  countText: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  textBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  textBtnLabel: { fontSize: 13, fontWeight: '600' },
});
