import { filterTeams } from '@/api/algorithms/filter';
import { SupportedYear, TeamInfo } from '@/api/utils/types';
import Down from '@/assets/icons/caret-down.svg';
import UpDown from '@/assets/icons/caret-up-down.svg';
import Check from '@/assets/icons/check-circle.svg';
import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const ITEMS_PER_PAGE = 20;
const router = useRouter();

type DataTableProps = {
  teams: TeamInfo[];
  data: 'overall' | 'auto' | 'teleop' | 'endgame';
  selectedYear?: SupportedYear; 
};

export default function DataTable({ teams, data, selectedYear = 2025 }: DataTableProps) {
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<any>('overallRank');
  const [columnDropdownVisible, setColumnDropdownVisible] = useState(false);
  const { isDarkMode } = useDarkMode();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 700;

  const allColumns = [
    { label: 'Team Number', value: 'teamNumber' },
    { label: 'Team Name', value: 'teamName' },
    { label: 'OPR', value: 'opr' },
    { label: 'Rank', value: 'rank' },
    { label: 'Location', value: 'location' },
  ];

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
    return routePaths[year] || 'freightfrenzy'; // fallback to 2021
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'teamNumber',
    'teamName',
    'opr',
    'rank',
    'location',
  ]);

  useEffect(() => {
    setVisibleColumns((current) => {
      if (isSmallScreen && current.includes('location')) {
        return current.filter((col) => col !== 'location');
      }
      if (!isSmallScreen && !current.includes('location')) {
        return [...current, 'location'];
      }
      return current;
    });
  }, [isSmallScreen]);

  const renderDropdown = () => {
    const filteredColumns = allColumns.filter(
      (col) => !(isSmallScreen && col.value === 'location')
    );

    return (
      <View style={[styles.dropdownMenu, {
        backgroundColor: isDarkMode ? 'rgba(61, 61, 61, 1)' : '#fff',
        borderColor: isDarkMode ? '#4B5563' : '#e5e7eb',
      }]}>
        {filteredColumns.map(({ label, value }) => {
          const isVisible = visibleColumns.includes(value);

          return (
            <TouchableOpacity
              key={value}
              onPress={() => {
                const next = isVisible
                  ? visibleColumns.filter((v) => v !== value)
                  : [...visibleColumns, value];

                const hasNameOrNumber = next.includes('teamName') || next.includes('teamNumber');
                const hasOneStatColumn = ['opr', 'rank', 'location'].some(col => next.includes(col));

                if (hasNameOrNumber && hasOneStatColumn) {
                  setVisibleColumns(next);
                }
              }}
              style={styles.dropdownItem}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontWeight: isVisible ? 'bold' : 'normal', color: isDarkMode ? '#fff' : '#000' }}>
                  {label}
                </Text>
                {isVisible && <Check height={14} width={14} fill={isDarkMode ? '#fff' : '#000'}/>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const filtered = useMemo(() => {
    const isSearching = query.trim().length > 0;
    const base = isSearching ? filterTeams(teams, query) : [...teams];

    if (isSearching) return base;

    const sortField = ((): keyof TeamInfo => {
      if (sortColumn === 'overallOPR') {
        if (data === 'auto') return 'autoOPR';
        if (data === 'teleop') return 'teleOPR';
        if (data === 'endgame') return 'endgameOPR';
        return 'overallOPR';
      }

      if (sortColumn === 'overallRank') {
        if (data === 'auto') return 'autoRank';
        if (data === 'teleop') return 'teleRank';
        if (data === 'endgame') return 'endgameRank';
        return 'overallRank';
      }

      return sortColumn;
    })();

    return base.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      } else {
        return sortAsc
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
    });
  }, [query, sortAsc, sortColumn, data, teams]);

  const paginated = filtered.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const handleSort = (column: keyof TeamInfo) => {
    if (isSmallScreen && (column === 'teamName' || column === 'teamNumber')) return;
    if (sortColumn === column) setSortAsc(!sortAsc);
    else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  const renderItem = ({ item }: { item: TeamInfo }) => (
    <Pressable
      onPress={() => {
        if (item.teamNumber) {
          router.push(`/dashboards/${getRoutePath(selectedYear)}?teamnumber=${item.teamNumber}` as any);
        }
      }}
      style={({ hovered }) => [
        styles.row,
        hovered && styles.rowHovered,
        { backgroundColor: hovered ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : 'transparent' }
      ]}
    >
      {visibleColumns.includes('teamNumber') && (
        <Text style={[styles.cell, { color: isDarkMode ? '#fff' : '#000' }]}>{item.teamNumber}</Text>
      )}
      {visibleColumns.includes('teamName') && (
        <Text style={[styles.cell, styles.name, { color: isDarkMode ? '#fff' : '#000' }]}>{item.teamName}</Text>
      )}
      {visibleColumns.includes('opr') && (
        <Text style={[styles.cell, styles.opr, { color: isDarkMode ? '#fff' : '#000' }]}>
          {data === 'overall'
            ? item.overallOPR?.toFixed(2)
            : data === 'auto'
              ? item.autoOPR?.toFixed(2)
              : data === 'teleop'
                ? item.teleOPR?.toFixed(2)
                : data === 'endgame'
                  ? item.endgameOPR?.toFixed(2)
                  : '—'}
        </Text>
      )}
      {visibleColumns.includes('rank') && (
        <Text style={[styles.cell, styles.opr, { color: isDarkMode ? '#F8FAFC' : '#111827' }]}>
          {data === 'overall'
            ? item.overallRank
            : data === 'auto'
              ? item.autoRank
              : data === 'teleop'
                ? item.teleRank
                : data === 'endgame'
                  ? item.endgameRank
                  : '—'}
        </Text>
      )}
      {visibleColumns.includes('location') && (
        <Text style={[styles.cell, styles.location, { color: isDarkMode ? '#fff' : '#000' }]}>
          {item.location?.split(',').slice(-2).join(', ').trim()}
        </Text>
      )}
      <View style={[styles.divider, { backgroundColor: isDarkMode ? '#2a2a2a' : '#e5e7eb' }]} />
    </Pressable>
  );

  return (
    <View style={[styles.container, {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
    }]}>
      <View style={styles.filterRow}>
        <TextInput
          style={[
            styles.input,
            {
              outline: 'none',
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff',
              borderColor: isDarkMode ? '#4B5563' : '#e5e7eb',
              color: isDarkMode ? '#fff' : '#000'
            }
          ]}
          placeholder="Search Team..."
          placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            if (filtered.length > 0) {
              router.push(`/dashboards/${getRoutePath(selectedYear)}?teamnumber=${filtered[0].teamNumber}` as any);
              setQuery('');
            }
          }}
        />
        <View style={styles.dropdownWrapper}>
          <Pressable
            onPress={() => setColumnDropdownVisible((prev) => !prev)}
            style={[
              styles.dropdown,
              {
                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
              }
            ]}
          >
            <View style={styles.dropdownLabel}>
              <Text style={[styles.dropdownText, { color: isDarkMode ? '#fff' : '#000' }]}>Columns</Text>
              <Down height={14} width={14} fill={isDarkMode ? '#fff' : '#000'}/>
            </View>
          </Pressable>
        </View>
      </View>

      {columnDropdownVisible && renderDropdown()}

      {/* Table Header */}
      <View style={[styles.row, styles.headerRow, {
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : '#f3f4f6',
      }]}>
        {visibleColumns.includes('teamNumber') && (
          <Pressable onPress={() => handleSort('teamNumber')} style={styles.cell}>
            <View style={styles.headerItem}>
              <Text style={[styles.headerText, { color: isDarkMode ? '#fff' : '#111827' }]}>Team #</Text>
              {sortColumn === 'teamNumber' && <UpDown height={14} width={14} color={isDarkMode ? '#fff' : '#111827'}/>}
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('teamName') && (
          <Pressable onPress={() => handleSort('teamName')} style={[styles.cell, styles.name]}>
            <View style={styles.headerItem}>
              <Text style={[styles.headerText, { color: isDarkMode ? '#fff' : '#111827' }]}>Team Name</Text>
              {sortColumn === 'teamName' && <UpDown height={14} width={14} color={isDarkMode ? '#fff' : '#111827'}/>}
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('opr') && (
          <Pressable onPress={() => handleSort('overallOPR')} style={styles.cell}>
            <View style={[styles.headerItem, styles.alignRight]}>
              {sortColumn === 'overallOPR' && <UpDown height={14} width={14} color={isDarkMode ? '#fff' : '#111827'}/>}
              <Text style={[styles.headerText, styles.textRight, { color: isDarkMode ? '#fff' : '#111827' }]}>OPR</Text>
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('rank') && (
          <Pressable onPress={() => handleSort('overallRank')} style={styles.cell}>
            <View style={[styles.headerItem, styles.alignRight]}>
              {sortColumn === 'overallRank' && <UpDown height={14} width={14} color={isDarkMode ? '#fff' : '#111827'}/>}
              <Text style={[styles.headerText, styles.textRight, { color: isDarkMode ? '#fff' : '#111827' }]}>Rank</Text>
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('location') && (
          <Pressable onPress={() => handleSort('location')} style={[styles.cell, styles.location]}>
            <View style={[styles.headerItem, styles.alignRight]}>
              {sortColumn === 'location' && <UpDown height={14} width={14} color={isDarkMode ? '#fff' : '#111827'}/>}
              <Text style={[styles.headerText, styles.textRight, { color: isDarkMode ? '#fff' : '#111827' }]}>Location</Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Table Body */}
      <FlatList
        data={paginated}
        keyExtractor={(item) => item.teamNumber?.toString() || 'unknown'}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', padding: 20, color: isDarkMode ? '#fff' : '#000' }}>No results.</Text>}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.selectionText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
          {filtered.length} teams found. Page {page + 1} of {Math.ceil(filtered.length / ITEMS_PER_PAGE)}
        </Text>
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={page === 0}
            onPress={() => setPage((p) => p - 1)}
            style={[styles.pageBtn, {
              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
              opacity: page === 0 ? 0.5 : 1,
            }]}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={page >= Math.ceil(filtered.length / ITEMS_PER_PAGE) - 1}
            onPress={() => setPage((p) => p + 1)}
            style={[styles.pageBtn, {
              backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
              opacity: page >= Math.ceil(filtered.length / ITEMS_PER_PAGE) - 1 ? 0.5 : 1,
            }]}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    flex: 1,
    width: '100%',
  },
  rowHovered: {
    borderRadius: 8,
  },
  input: {
    outline: 'none',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  dropdown: {
    alignItems: 'center',
    marginLeft: 12,
    padding: 10,
    borderRadius: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    marginHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    minHeight: 50,
    marginTop: -1
  },
  headerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerRow: {
    marginBottom: 8,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerText: {
    fontWeight: '600',
  },
  name: {
    flex: 2,
  },
  opr: {
    textAlign: 'right',
  },
  location: {
    flex: 1.5,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 10,
  },
  textRight: {
    textAlign: 'right',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 10,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownText: {
    fontSize: 14,
    marginRight: 4,
  },
});