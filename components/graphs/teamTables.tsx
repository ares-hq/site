import { TeamInfo } from '@/api/types';
import React, { useEffect, useMemo, useState } from 'react';
import UpDown from '@/assets/icons/caret-up-down.svg';
import Down from '@/assets/icons/caret-down.svg';
import Check from '@/assets/icons/check-circle.svg';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { filterTeams } from '@/api/algorithms/filter';
import { useWindowDimensions } from 'react-native';

const ITEMS_PER_PAGE = 20;
const router = useRouter();

type DataTableProps = {
  teams: TeamInfo[];
  data: 'overall' | 'auto' | 'teleop' | 'endgame';
};

export default function DataTable({ teams, data}: DataTableProps) {
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<any>('overallRank');
  const [columnDropdownVisible, setColumnDropdownVisible] = useState(false);
  const allColumns = [
    { label: 'Team Number', value: 'teamNumber' },
    { label: 'Team Name', value: 'teamName' },
    { label: 'OPR', value: 'opr' },
    { label: 'Rank', value: 'rank' },
    { label: 'Location', value: 'location' },
    ];
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 700;

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
      <View style={styles.dropdownMenu}>
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
                <Text style={{ fontWeight: isVisible ? 'bold' : 'normal' }}>{label}</Text>
                {isVisible && <Check height={14} width={14} />}
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
    if (isSmallScreen && (column === 'teamName' || column === 'teamNumber')) {
      return;
    }

    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
};

    const renderItem = ({ item }: { item: TeamInfo }) => (
    <Pressable
    onPress={() => router.push(`/dashboards/intothedeep?teamnumber=${item.teamNumber}`)}
    style={({ hovered }) => [styles.row, { flex: 1 }, hovered && styles.rowHovered]}
    >
    {visibleColumns.includes('teamNumber') && (
        <Text style={styles.cell}>{item.teamNumber}</Text>
    )}
    {visibleColumns.includes('teamName') && (
        <Text style={[styles.cell, styles.name]}>{item.teamName}</Text>
    )}
    {visibleColumns.includes('opr') && (
        <Text style={[styles.cell, styles.opr]}>
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
        <Text style={[styles.cell, styles.opr]}>
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
        <Text style={[styles.cell, styles.location]}>
        {item.location?.split(',').slice(-2).join(', ').trim()}
        </Text>
    )}
    <View style={styles.divider} />
    </Pressable>
    );

  return (
    <View style={styles.container}>
      {/* Filter & Sort */}
        <View style={styles.filterRow}>
            <TextInput
                style={styles.input}
                placeholder="Search Team..."
                value={query}
                onChangeText={setQuery}
            />
            <View style={{ flexDirection: 'row' }}>
                <View style={styles.dropdownWrapper}>
                <Pressable
                    onPress={() => setColumnDropdownVisible((prev) => !prev)}
                    style={styles.dropdown}
                >
                    <View style={styles.dropdownLabel}>
                    <Text style={styles.dropdownText}>Columns</Text>
                    <Down height={14} width={14} />
                    </View>
                </Pressable>
                </View>
            </View>
        </View>

        {columnDropdownVisible && renderDropdown()}

      {/* Table Header */}
      <View style={[styles.row, styles.headerRow]}>
        {visibleColumns.includes('teamNumber') && (
          <Pressable onPress={() => handleSort('teamNumber')} style={styles.cell}>
            <View style={styles.headerItem}>
              <Text style={styles.headerText}>Team #</Text>
              {sortColumn === 'teamNumber' && <UpDown height={14} width={14} />}
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('teamName') && (
          <Pressable onPress={() => handleSort('teamName')} style={[styles.cell, styles.name]}>
            <View style={styles.headerItem}>
              <Text style={styles.headerText}>Team Name</Text>
              {sortColumn === 'teamName' && <UpDown height={14} width={14} />}
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('opr') && (
          <Pressable onPress={() => handleSort('overallOPR')} style={styles.cell}>
            <View style={[styles.headerItem, styles.alignRight]}>
              {sortColumn === 'overallOPR' && <UpDown height={14} width={14} />}
              <Text style={[styles.headerText, styles.textRight]}>OPR</Text>
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('rank') && (
          <Pressable onPress={() => handleSort('overallRank')} style={styles.cell}>
            <View style={[styles.headerItem, styles.alignRight]}>
              {sortColumn === 'overallRank' && <UpDown height={14} width={14} />}
              <Text style={[styles.headerText, styles.textRight]}>Rank</Text>
            </View>
          </Pressable>
        )}
        {visibleColumns.includes('location') && (
          <Pressable onPress={() => handleSort('location')} style={[styles.cell, styles.location]}>
            <View style={[styles.headerItem, styles.alignRight]}>
              {sortColumn === 'location' && <UpDown height={14} width={14} />}
              <Text style={[styles.headerText, styles.textRight]}>Location</Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Table Body */}
      <FlatList
        data={paginated}
        keyExtractor={(item) => item.teamNumber && item.teamNumber.toString() || 'No Number Found'}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', padding: 20 }}>No results.</Text>}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.selectionText}>
          {filtered.length} teams found. Page {page + 1} of {Math.ceil(filtered.length / ITEMS_PER_PAGE)}
        </Text>
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={page === 0}
            onPress={() => setPage((p) => p - 1)}
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
          >
            <Text>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={page >= Math.ceil(filtered.length / ITEMS_PER_PAGE) - 1}
            onPress={() => setPage((p) => p + 1)}
            style={[
              styles.pageBtn,
              page >= Math.ceil(filtered.length / ITEMS_PER_PAGE) - 1 && styles.pageBtnDisabled,
            ]}
          >
            <Text>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    width: '100%',
  },
  rowHovered: {
    backgroundColor: '#e5e7eb', 
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  dropdown: {
    alignItems: 'center',
    marginLeft: 12,
    padding: 10,
    backgroundColor: '#f3f4f6',
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
    backgroundColor: '#e5e7eb',
    marginHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
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
    backgroundColor: '#f3f4f6',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerText: {
    fontWeight: '600',
    color: '#111827',
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
    color: '#6b7280',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    dropdownDivider: {
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 4,
    },
    dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
    },
    dropdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // if supported, or use marginLeft
    },
    dropdownText: {
    fontSize: 14,
    marginRight: 4, // fallback if gap doesn't work
    },
});