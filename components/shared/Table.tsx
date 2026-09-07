import { webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

/**
 * Shared table primitives. Every data table in the app (team ranks, match
 * ranks, event rankings…) is built from these so they read identically —
 * same well, same header, same row height, same pager. Features differ;
 * style does not.
 */

type Align = 'left' | 'right';

export function TableShell({
  controls,
  footer,
  children,
  style,
}: {
  controls?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View style={[styles.shell, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }, style]}>
      {controls != null && <View style={styles.controls}>{controls}</View>}
      {children}
      {footer}
    </View>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={[styles.headRow, { borderBottomColor: t.c.border }]}>{children}</View>;
}

export function HeadCell({
  label,
  flex = 1,
  width,
  align = 'left',
  sortable = false,
  active = false,
  dir = 'desc',
  onPress,
}: {
  label: string;
  flex?: number;
  width?: number;
  align?: Align;
  sortable?: boolean;
  active?: boolean;
  dir?: 'asc' | 'desc';
  onPress?: () => void;
}) {
  const t = useTheme();
  const Wrap: any = sortable ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={[
        styles.headCell,
        width != null ? { width } : { flex },
        { justifyContent: align === 'right' ? 'flex-end' : 'flex-start' },
        sortable && Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
      ]}
    >
      <Text style={[styles.headText, { color: active ? t.c.text : t.c.textMuted }]}>{label}</Text>
      {sortable && (
        <Feather
          name={active && dir === 'asc' ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={active ? t.c.accent : t.c.textFaint}
          style={{ opacity: active ? 1 : 0.35 }}
        />
      )}
    </Wrap>
  );
}

export function TableRow({
  onPress,
  first = false,
  last = false,
  active = false,
  children,
}: {
  onPress?: () => void;
  first?: boolean;
  last?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => [
        styles.row,
        webTransition('background-color'),
        // Divider and hover fill are the SAME token, so a hovered row melts into its own separator.
        // No corner rounding here — these rows live inside a padded, bordered TableShell well.
        !last && { borderBottomWidth: 1, borderBottomColor: t.c.border },
        { backgroundColor: hovered || active ? t.c.border : 'transparent' },
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Cell({
  children,
  flex = 1,
  width,
  align = 'left',
  numeric = false,
  tone = 'default',
  style,
}: {
  children: React.ReactNode;
  flex?: number;
  width?: number;
  align?: Align;
  numeric?: boolean;
  tone?: 'default' | 'muted' | 'faint' | 'accent';
  style?: StyleProp<TextStyle>;
}) {
  const t = useTheme();
  const color =
    tone === 'muted' ? t.c.textMuted : tone === 'faint' ? t.c.textFaint : tone === 'accent' ? t.c.accentText : t.c.text;
  return (
    <Text
      numberOfLines={1}
      style={[
        styles.cell,
        width != null ? { width } : { flex },
        { color, textAlign: align },
        numeric && styles.cellNum,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** A cell that holds arbitrary nodes (chips, buttons) instead of text. */
export function CellView({
  children,
  flex = 1,
  width,
  align = 'left',
  style,
}: {
  children: React.ReactNode;
  flex?: number;
  width?: number;
  align?: Align;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.cellView,
        width != null ? { width } : { flex },
        { justifyContent: align === 'right' ? 'flex-end' : 'flex-start' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function TableEmpty({ icon = 'search', text }: { icon?: keyof typeof Feather.glyphMap; text: string }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={22} color={t.c.textFaint} />
      <Text style={[styles.emptyText, { color: t.c.textMuted }]}>{text}</Text>
    </View>
  );
}

export function TablePager({
  page,
  totalPages,
  onPage,
  label,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  label: string;
}) {
  const t = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: t.c.hairline }]}>
      <Text style={[styles.footerText, { color: t.c.textMuted }]}>{label}</Text>
      {totalPages > 1 && (
        <View style={styles.pager}>
          <Pressable
            disabled={page === 0}
            onPress={() => onPage(Math.max(0, page - 1))}
            style={[styles.pageBtn, { borderColor: t.c.border, opacity: page === 0 ? 0.4 : 1 }]}
          >
            <Feather name="chevron-left" size={15} color={t.c.text} />
          </Pressable>
          <Text style={[styles.footerText, { color: t.c.textMuted }]}>
            {page + 1} / {totalPages}
          </Text>
          <Pressable
            disabled={page >= totalPages - 1}
            onPress={() => onPage(Math.min(totalPages - 1, page + 1))}
            style={[styles.pageBtn, { borderColor: t.c.border, opacity: page >= totalPages - 1 ? 0.4 : 1 }]}
          >
            <Feather name="chevron-right" size={15} color={t.c.text} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const ALLIANCE = {
  red: { light: '#DC2626', dark: '#F87171' },
  blue: { light: '#2563EB', dark: '#60A5FA' },
} as const;

// Highlighter-style mark for a focused team — deliberately NOT red or blue
// (those are alliance colours), reads as "marked".
const MARK = {
  bg: { light: '#FEF3C7', dark: 'rgba(250, 204, 21, 0.18)' },
  border: { light: '#D97706', dark: '#FBBF24' },
  text: { light: '#92400E', dark: '#FDE68A' },
} as const;

// A softer amber for mere hover — distinct from the persistent click/search MARK above.
const MARK_HOVER = {
  bg: { light: '#FEF9EC', dark: 'rgba(250, 204, 21, 0.10)' },
  border: { light: '#F59E0B', dark: '#FCD34D' },
  text: { light: '#B45309', dark: '#FDE68A' },
} as const;

/**
 * A small pill "1234" that links to a team dashboard. Used inside CellView.
 * `side` tints it by alliance; `highlight` rings the team you searched for.
 */
export function TeamPill({
  teamNumber,
  onPress,
  side,
  highlight = false,
}: {
  teamNumber?: number;
  onPress?: () => void;
  side?: 'red' | 'blue';
  highlight?: boolean;
}) {
  const t = useTheme();
  if (!teamNumber) return null;
  const k = t.isDark ? 'dark' : 'light';
  const sideColor = side ? ALLIANCE[side][k] : null;
  const sideBg = side ? (t.isDark ? `${ALLIANCE[side].dark}22` : `${ALLIANCE[side].light}12`) : null;
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }: any) => {
        // Persistent search/click highlight uses MARK; a bare hover uses the softer MARK_HOVER.
        const m = highlight ? MARK : hovered ? MARK_HOVER : null;
        return [
          styles.teamPill,
          webTransition(),
          {
            backgroundColor: m ? m.bg[k] : sideBg ?? t.c.bgSubtle,
            borderColor: m ? m.border[k] : sideColor ?? t.c.border,
            borderWidth: highlight ? 2 : 1,
          },
        ];
      }}
    >
      {({ hovered }: any) => {
        const m = highlight ? MARK : hovered ? MARK_HOVER : null;
        return (
          <>
            {highlight && <View style={[styles.pillDot, { backgroundColor: MARK.border[k] }]} />}
            <Text style={[styles.teamPillText, { color: m ? m.text[k] : sideColor ?? t.c.text }]}>
              {teamNumber}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
}

export const tableStyles = StyleSheet.create({
  filterInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 34,
  },
  filterInputText: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 34,
  },
  actionBtnText: { fontSize: 13, fontWeight: '500' },
});

const styles = StyleSheet.create({
  shell: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: 30,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 9,
    borderBottomWidth: 1,
  },
  headCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
  },
  headText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
  },
  cell: {
    paddingHorizontal: 7,
    fontSize: 13,
    minWidth: 0,
  },
  cellNum: {
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  cellView: {
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    gap: 10,
  },
  emptyText: { fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerText: { fontSize: 12, fontWeight: '500' },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  pillDot: { width: 4, height: 4, borderRadius: 2 },
  teamPillText: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
