import { filterTeams } from '@/api/algorithms/filter';
import { getEventsBasic } from '@/api/basic-event-service';
import { getAllTeams } from '@/api/dashboardInfo';
import { DEFAULT_SEASON, routeFromSeason } from '@/api/utils/seasons';
import { SupportedYear } from '@/api/utils/types';
import { webTransition } from '@/components/shared/motion';
import { useDarkMode } from '@/context/DarkModeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const isWeb = Platform.OS === 'web';

type Command = {
  id: string;
  title: string;
  hint?: string;
  keywords?: string;
  icon: keyof typeof Feather.glyphMap;
  run: () => void;
};

type Row =
  | { kind: 'command'; command: Command }
  | { kind: 'team'; teamNumber: number; title: string; subtitle?: string }
  | { kind: 'event'; eventCode: string; title: string; subtitle?: string };

type Props = {
  open: boolean;
  onClose: () => void;
  year?: SupportedYear;
};

export default function CommandPalette({ open, onClose, year = DEFAULT_SEASON }: Props) {
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [teams, setTeams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const theme = {
    overlay: 'rgba(15, 23, 42, 0.45)',
    panel: isDarkMode ? '#303030' : '#ffffff',
    border: isDarkMode ? '#3F3F3F' : '#e5e7eb',
    text: isDarkMode ? '#f9fafb' : '#111827',
    sub: isDarkMode ? '#9ca3af' : '#6b7280',
    inputBg: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    rowHover: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    chipBg: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    accent: '#3B82F6',
  };

  const go = useCallback(
    (path: string) => {
      onClose();
      router.push(path as any);
    },
    [onClose, router],
  );

  const commands = useMemo<Command[]>(
    () => [
      { id: 'home', title: 'Home', icon: 'home', run: () => go('/') },
      { id: 'tranks', title: 'Team Rankings', keywords: 'overall opr analytics', icon: 'bar-chart-2', run: () => go('/analytics/teams/tranks') },
      { id: 'tauto', title: 'Auto Rankings', keywords: 'autonomous analytics', icon: 'zap', run: () => go('/analytics/teams/tauto') },
      { id: 'ttele', title: 'TeleOp Rankings', keywords: 'teleop driver analytics', icon: 'radio', run: () => go('/analytics/teams/ttele') },
      { id: 'tendgame', title: 'Endgame Rankings', keywords: 'endgame analytics', icon: 'flag', run: () => go('/analytics/teams/tendgame') },
      { id: 'mranks', title: 'Match Rankings', keywords: 'matches analytics', icon: 'grid', run: () => go('/analytics/matches/mranks') },
      { id: 'allevents', title: 'All Events', keywords: 'events schedule', icon: 'calendar', run: () => go('/analytics/events/allevents') },
      { id: 'champs', title: 'Championships', keywords: 'events worlds', icon: 'award', run: () => go('/analytics/events/championships') },
      { id: 'discord', title: 'Discord Bot', keywords: 'platforms integration', icon: 'message-circle', run: () => go('/platforms/discord') },
      { id: 'app', title: 'Mobile App', keywords: 'platforms ios testflight', icon: 'smartphone', run: () => go('/platforms/app') },
      { id: 'scout', title: 'ScoutSheet', keywords: 'scouting sheet', icon: 'clipboard', run: () => go('/scouting/ScoutSheet') },
      { id: 'status', title: 'System Status', keywords: 'uptime health', icon: 'activity', run: () => go('/systemstatus') },
      {
        id: 'theme',
        title: isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
        keywords: 'theme dark light appearance',
        icon: isDarkMode ? 'sun' : 'moon',
        run: () => {
          setIsDarkMode(!isDarkMode);
          onClose();
        },
      },
    ],
    [go, isDarkMode, setIsDarkMode, onClose],
  );

  // Lazy-load searchable data the first time the palette opens.
  useEffect(() => {
    if (!open || teams.length > 0) return;
    let cancelled = false;
    (async () => {
      const [t, e] = await Promise.all([
        getAllTeams(year).catch(() => []),
        getEventsBasic(year, true).catch(() => []),
      ]);
      if (cancelled) return;
      setTeams(t ?? []);
      setEvents(e ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, year, teams.length]);

  // Reset transient state whenever it opens; lock background scroll on web.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    let prevOverflow = '';
    if (isWeb && typeof document !== 'undefined') {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      clearTimeout(t);
      if (isWeb && typeof document !== 'undefined') {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [open]);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const cmdRows: Row[] = commands
      .filter((c) => !q || c.title.toLowerCase().includes(q) || c.keywords?.includes(q))
      .map((command) => ({ kind: 'command', command }));

    if (q.length < 1) return cmdRows;

    const teamRows: Row[] = filterTeams(teams, q)
      .slice(0, 6)
      .map((tm: any) => ({
        kind: 'team',
        teamNumber: tm.teamNumber,
        title: `Team ${tm.teamNumber}`,
        subtitle: [tm.teamName, tm.location].filter(Boolean).join(' • ') || undefined,
      }));

    const eventRows: Row[] = events
      .filter(
        (ev: any) =>
          ev.name?.toLowerCase().includes(q) ||
          ev.eventCode?.toLowerCase().includes(q) ||
          ev.location?.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((ev: any) => ({
        kind: 'event',
        eventCode: ev.eventCode,
        title: ev.name || ev.eventCode,
        subtitle: ev.location || undefined,
      }));

    return [...cmdRows, ...teamRows, ...eventRows];
  }, [query, commands, teams, events]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  const runRow = useCallback(
    (row: Row) => {
      if (row.kind === 'command') row.command.run();
      else if (row.kind === 'team') go(`/dashboards/${routeFromSeason(year)}?teamnumber=${row.teamNumber}`);
      else go(`/analytics/events/${row.eventCode}`);
    },
    [go, year],
  );

  useEffect(() => {
    if (!open || !isWeb) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, rows.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (rows[active]) runRow(rows[active]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, rows, active, runRow, onClose]);

  if (!open) return null;

  return (
    <Pressable
      style={[styles.overlay, isWeb && ({ position: 'fixed' } as any), { backgroundColor: theme.overlay }]}
      onPress={onClose}
    >
      <Pressable
        style={[styles.panel, { backgroundColor: theme.panel, borderColor: theme.border }]}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={[styles.inputRow, { borderBottomColor: theme.border }]}>
          <Feather name="search" size={16} color={theme.sub} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onKeyPress={(e: any) => {
              const key: string = e?.nativeEvent?.key;
              if (key === 'ArrowDown') {
                e.preventDefault?.();
                setActive((a) => Math.min(a + 1, rows.length - 1));
              } else if (key === 'ArrowUp') {
                e.preventDefault?.();
                setActive((a) => Math.max(a - 1, 0));
              } else if (key === 'Enter') {
                e.preventDefault?.();
                const target = rows[active] ?? rows[0];
                if (target) runRow(target);
              } else if (key === 'Escape') {
                onClose();
              }
            }}
            onSubmitEditing={() => {
              const target = rows[active] ?? rows[0];
              if (target) runRow(target);
            }}
            blurOnSubmit={false}
            placeholder="Search teams, events, or jump to a page…"
            placeholderTextColor={theme.sub}
            style={[styles.input, { color: theme.text }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <View style={[styles.escChip, { backgroundColor: theme.chipBg }]}>
            <Text style={[styles.escText, { color: theme.sub }]}>esc</Text>
          </View>
        </View>

        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: theme.sub, fontSize: 14 }}>No matches</Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(row, i) =>
              row.kind === 'command' ? row.command.id : row.kind === 'team' ? `t${row.teamNumber}` : `e${row.eventCode}-${i}`
            }
            style={{ maxHeight: 360 }}
            renderItem={({ item, index }) => {
              const selected = index === active;
              const icon: keyof typeof Feather.glyphMap =
                item.kind === 'command' ? item.command.icon : item.kind === 'team' ? 'users' : 'calendar';
              const label = item.kind === 'command' ? item.command.title : item.title;
              const sub = item.kind === 'command' ? item.command.hint : item.subtitle;
              return (
                <Pressable
                  onHoverIn={() => setActive(index)}
                  onPress={() => runRow(item)}
                  style={[
                    styles.row,
                    webTransition('background-color'),
                    { backgroundColor: selected ? theme.rowHover : 'transparent' },
                  ]}
                >
                  <Feather name={icon} size={15} color={selected ? theme.accent : theme.sub} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                      {label}
                    </Text>
                    {!!sub && (
                      <Text style={[styles.rowSub, { color: theme.sub }]} numberOfLines={1}>
                        {sub}
                      </Text>
                    )}
                  </View>
                  {item.kind !== 'command' && (
                    <Text style={[styles.kindChip, { color: theme.sub, backgroundColor: theme.chipBg }]}>
                      {item.kind}
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />
        )}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000000,
    alignItems: 'center',
    paddingTop: '10%',
    paddingHorizontal: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 24px 70px rgba(15, 23, 42, 0.35)' } as any)
      : { elevation: 12 }),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  escChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  escText: { fontSize: 10, fontWeight: '600' },
  empty: { padding: 28, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 1 },
  kindChip: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
