import { filterTeams } from '@/api/algorithms/filter';
import { DEFAULT_SEASON, routeFromSeason } from '@/api/utils/seasons';
import { SupportedYear, TeamInfo } from '@/api/utils/types';
import { webTransition } from '@/components/shared/motion';
import {
  Cell,
  HeadCell,
  TableEmpty,
  TableHead,
  TablePager,
  TableRow,
  TableShell,
  tableStyles,
} from '@/components/shared/Table';
import { TableSkeleton } from '@/components/shared/Skeleton';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

const ITEMS_PER_PAGE = 20;

type DataTableProps = {
  teams: TeamInfo[];
  data: 'overall' | 'auto' | 'teleop' | 'endgame';
  selectedYear?: SupportedYear;
  loading?: boolean;
};

const ALL_COLUMNS = [
  { label: 'Team #', value: 'teamNumber' },
  { label: 'Team Name', value: 'teamName' },
  { label: 'OPR', value: 'opr' },
  { label: 'Rank', value: 'rank' },
  { label: 'Location', value: 'location' },
];

export default function DataTable({ teams, data, selectedYear = DEFAULT_SEASON, loading = false }: DataTableProps) {
  const t = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 700;

  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<any>('overallRank');
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [focused, setFocused] = useState(false);

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
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [query, sortAsc, sortColumn, data, teams]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const handleSort = (column: keyof TeamInfo | 'overallOPR' | 'overallRank') => {
    if (isSmallScreen && (column === 'teamName' || column === 'teamNumber')) return;
    if (sortColumn === column) setSortAsc(!sortAsc);
    else {
      setSortColumn(column);
      setSortAsc(true);
    }
  };

  const openTeam = (teamNumber?: number) => {
    if (teamNumber) {
      router.push(`/dashboards/${routeFromSeason(selectedYear)}?teamnumber=${teamNumber}` as any);
    }
  };

  const statValue = (item: TeamInfo, kind: 'opr' | 'rank') => {
    const map = {
      opr: { overall: item.overallOPR, auto: item.autoOPR, teleop: item.teleOPR, endgame: item.endgameOPR },
      rank: { overall: item.overallRank, auto: item.autoRank, teleop: item.teleRank, endgame: item.endgameRank },
    } as const;
    const v = (map[kind] as any)[data];
    if (v == null) return '—';
    return kind === 'opr' ? Number(v).toFixed(2) : v;
  };

  const colDir: 'asc' | 'desc' = sortAsc ? 'asc' : 'desc';

  const controls = (
    <>
      <View
        style={[
          tableStyles.filterInput,
          webTransition('border-color'),
          { backgroundColor: t.c.field, borderColor: focused ? t.c.accent : t.c.border },
        ]}
      >
        <Feather name="search" size={13} color={focused ? t.c.accent : t.c.textMuted} />
        <TextInput
          style={[tableStyles.filterInputText, { color: t.c.text }]}
          placeholder="Filter teams…"
          placeholderTextColor={t.c.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => {
            if (filtered.length > 0) {
              openTeam(filtered[0].teamNumber);
              setQuery('');
            }
          }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x" size={12} color={t.c.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={{ position: 'relative', zIndex: 50 }}>
        <Pressable
          onPress={() => setColumnMenuOpen((v) => !v)}
          style={[tableStyles.actionBtn, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}
        >
          <Feather name="sliders" size={13} color={t.c.textMuted} />
          <Text style={[tableStyles.actionBtnText, { color: t.c.text }]}>Columns</Text>
        </Pressable>

        {columnMenuOpen && (
          <View style={[styles.menu, t.shadow.pop, { backgroundColor: t.c.raised, borderColor: t.c.border }]}>
            {ALL_COLUMNS.filter((col) => !(isSmallScreen && col.value === 'location')).map(({ label, value }) => {
              const isVisible = visibleColumns.includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    const next = isVisible
                      ? visibleColumns.filter((v) => v !== value)
                      : [...visibleColumns, value];
                    const hasNameOrNumber = next.includes('teamName') || next.includes('teamNumber');
                    const hasStat = ['opr', 'rank', 'location'].some((c) => next.includes(c));
                    if (hasNameOrNumber && hasStat) setVisibleColumns(next);
                  }}
                  style={[styles.menuItem, webTransition('background-color')]}
                >
                  <Text style={[styles.menuItemText, { color: t.c.text, fontWeight: isVisible ? '600' : '400' }]}>
                    {label}
                  </Text>
                  <Feather name={isVisible ? 'check' : 'minus'} size={13} color={isVisible ? t.c.accent : t.c.textFaint} />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </>
  );

  return (
    <TableShell
      controls={controls}
      footer={
        <TablePager
          page={page}
          totalPages={totalPages}
          onPage={setPage}
          label={`${filtered.length.toLocaleString()} ${filtered.length === 1 ? 'team' : 'teams'}`}
        />
      }
    >
      <TableHead>
        {visibleColumns.includes('teamNumber') && (
          <HeadCell label="Team #" flex={1} sortable active={sortColumn === 'teamNumber'} dir={colDir} onPress={() => handleSort('teamNumber')} />
        )}
        {visibleColumns.includes('teamName') && (
          <HeadCell label="Team Name" flex={2} sortable active={sortColumn === 'teamName'} dir={colDir} onPress={() => handleSort('teamName')} />
        )}
        {visibleColumns.includes('opr') && (
          <HeadCell label="OPR" flex={1} align="right" sortable active={sortColumn === 'overallOPR'} dir={colDir} onPress={() => handleSort('overallOPR')} />
        )}
        {visibleColumns.includes('rank') && (
          <HeadCell label="Rank" flex={1} align="right" sortable active={sortColumn === 'overallRank'} dir={colDir} onPress={() => handleSort('overallRank')} />
        )}
        {visibleColumns.includes('location') && (
          <HeadCell label="Location" flex={1.5} align="right" sortable active={sortColumn === 'location'} dir={colDir} onPress={() => handleSort('location')} />
        )}
      </TableHead>

      {loading && paginated.length === 0 ? (
        <TableSkeleton rows={9} />
      ) : paginated.length === 0 ? (
        <TableEmpty text={query ? `No teams match “${query}”` : 'No teams to show'} />
      ) : (
        <View style={loading ? { opacity: 0.4 } : undefined} pointerEvents={loading ? 'none' : 'auto'}>
        {paginated.map((item, index) => (
          <TableRow
            key={item.teamNumber?.toString() ?? `row-${index}`}
            first={index === 0}
            last={index === paginated.length - 1}
            onPress={() => openTeam(item.teamNumber)}
          >
            {visibleColumns.includes('teamNumber') && <Cell flex={1} numeric tone="accent">{item.teamNumber}</Cell>}
            {visibleColumns.includes('teamName') && <Cell flex={2} style={{ fontWeight: '500' }}>{item.teamName}</Cell>}
            {visibleColumns.includes('opr') && <Cell flex={1} align="right" numeric>{statValue(item, 'opr')}</Cell>}
            {visibleColumns.includes('rank') && <Cell flex={1} align="right" numeric>{statValue(item, 'rank')}</Cell>}
            {visibleColumns.includes('location') && (
              <Cell flex={1.5} align="right" tone="muted">
                {item.location?.split(',').slice(-2).join(', ').trim()}
              </Cell>
            )}
          </TableRow>
        ))}
        </View>
      )}
    </TableShell>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 42,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    zIndex: 100,
    paddingVertical: 4,
    minWidth: 170,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  menuItemText: { fontSize: 13 },
});
