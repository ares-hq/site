// SearchDropdown.tsx
import { filterTeams } from '@/api/algorithms/filter';
import { getAllTeams, SupportedYear } from '@/api/dashboardInfo';
import { useDarkMode } from '@/context/DarkModeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type ResultType = 'team' | 'aux';
type Item = {
  id: string;
  type: ResultType;
  title: string;
  description?: string;
  teamNumber?: number;
};

type Props = {
  year: SupportedYear;
  onSelectTeam?: (teamNumber: number) => void;
  onSelectAux?: (id: 'analysts' | 'favorites' | 'watchlist' | 'stats') => void;
  placeholder?: string;
  maxResults?: number;
  /** If your parent has other absolute layers, raise this. */
  zIndex?: number;
  /** Optional style for the outer wrapper */
  style?: any;
};

const DEBOUNCE_MS = 160;

const getRoutePath = (year: SupportedYear) => {
  const routePaths: Record<SupportedYear, string> = {
    2019: 'rise',
    2020: 'forward', 
    2021: 'gameChangers',
    2022: 'energize',
    2023: 'inShow',
    2024: 'intothedeep',
    2025: 'age',
  };
  return routePaths[year] || 'age';
};

const SearchDropdown: React.FC<Props> = ({
  year,
  onSelectTeam,
  onSelectAux,
  placeholder = 'Search teams…',
  maxResults = 20,
  zIndex = 99999,
  style,
}) => {
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [results, setResults] = useState<Item[]>([]);
  const [allTeamsData, setAllTeamsData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Item>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const preloadTeamsData = async () => {
      if (allTeamsData && !isLoading) return;
      
      setIsLoading(true);
      try {
        const teams = await getAllTeams(year);
        setAllTeamsData(teams || []);
      } catch (error) {
        console.error('Failed to preload teams data:', error);
        setAllTeamsData([]);
      } finally {
        setIsLoading(false);
      }
    };
    preloadTeamsData();
  }, [year]);

  // THEME: Neutralized Dark Mode (Removed Blues)
  const theme = {
    bg: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    text: isDarkMode ? '#f9fafb' : '#111827',
    sub: isDarkMode ? '#9ca3af' : '#6b7280',
    hintBg: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fff',
    hintBorder: isDarkMode ? '#4b5563' : '#e5e7eb',
    chipBg: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    chipText: isDarkMode ? '#9ca3af' : '#6b7280',
    // FIXED: Neutral grayscale hover instead of blue
    rowHover: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    border: isDarkMode ? '#4b5563' : '#e5e7eb',
    panel: isDarkMode ? '#262626' : '#ffffff',
  };

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      setSelectedIndex(0);
      return;
    }
    
    try {
      let teamsData = allTeamsData;
      if (!teamsData || teamsData.length === 0) {
        teamsData = await getAllTeams(year);
        if (teamsData) setAllTeamsData(teamsData);
      }
      
      if (!teamsData || teamsData.length === 0) {
        setResults([]);
        setOpen(trimmed.length > 0);
        return;
      }

      const filteredTeams = filterTeams(teamsData, trimmed);
      const teamItems: Item[] = filteredTeams.slice(0, maxResults).map((team) => ({
        id: String(team.teamNumber),
        type: 'team',
        title: `Team ${team.teamNumber}`,
        description: [team.teamName, team.location].filter(Boolean).join(' • '),
        teamNumber: team.teamNumber,
      }));
      
      setResults(teamItems);
      setOpen(trimmed.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      setResults([]);
      setOpen(trimmed.length > 0);
    }
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, allTeamsData]);

  const onFocus = () => { if (results.length > 0) setOpen(true); };
  const onBlur = () => setTimeout(() => setOpen(false), 80);

  const handleSelect = useCallback((item: Item) => {
    if (item.type === 'team' && item.teamNumber != null) {
      const routePath = getRoutePath(year);
      router.push(`/dashboards/${routePath}?teamnumber=${item.teamNumber}` as any);
      onSelectTeam?.(item.teamNumber);
    }
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }, [onSelectTeam, router, year]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (!open || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) handleSelect(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, results, selectedIndex, handleSelect]);

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    const isSelected = index === selectedIndex;
    const isHovered = index === hoveredIndex;
    
    return (
      <Pressable
        onPressIn={() => handleSelect(item)}
        onHoverIn={() => {
          setHoveredIndex(index);
          setSelectedIndex(index);
        }}
        onHoverOut={() => setHoveredIndex(-1)}
        style={[
          styles.row,
          { 
            backgroundColor: (isSelected || isHovered) ? theme.rowHover : 'transparent', 
            borderBottomColor: theme.border 
          },
        ]}
      >
        {/* <View style={[styles.iconWrap, { backgroundColor: theme.chipBg }]}>
          <Feather name="users" size={14} color={theme.sub} />
        </View> */}
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!!item.description && (
            <Text style={[styles.rowDesc, { color: theme.sub }]} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <Text style={[styles.rowType, { color: theme.chipText, backgroundColor: theme.chipBg }]}>
          {item.type}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.wrap, { zIndex }, style]}>
      <Pressable onPress={() => inputRef.current?.focus()} style={[styles.inputWrap, { backgroundColor: theme.bg }]}>
        <Feather name="search" size={14} color={theme.sub} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={isLoading ? "Loading teams..." : placeholder}
          placeholderTextColor={theme.sub}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          editable={!isLoading}
          onSubmitEditing={() => {
            if (results.length > 0) {
              router.push(`/dashboards/${getRoutePath(year)}?teamnumber=${results[0].teamNumber}` as any);
            }
          }}
        />
        <View style={[styles.keyHint, { backgroundColor: theme.hintBg, borderColor: theme.hintBorder }]}>
          <Text style={[styles.keyText, { color: theme.chipText }]}>/</Text>
        </View>
      </Pressable>

      {open && (
        <View style={[styles.panel, { backgroundColor: theme.panel, borderColor: theme.border, zIndex: zIndex + 10, elevation: 999 }]} pointerEvents="box-none">
          {isLoading ? (
            <View style={styles.noResults}><Text style={[styles.noResultsText, { color: theme.sub }]}>Loading teams...</Text></View>
          ) : results.length > 0 ? (
            <FlatList
              ref={listRef}
              data={results}
              keyExtractor={(it) => it.id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 280 }}
            />
          ) : (
            <View style={styles.noResults}><Text style={[styles.noResultsText, { color: theme.sub }]}>No results found</Text></View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: 225, zIndex: 99999 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 4, borderRadius: 9 },
  searchIcon: { marginRight: 7 },
  input: { fontSize: 13, padding: 0, borderWidth: 0, width: 175, outlineStyle: 'none' } as any,
  keyHint: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  keyText: { fontSize: 10, fontWeight: '500' },
  panel: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowDesc: { fontSize: 12 },
  rowType: { fontSize: 10, textTransform: 'uppercase', fontWeight: '600', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  noResults: { paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center' },
  noResultsText: { fontSize: 14, textAlign: 'center' },
});

export default SearchDropdown;