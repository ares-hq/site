// SearchDropdown.tsx — global team / event search used in the header.
import { filterTeams } from '@/api/algorithms/filter';
import { getEventsBasic } from '@/api/basic-event-service';
import { getAllTeams } from '@/api/dashboardInfo';
import { routeFromSeason } from '@/api/utils/seasons';
import { SupportedYear } from '@/api/utils/types';
import { webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type ResultType = 'team' | 'event';
type Item = {
  id: string;
  type: ResultType;
  title: string;
  description?: string;
  teamNumber?: number;
  eventCode?: string;
};

type Props = {
  year: SupportedYear;
  onSelectTeam?: (teamNumber: number) => void;
  placeholder?: string;
  maxResults?: number;
  zIndex?: number;
  style?: any;
};

const DEBOUNCE_MS = 140;
const RECENTS_KEY = 'ares:recent-search';
const MAX_RECENTS = 6;
const isWeb = Platform.OS === 'web';

const getRoutePath = routeFromSeason;

function readRecents(): Item[] {
  if (!isWeb || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function writeRecents(items: Item[]) {
  if (!isWeb || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(items.slice(0, MAX_RECENTS)));
  } catch {
    /* ignore */
  }
}

/** Split `text` on `query` (case-insensitive) and bold the matches. */
function Highlight({ text, query, color, matchColor }: { text: string; query: string; color: string; matchColor: string }) {
  const q = query.trim();
  if (!q) return <Text style={{ color }}>{text}</Text>;
  const lower = text.toLowerCase();
  const lq = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < text.length) {
    const idx = lower.indexOf(lq, i);
    if (idx === -1) {
      parts.push(<Text key={key++} style={{ color }}>{text.slice(i)}</Text>);
      break;
    }
    if (idx > i) parts.push(<Text key={key++} style={{ color }}>{text.slice(i, idx)}</Text>);
    parts.push(
      <Text key={key++} style={{ color: matchColor, fontWeight: '700' }}>
        {text.slice(idx, idx + q.length)}
      </Text>,
    );
    i = idx + q.length;
  }
  return <Text>{parts}</Text>;
}

const SearchDropdown: React.FC<Props> = ({
  year,
  onSelectTeam,
  placeholder = 'Search teams & events',
  maxResults = 24,
  zIndex = 99999,
  style,
}) => {
  const t = useTheme();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<Item[]>([]);
  const [recents, setRecents] = useState<Item[]>([]);
  const [teamsData, setTeamsData] = useState<any[] | null>(null);
  const [eventsData, setEventsData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setRecents(readRecents()), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const [teams, events] = await Promise.all([
        getAllTeams(year).catch(() => []),
        getEventsBasic(year, true).catch(() => []),
      ]);
      if (cancelled) return;
      setTeamsData(teams ?? []);
      setEventsData(events ?? []);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const runSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }
      const lq = trimmed.toLowerCase();

      const teamItems: Item[] = filterTeams(teamsData ?? [], trimmed)
        .slice(0, Math.ceil(maxResults * 0.6))
        .map((team: any) => ({
          id: `team-${team.teamNumber}`,
          type: 'team',
          title: `Team ${team.teamNumber}`,
          description: [team.teamName, team.location].filter(Boolean).join(' • ') || undefined,
          teamNumber: team.teamNumber,
        }));

      const eventItems: Item[] = (eventsData ?? [])
        .filter(
          (ev: any) =>
            ev.name?.toLowerCase().includes(lq) ||
            ev.eventCode?.toLowerCase().includes(lq) ||
            ev.location?.toLowerCase().includes(lq),
        )
        .slice(0, Math.floor(maxResults * 0.4))
        .map((ev: any) => ({
          id: `event-${ev.eventCode}`,
          type: 'event',
          title: ev.name || ev.eventCode,
          description: ev.location || undefined,
          eventCode: ev.eventCode,
        }));

      setResults([...teamItems, ...eventItems]);
      setSelectedIndex(0);
    },
    [teamsData, eventsData, maxResults],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  const handleSelect = useCallback(
    (item: Item) => {
      const next = [item, ...recents.filter((r) => r.id !== item.id)].slice(0, MAX_RECENTS);
      setRecents(next);
      writeRecents(next);

      if (item.type === 'team' && item.teamNumber != null) {
        router.push(`/dashboards/${getRoutePath(year)}?teamnumber=${item.teamNumber}` as any);
        onSelectTeam?.(item.teamNumber);
      } else if (item.type === 'event' && item.eventCode) {
        router.push(`/analytics/events/${item.eventCode}` as any);
      }
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    },
    [recents, router, year, onSelectTeam],
  );

  const clearRecents = () => {
    setRecents([]);
    writeRecents([]);
  };

  // Rows shown in the panel: either live results or (empty query) recents.
  const showingRecents = query.trim().length === 0;
  const rows = showingRecents ? recents : results;
  const teamRows = rows.filter((r) => r.type === 'team');
  const eventRows = rows.filter((r) => r.type === 'event');

  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  // ⌘K opens the command palette (app/_layout.tsx) — this chip is just the hint.
  // Arrows / Enter / Esc while the input is focused. Handled directly on the input so
  // it always sees the current rows + selection (no stale document-listener closure).
  const onInputKey = (e: any) => {
    const key: string = e?.nativeEvent?.key;
    if (key === 'ArrowDown') {
      e.preventDefault?.();
      setOpen(true);
      setSelectedIndex((p) => Math.min(p + 1, rows.length - 1));
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setSelectedIndex((p) => Math.max(p - 1, 0));
    } else if (key === 'Enter') {
      e.preventDefault?.();
      const target = rows[selectedIndex] ?? rows[0];
      if (target) handleSelect(target);
    } else if (key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const panelVisible = open && (isLoading || rows.length > 0 || query.trim().length > 0);

  const renderRow = (item: Item, index: number) => {
    const selected = index === selectedIndex;
    return (
      <Pressable
        key={item.id}
        onPressIn={() => handleSelect(item)}
        onHoverIn={() => setSelectedIndex(index)}
        style={[
          styles.row,
          webTransition('background-color'),
          { backgroundColor: selected ? t.c.rowHover : 'transparent' },
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
          <Feather
            name={item.type === 'team' ? 'users' : 'calendar'}
            size={13}
            color={selected ? t.c.accent : t.c.textMuted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            <Highlight text={item.title} query={showingRecents ? '' : query} color={t.c.text} matchColor={t.c.accentText} />
          </Text>
          {!!item.description && (
            <Text style={[styles.rowDesc, { color: t.c.textMuted }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        {selected && <Feather name="corner-down-left" size={13} color={t.c.textFaint} />}
      </Pressable>
    );
  };

  const SectionLabel = ({ children, right }: { children: string; right?: React.ReactNode }) => (
    <View style={styles.sectionLabelRow}>
      <Text style={[styles.sectionLabel, { color: t.c.textFaint }]}>{children}</Text>
      {right}
    </View>
  );

  return (
    <View style={[styles.wrap, { zIndex }, style]}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.inputWrap,
          webTransition('border-color, background-color'),
          {
            backgroundColor: t.c.field,
            borderColor: focused ? t.c.accent : t.c.border,
          },
        ]}
      >
        <Feather name="search" size={14} color={focused ? t.c.accent : t.c.textMuted} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setOpen(false), 120);
          }}
          onKeyPress={onInputKey}
          onSubmitEditing={() => {
            const target = rows[selectedIndex] ?? rows[0];
            if (target) handleSelect(target);
          }}
          blurOnSubmit={false}
          returnKeyType="go"
          placeholder={isLoading ? 'Loading…' : placeholder}
          placeholderTextColor={t.c.textMuted}
          style={[styles.input, { color: t.c.text }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => { setQuery(''); inputRef.current?.focus(); }} hitSlop={8}>
            <Feather name="x" size={13} color={t.c.textMuted} />
          </Pressable>
        ) : (
          <View style={[styles.kbd, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
            <Text style={[styles.kbdText, { color: t.c.textFaint }]}>⌘K</Text>
          </View>
        )}
      </Pressable>

      {panelVisible && (
        <View
          style={[
            styles.panel,
            t.shadow.pop,
            { backgroundColor: t.c.raised, borderColor: t.c.border, zIndex: zIndex + 10 },
          ]}
        >
          {isLoading ? (
            <View style={{ paddingVertical: 8 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={{ height: 11, width: '45%', borderRadius: 5, backgroundColor: t.c.hairline }} />
                    <View style={{ height: 9, width: '70%', borderRadius: 5, backgroundColor: t.c.hairline }} />
                  </View>
                </View>
              ))}
            </View>
          ) : showingRecents ? (
            recents.length > 0 ? (
              <FlatList
                data={recents}
                keyExtractor={(it) => it.id}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 320 }}
                ListHeaderComponent={
                  <SectionLabel
                    right={
                      <Pressable onPress={clearRecents} hitSlop={6}>
                        <Text style={[styles.clearText, { color: t.c.textFaint }]}>Clear</Text>
                      </Pressable>
                    }
                  >
                    Recent
                  </SectionLabel>
                }
                renderItem={({ item, index }) => renderRow(item, index)}
              />
            ) : (
              <View style={styles.hintBox}>
                <Text style={[styles.hintTitle, { color: t.c.textMuted }]}>Search anything</Text>
                <Text style={[styles.hintText, { color: t.c.textFaint }]}>
                  Try a team number, a team name, or an event.
                </Text>
              </View>
            )
          ) : rows.length > 0 ? (
            <FlatList
              data={[
                ...(teamRows.length ? [{ __section: 'Teams' }] : []),
                ...teamRows,
                ...(eventRows.length ? [{ __section: 'Events' }] : []),
                ...eventRows,
              ]}
              keyExtractor={(row: any, i) => (row.__section ? `s-${row.__section}` : row.id + i)}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 340 }}
              renderItem={({ item }: any) => {
                if (item.__section) return <SectionLabel>{item.__section}</SectionLabel>;
                const idx = rows.findIndex((r) => r.id === item.id);
                return renderRow(item, idx);
              }}
            />
          ) : (
            <View style={styles.hintBox}>
              <Text style={[styles.hintTitle, { color: t.c.textMuted }]}>No matches for “{query.trim()}”</Text>
              <Text style={[styles.hintText, { color: t.c.textFaint }]}>Check the spelling or try a team number.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: 256, zIndex: 99999 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 11,
    paddingRight: 7,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  kbd: {
    height: 18,
    minWidth: 24,
    paddingHorizontal: 5,
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbdText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  panel: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700' },
  clearText: { fontSize: 11, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 13.5, fontWeight: '500' },
  rowDesc: { fontSize: 11.5, marginTop: 1 },
  hintBox: { paddingHorizontal: 16, paddingVertical: 18, gap: 3 },
  hintTitle: { fontSize: 13, fontWeight: '600' },
  hintText: { fontSize: 12 },
});

export default SearchDropdown;
