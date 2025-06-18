import { TeamInfo } from '@/api/types';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';

const ITEMS_PER_PAGE = 20;

type DataTableProps = {
  teams: TeamInfo[];
};

export default function DataTable({ teams }: DataTableProps) {
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<keyof TeamInfo>('teamName');
  const [sortDropdownVisible, setSortDropdownVisible] = useState(false);

  const filtered = useMemo(() => {
    const base = teams.filter((team) =>
      team.teamName.toLowerCase().includes(query.toLowerCase())
    );
    return base.sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
    } else {
        return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }
    });
  }, [query, sortAsc, teams]);

  const paginated = filtered.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const handleSort = (column: keyof TeamInfo) => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  const renderItem = ({ item }: { item: TeamInfo }) => (
    <View style={styles.row}>
      <Text style={[styles.cell]}>{item.teamNumber}</Text>
      <Text style={[styles.cell, styles.name]}>{item.teamName}</Text>
      <Text style={[styles.cell, styles.opr]}>{item.overallOPR?.toFixed(2)}</Text>
      <Text style={[styles.cell, styles.opr]}>{item.overallRank}</Text>
      <Text style={[styles.cell, styles.location]}>
        {item.location.split(',').slice(-2).join(', ').trim()}
      </Text>
    </View>
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
                    <TouchableOpacity
                    onPress={() => setSortDropdownVisible((prev) => !prev)}
                    style={styles.dropdown}
                    >
                    <Text>Columns ▾</Text>
                    </TouchableOpacity>
                    {sortDropdownVisible && (
                    <View style={styles.dropdownMenu}>
                        {[
                        { label: 'Team Number', value: 'teamNumber' },
                        { label: 'Team Name', value: 'teamName' },
                        { label: 'OPR', value: 'overallOPR' },
                        { label: 'Rank', value: 'overallRank' },
                        { label: 'Location', value: 'location' },
                        ].map(({ label, value }) => (
                        <TouchableOpacity
                            key={value}
                            onPress={() => {
                            setSortColumn(value as keyof TeamInfo);
                            setSortDropdownVisible(false);
                            }}
                            style={styles.dropdownItem}
                        >
                            <Text style={{ fontWeight: sortColumn === value ? 'bold' : 'normal' }}>
                            {label} {sortColumn === value ? (sortAsc ? '↑' : '↓') : ''}
                            </Text>
                        </TouchableOpacity>
                        ))}
                        <View style={styles.dropdownDivider} />
                        <TouchableOpacity onPress={() => setSortAsc((prev) => !prev)} style={styles.dropdownItem}>
                        <Text>Toggle Order</Text>
                        </TouchableOpacity>
                    </View>
                    )}
                </View>
                <View style={styles.dropdownWrapper}>
                    <TouchableOpacity
                    onPress={() => setSortDropdownVisible((prev) => !prev)}
                    style={styles.dropdown}
                    >
                    <Text>Sort By ▾</Text>
                    </TouchableOpacity>
                    {sortDropdownVisible && (
                    <View style={styles.dropdownMenu}>
                        {[
                        { label: 'Team Number', value: 'teamNumber' },
                        { label: 'Team Name', value: 'teamName' },
                        { label: 'OPR', value: 'overallOPR' },
                        { label: 'Rank', value: 'overallRank' },
                        { label: 'Location', value: 'location' },
                        ].map(({ label, value }) => (
                        <TouchableOpacity
                            key={value}
                            onPress={() => {
                            setSortColumn(value as keyof TeamInfo);
                            setSortDropdownVisible(false);
                            }}
                            style={styles.dropdownItem}
                        >
                            <Text style={{ fontWeight: sortColumn === value ? 'bold' : 'normal' }}>
                            {label} {sortColumn === value ? (sortAsc ? '↑' : '↓') : ''}
                            </Text>
                        </TouchableOpacity>
                        ))}
                        <View style={styles.dropdownDivider} />
                        <TouchableOpacity onPress={() => setSortAsc((prev) => !prev)} style={styles.dropdownItem}>
                        <Text>Toggle Order</Text>
                        </TouchableOpacity>
                    </View>
                    )}
                </View>
            </View>
        </View>

      {/* Table Header */}
      <View style={[styles.row, styles.headerRow]}>
        <Pressable onPress={() => handleSort('teamNumber')} style={styles.cell}>
          <Text style={styles.headerText}>Team # {sortColumn === 'teamNumber' && (sortAsc ? '↑' : '↓')}</Text>
        </Pressable>
        <Pressable onPress={() => handleSort('teamName')} style={[styles.cell, styles.name]}>
          <Text style={styles.headerText}>Team Name {sortColumn === 'teamName' && (sortAsc ? '↑' : '↓')}</Text>
        </Pressable>
        <Pressable onPress={() => handleSort('overallOPR')} style={[styles.cell]}>
          <Text style={[styles.headerText, styles.opr]}>OPR {sortColumn === 'overallOPR' && (sortAsc ? '↑' : '↓')}</Text>
        </Pressable>
        <Pressable onPress={() => handleSort('overallRank')} style={[styles.cell]}>
          <Text style={[styles.headerText, styles.opr]}>Rank {sortColumn === 'overallRank' && (sortAsc ? '↑' : '↓')}</Text>
        </Pressable>
        <Pressable onPress={() => handleSort('location')} style={[styles.cell, styles.location]}>
          <Text style={[styles.headerText, styles.opr]}>Location {sortColumn === 'location' && (sortAsc ? '↑' : '↓')}</Text>
        </Pressable>
      </View>

      {/* Table Body */}
      <FlatList
        data={paginated}
        keyExtractor={(item) => item.teamNumber.toString()}
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
    minHeight: 800,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    maxWidth: 500,
  },
  dropdown: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 5,
    paddingHorizontal: 10,
    minHeight: 60,
  },
  headerRow: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderBottomWidth: 0,
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
    fontSize: 12,
    color: '#6b7280',
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
});