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

// Route path mapping function - same as in teamTables
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
  return routePaths[year] || 'age'; // fallback to 2025
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
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<Item>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = {
    bg: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
    text: isDarkMode ? '#f9fafb' : '#111827',
    sub: isDarkMode ? '#9ca3af' : '#6b7280',
    hintBg: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fff',
    hintBorder: isDarkMode ? '#4b5563' : '#e5e7eb',
    chipBg: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    chipText: isDarkMode ? '#6b7280' : '#9ca3af',
    rowHover: isDarkMode ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.10)',
    border: isDarkMode ? '#374151' : '#e5e7eb',
    panel: isDarkMode ? '#1f2937' : '#ffffff',
  };

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      // Clear results when no search query
      setResults([]);
      setOpen(false);
      setSelectedIndex(0);
      return;
    }
    
    try {
      // Use the year prop for search data instead of hardcoded 2024
      const allTeams = await getAllTeams(year);
      if (!allTeams) {
        console.warn('No teams data available');
        setResults([]);
        setOpen(false);
        setSelectedIndex(0);
        return;
      }

      // Use the same filterTeams function as teamTables for consistent search behavior
      const filteredTeams = filterTeams(allTeams, trimmed);
      
      // Convert filtered teams to search result items
      const teamItems: Item[] = filteredTeams.slice(0, maxResults).map((team) => ({
        id: String(team.teamNumber),
        type: 'team',
        title: `Team ${team.teamNumber}`,
        description: [team.teamName, team.location].filter(Boolean).join(' • '),
        teamNumber: team.teamNumber,
      }));
      
      setResults(teamItems);
      setOpen(trimmed.length > 0); // Show dropdown if user is searching, even with no results
      setSelectedIndex(0);
    } catch (error) {
      console.warn('Team search error:', error);
      setResults([]);
      setOpen(trimmed.length > 0); // Show dropdown with 'No results' if user was searching
      setSelectedIndex(0);
    }
  };

  // Debounce - include year dependency since we use it for data fetching
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, year]); // Re-added year dependency

  const onFocus = () => {
    if (results.length > 0) {
      setOpen(true);
    }
    // Don't show anything when focusing on empty search - user needs to type
  };
  // Give clicks time to fire before closing
  const onBlur = () => setTimeout(() => setOpen(false), 80);

  const handleSelect = useCallback((item: Item) => {
    if (item.type === 'team' && item.teamNumber != null) {
      // Navigate to the team's dashboard page
      const routePath = getRoutePath(year);
      router.push(`/dashboards/${routePath}?teamnumber=${item.teamNumber}` as any);
      
      // Also call the callback if provided
      onSelectTeam?.(item.teamNumber);
    }
    setOpen(false);
    setQuery(''); // Clear search after selection
    inputRef.current?.blur();
  }, [onSelectTeam, router, year]);

  // Web keyboard nav + "/" focus
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const onKey = (e: KeyboardEvent) => {
      // Global "/" focus shortcut
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      
      // Only handle navigation when dropdown is open and has results
      if (!open || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newIndex = Math.min(selectedIndex + 1, results.length - 1);
        setSelectedIndex(newIndex);
        // Scroll to item if needed
        try {
          listRef.current?.scrollToIndex({ 
            index: newIndex, 
            animated: true,
            viewPosition: 0.5 
          });
        } catch (error) {
          // Ignore scroll errors
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newIndex = Math.max(selectedIndex - 1, 0);
        setSelectedIndex(newIndex);
        // Scroll to item if needed
        try {
          listRef.current?.scrollToIndex({ 
            index: newIndex, 
            animated: true,
            viewPosition: 0.5 
          });
        } catch (error) {
          // Ignore scroll errors
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[selectedIndex];
        if (item) {
          handleSelect(item);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, results, selectedIndex, handleSelect]);

  const iconFor = (item: Item) => {
    return 'users' as const; // All items are now teams
  };

  const renderItem = ({ item, index }: { item: Item; index: number }) => {
    const selected = index === selectedIndex;
    const hovered = index === hoveredIndex;
    
    return (
      <Pressable
        onPressIn={() => handleSelect(item)}
        onHoverIn={() => {
          setHoveredIndex(index);
          setSelectedIndex(index); // Update selection on hover
        }}
        onHoverOut={() => setHoveredIndex(-1)}
        style={[
          styles.row,
          { 
            backgroundColor: (selected || hovered) ? theme.rowHover : 'transparent', 
            borderBottomColor: theme.border 
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.chipBg }]}>
          <Feather name={iconFor(item)} size={14} color={theme.sub} />
        </View>
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
          placeholder={placeholder}
          placeholderTextColor={theme.sub}
          style={[styles.input, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => results[0] && handleSelect(results[0])}
        />
        <View style={[styles.keyHint, { backgroundColor: theme.hintBg, borderColor: theme.hintBorder }]}>
          <Text style={[styles.keyText, { color: theme.chipText }]}>/</Text>
        </View>
      </Pressable>

      {open && (
        <View
          style={[
            styles.panel,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              // make sure we float above neighbors on both platforms
              zIndex: zIndex + 10,
              elevation: 999,
            },
          ]}
          // allow clicks through outside the box
          pointerEvents="box-none"
        >
          {results.length > 0 ? (
            <FlatList
              ref={listRef}
              data={results}
              keyExtractor={(it) => it.id}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 280 }}
              getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
            />
          ) : (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: theme.sub }]}>
                No results found
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',        // critical for absolute dropdown positioning
    width: 200,
    zIndex: 99999,              // ensure the wrapper has extremely high z-index
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 9,
  },
  searchIcon: { marginRight: 7 },
  input: { 
    fontSize: 13, 
    padding: 0, 
    borderWidth: 0, 
    width: 140, 
    outline: 'none' as any, // Cast to any to avoid TS issues with web-specific property
  },
  keyHint: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  keyText: { fontSize: 10, fontWeight: '500' },
  panel: {
    position: 'absolute',
    top: '100%',                 // sits directly below the input
    left: 0,
    right: 0,
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 999999,             // maximum z-index for the dropdown panel
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  rowDesc: { fontSize: 12 },
  rowType: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: { fontSize: 11, textAlign: 'center' },
  noResults: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SearchDropdown;