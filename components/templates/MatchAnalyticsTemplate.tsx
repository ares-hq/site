import { getAllTeams } from '@/api/dashboardInfo';
import {
  AlliancePerformance,
  getSeasonMatchLeaders,
  getSeasonMatchStats,
  getTeamSeasonPerformances,
  SeasonMatchStats,
} from '@/api/season-matches';
import { DEFAULT_SEASON, routeFromSeason, SUPPORTED_YEARS } from '@/api/utils/seasons';
import { SupportedYear, TeamInfo } from '@/api/utils/types';
import { usePageTitleContext } from '@/app/_layout';
import { MetaRow } from '@/components/shared/MetaRow';
import { webTransition } from '@/components/shared/motion';
import { TableSkeleton } from '@/components/shared/Skeleton';
import {
  Cell,
  CellView,
  HeadCell,
  TableEmpty,
  TableHead,
  TablePager,
  TableRow,
  TableShell,
  tableStyles,
  TeamPill,
} from '@/components/shared/Table';
import { useTheme } from '@/components/shared/theme';
import { YearSelector } from '@/components/shared/YearSelector';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const GAME_NAMES: Record<SupportedYear, string> = {
  2019: 'Skystone',
  2020: 'Ultimate Goal',
  2021: 'Freight Frenzy',
  2022: 'Power Play',
  2023: 'Centerstage',
  2024: 'Into the Deep',
  2025: 'Decode',
  2026: 'BioBuzz',
};

const PER_PAGE = 50;

type SortKey = 'score' | 'date';
type TypeFilter = 'all' | 'QUALIFICATION' | 'PLAYOFF';

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'QUALIFICATION', label: 'Qualification' },
  { value: 'PLAYOFF', label: 'Playoff' },
];

type Props = {
  pageTitle: string;
  filter: TypeFilter;
  blurb?: string;
};

export default function MatchAnalyticsTemplate({ pageTitle, filter, blurb }: Props) {
  const t = useTheme();
  const router = useRouter();
  const { setPageTitleInfo } = usePageTitleContext();

  const [year, setYear] = useState<SupportedYear>(DEFAULT_SEASON);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(filter);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [leaders, setLeaders] = useState<AlliancePerformance[]>([]);
  const [stats, setStats] = useState<SeasonMatchStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [teamRows, setTeamRows] = useState<AlliancePerformance[] | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [allTeams, setAllTeams] = useState<TeamInfo[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const matchType = typeFilter === 'all' ? undefined : typeFilter;

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const sortBy = (k: SortKey) => {
    if (sortKey === k) setSortAsc((v) => !v);
    else {
      setSortKey(k);
      setSortAsc(false); // score: highest first · date: newest first
    }
    setPage(0);
  };

  useEffect(() => {
    setPageTitleInfo({ customSuffix: `(${GAME_NAMES[year]})` });
  }, [year, setPageTitleInfo]);

  // Season aggregates (count + score distribution) for the metadata strip.
  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    getSeasonMatchStats(year, { matchType }).then((s) => {
      if (!cancelled) {
        setStats(s);
        setStatsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [year, matchType]);

  // One server-ordered page of performances — never pulls the whole season.
  useEffect(() => {
    if (searching) return;
    let cancelled = false;
    setPageLoading(true);
    getSeasonMatchLeaders(year, {
      matchType,
      offset: page * PER_PAGE,
      limit: PER_PAGE,
      orderBy: sortKey,
      asc: sortAsc,
    }).then((rows) => {
      if (!cancelled) {
        setLeaders(rows);
        setPageLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [year, matchType, sortKey, sortAsc, page, searching]);

  useEffect(() => {
    let cancelled = false;
    getAllTeams(year).then((list) => {
      if (!cancelled) setAllTeams(list ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [year]);

  // Smart search: any team whose number OR name *contains* the query.
  const matchedTeams = useMemo(() => {
    if (!searching) return [];
    return allTeams
      .filter((tm) => String(tm.teamNumber ?? '').includes(q) || (tm.teamName ?? '').toLowerCase().includes(q))
      .sort((a, b) => (a.overallRank ?? 9999) - (b.overallRank ?? 9999))
      .slice(0, 12);
  }, [searching, allTeams, q]);

  const matchedNums = useMemo(() => new Set(matchedTeams.map((tm) => tm.teamNumber as number)), [matchedTeams]);

  useEffect(() => {
    if (!searching || matchedTeams.length === 0) {
      setTeamRows(searching ? [] : null);
      return;
    }
    let cancelled = false;
    setTeamLoading(true);
    setPage(0);
    Promise.all(matchedTeams.slice(0, 8).map((tm) => getTeamSeasonPerformances(year, tm.teamNumber as number))).then(
      (chunks) => {
        if (cancelled) return;
        const seen = new Set<string>();
        const merged: AlliancePerformance[] = [];
        for (const chunk of chunks) {
          for (const r of chunk) {
            const key = `${r.matchCode}|${r.alliance}|${r.score}`;
            if (seen.has(key)) continue;
            seen.add(key);
            if (!matchType || r.matchType === matchType) merged.push(r);
          }
        }
        merged.sort((a, b) => b.score - a.score);
        setTeamRows(merged);
        setTeamLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [searching, matchedTeams, matchedNums, year, matchType]);

  const openTeam = (n?: number) => {
    if (n) router.push(`/dashboards/${routeFromSeason(year)}?teamnumber=${n}` as any);
  };
  const openEvent = (code?: string, matchCode?: string) => {
    if (!code) return;
    const m = matchCode ? `&match=${encodeURIComponent(matchCode)}` : '';
    router.push(`/analytics/events/${code}?year=${year}${m}` as any);
  };

  // Search results are sorted/paged on the client; the default view is already server-ordered + paged.
  const searchRows = useMemo(() => {
    if (!searching) return [];
    const arr = [...(teamRows ?? [])];
    arr.sort((a, b) => {
      const cmp =
        sortKey === 'date'
          ? new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
          : a.score - b.score;
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [searching, teamRows, sortKey, sortAsc]);

  const busy = searching ? teamLoading : pageLoading;
  const totalCount = searching ? searchRows.length : stats?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const pageRows = searching ? searchRows.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE) : leaders;
  // Only blank the table to a skeleton when there's genuinely nothing to show yet.
  // Paging / sorting / filtering keeps the current rows in place (just dimmed) so the layout never jumps.
  const showSkeleton = busy && pageRows.length === 0;

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
          placeholder="Search teams…"
          placeholderTextColor={t.c.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Feather name="x" size={12} color={t.c.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={{ position: 'relative', zIndex: 50 }}>
        <Pressable
          onPress={() => setTypeMenuOpen((v) => !v)}
          style={[tableStyles.actionBtn, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}
        >
          <Feather name="filter" size={13} color={t.c.textMuted} />
          <Text style={[tableStyles.actionBtnText, { color: t.c.text }]}>
            {TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? 'All types'}
          </Text>
          <Feather name="chevron-down" size={13} color={t.c.textMuted} />
        </Pressable>
        {typeMenuOpen && (
          <View style={[styles.menu, t.shadow.pop, { backgroundColor: t.c.raised, borderColor: t.c.border }]}>
            {TYPE_OPTIONS.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => {
                  setTypeFilter(o.value);
                  setPage(0);
                  setTypeMenuOpen(false);
                }}
                style={styles.menuItem}
              >
                <Text style={{ color: t.c.text, fontSize: 13, fontWeight: typeFilter === o.value ? '600' : '400' }}>
                  {o.label}
                </Text>
                {typeFilter === o.value && <Feather name="check" size={13} color={t.c.accent} />}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: t.c.text }]}>{pageTitle}</Text>
        <Text style={[styles.subtitle, { color: t.c.textMuted }]}>{GAME_NAMES[year]}</Text>
        {!!blurb && <Text style={[styles.summary, { color: t.c.textFaint }]}>{blurb}</Text>}
      </View>

      <MetaRow
        items={[
          { icon: 'grid', label: 'Matches', value: statsLoading ? 'Loading…' : stats?.total ?? null },
          { icon: 'bar-chart-2', label: 'Avg Alliance Score', value: statsLoading ? 'Loading…' : stats?.average ?? null, decimals: 1 },
          { icon: 'minus', label: 'Median', value: statsLoading ? 'Loading…' : stats?.median ?? null },
          { icon: 'trending-up', label: 'Top 10% Score', value: statsLoading ? 'Loading…' : stats?.p90 ?? null },
          { icon: 'award', label: 'Record High', value: statsLoading ? 'Loading…' : stats?.max ?? null },
        ]}
      />

      <YearSelector selectedYear={year} availableYears={SUPPORTED_YEARS} onYearChange={setYear} />

      {searching && matchedTeams.length > 0 && (
        <Text style={[styles.searchNote, { color: t.c.textMuted }]}>
          {matchedTeams.length === 1
            ? `Every match for ${matchedTeams[0].teamNumber} · ${matchedTeams[0].teamName}`
            : `${matchedTeams.length} teams contain “${query.trim()}” — showing their matches`}
        </Text>
      )}

      <TableShell
        controls={controls}
        footer={
          totalCount > 0 ? (
            <TablePager
              page={page}
              totalPages={totalPages}
              onPage={setPage}
              label={`${totalCount.toLocaleString()} ${searching ? 'matches' : 'performances'}`}
            />
          ) : null
        }
      >
        <TableHead>
          <HeadCell label={searching ? 'W/L' : '#'} flex={0.5} />
          <HeadCell
            label="Score"
            flex={0.8}
            sortable
            active={sortKey === 'score'}
            dir={sortAsc ? 'asc' : 'desc'}
            onPress={() => sortBy('score')}
          />
          <HeadCell label="Alliance" flex={2.6} />
          <HeadCell label="Type" flex={1} align="right" />
          <HeadCell
            label="Date"
            flex={1.15}
            align="right"
            sortable
            active={sortKey === 'date'}
            dir={sortAsc ? 'asc' : 'desc'}
            onPress={() => sortBy('date')}
          />
        </TableHead>

        {showSkeleton ? (
          <TableSkeleton rows={10} />
        ) : pageRows.length === 0 ? (
          <TableEmpty
            icon={searching ? 'user-x' : 'inbox'}
            text={
              searching
                ? matchedTeams.length === 0
                  ? `No teams contain “${query.trim()}” in ${GAME_NAMES[year]}`
                  : `No matches found for those teams`
                : `No match data for ${GAME_NAMES[year]}`
            }
          />
        ) : (
          <View style={busy ? { opacity: 0.4 } : undefined} pointerEvents={busy ? 'none' : 'auto'}>
          {pageRows.map((p, i) => {
            const rank = page * PER_PAGE + i;
            const t1 = p.team1;
            const t2 = p.team2;
            return (
              <TableRow
                key={`${p.matchCode}-${p.alliance}-${rank}`}
                first={i === 0}
                last={i === pageRows.length - 1}
                onPress={p.eventCode ? () => openEvent(p.eventCode, p.matchCode) : undefined}
              >
                <Cell flex={0.5} numeric tone="faint">{searching ? (p.win ? 'W' : 'L') : rank + 1}</Cell>
                <Cell flex={0.8} numeric style={{ fontWeight: '700', fontSize: 14 }}>{p.score}</Cell>
                <CellView flex={2.6}>
                  {t1 || t2 ? (
                    <>
                      {t1 && (
                        <TeamPill
                          teamNumber={t1.teamNumber}
                          side={p.alliance}
                          highlight={searching && matchedNums.has(t1.teamNumber)}
                          onPress={() => openTeam(t1.teamNumber)}
                        />
                      )}
                      {t2 && (
                        <TeamPill
                          teamNumber={t2.teamNumber}
                          side={p.alliance}
                          highlight={searching && matchedNums.has(t2.teamNumber)}
                          onPress={() => openTeam(t2.teamNumber)}
                        />
                      )}
                    </>
                  ) : (
                    <Text style={{ color: t.c.textFaint, fontSize: 12 }}>—</Text>
                  )}
                </CellView>
                <CellView flex={1} align="right">
                  <View style={[styles.badge, { borderColor: t.c.border }]}>
                    <Text style={[styles.badgeText, { color: t.c.textFaint }]}>
                      {p.matchType === 'QUALIFICATION' ? 'Qual' : p.matchType === 'PLAYOFF' ? 'Play' : 'Prac'}
                    </Text>
                  </View>
                </CellView>
                <Cell flex={1.15} align="right" tone="faint" style={{ fontSize: 11.5 }}>
                  {p.date ? new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                </Cell>
              </TableRow>
            );
          })}
          </View>
        )}
      </TableShell>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 17 },
  summary: { fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 620 },
  searchNote: { fontSize: 12, fontWeight: '500', marginBottom: 10 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  menu: {
    position: 'absolute',
    top: 42,
    right: 0,
    minWidth: 170,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 100,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0px 16px 40px rgba(15,23,42,0.16)' } as any) : {}),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
