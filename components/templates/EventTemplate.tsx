import { usePageTitleContext } from '@/app/_layout';
import { Feather } from '@expo/vector-icons';
import { ErrorState } from '@/components/shared/ErrorState';
import { TableSkeleton } from '@/components/shared/Skeleton';
import { MetaRow } from '@/components/shared/MetaRow';
import { webTransition } from '@/components/shared/motion';
import { Cell, CellView, HeadCell, TableEmpty, TableHead, TablePager, TableRow, TableShell, tableStyles } from '@/components/shared/Table';
import { useTheme } from '@/components/shared/theme';
import { YearSelector } from '@/components/shared/YearSelector';
import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import Down from '../../assets/icons/caret-down.svg';
import Check from '../../assets/icons/check-circle.svg';
import { BasicEventInfo, SupportedYear } from '@/api/utils/types';
import { getEventsBasic } from '@/api/basic-event-service';

const ITEMS_PER_PAGE = 24;
const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEARCH_DEBOUNCE_MS = 300;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const GAME_NAMES: Record<SupportedYear, string> = {
    2019: 'Skystone', 2020: 'Ultimate Goal', 2021: 'Freight Frenzy',
    2022: 'Power Play', 2023: 'Centerstage', 2024: 'Into the Deep', 2025: 'Decode',
};

// Global cache for API responses
const eventsCache = new Map<SupportedYear, { data: BasicEventInfo[], timestamp: number }>();

// Cache cleanup function
const cleanupCache = () => {
    const now = Date.now();
    const keysToDelete: SupportedYear[] = [];
    eventsCache.forEach((value, key) => {
        if (now - value.timestamp > CACHE_DURATION_MS) {
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => eventsCache.delete(key));
};

// Run cleanup periodically
setInterval(cleanupCache, 60000); // Clean every minute

// Debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    
    return debouncedValue;
};

const STATUS_COLOR = { upcoming: '#3B82F6', ongoing: '#F59E0B', completed: '#059669' } as const;
const STATUS_ORDER: Record<string, number> = { ongoing: 0, upcoming: 1, completed: 2 };

/** Compact date for the events table — "Nov 8" rather than a long locale string. */
function shortDate(ev: { date?: string; rawDate?: string }): string {
  const raw = ev.rawDate || ev.date || '';
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  // fall back to the first date-ish token of whatever string we got
  const m = (ev.date || '').match(/[A-Za-z]{3,}\.?\s?\d{1,2}/);
  return m ? m[0].replace('.', '') : (ev.date || '').slice(0, 6);
}

const EventTemplate: React.FC<{ pageTitle: string; summary?: string }> = ({ pageTitle, summary }) => {
    const { width } = useWindowDimensions();
    const { isDarkMode } = useDarkMode();
    const t = useTheme();
    const { setPageTitleInfo } = usePageTitleContext();
    const router = useRouter();

    // State
    const [selectedYear, setSelectedYear] = useState<SupportedYear>(2025);
    const [events, setEvents] = useState<BasicEventInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [page, setPage] = useState(0);
    const [eventSort, setEventSort] = useState<'name' | 'status' | 'date'>('date');
    const [eventSortAsc, setEventSortAsc] = useState(false);

    // Dropdown Visibility
    const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
    const [monthDropdownVisible, setMonthDropdownVisible] = useState(false);
    
    // Filters
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [statusFilters, setStatusFilters] = useState<string[]>(['upcoming', 'ongoing', 'completed']);

    // Debounced search query
    const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

    const availableYears: SupportedYear[] = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

    const fetchEvents = useCallback(async (year: SupportedYear, isRefresh = false) => {
        try {
            // Check cache first (unless refreshing)
            if (!isRefresh) {
                const cached = eventsCache.get(year);
                if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
                    setEvents(cached.data);
                    setLastUpdated(new Date(cached.timestamp));
                    setLoading(false);
                    return;
                }
            }
            
            if (!isRefresh) setLoading(true);
            else setRefreshing(true);
            
            const data = await getEventsBasic(year, true);
            if (data) {
                setEvents(data);
                setLastUpdated(new Date());
                
                // Cache the result
                eventsCache.set(year, { data, timestamp: Date.now() });
            } else {
                setError('Failed to fetch events data');
            }
        } catch (err) {
            setError('Failed to fetch events data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { 
      fetchEvents(selectedYear); 
    }, [selectedYear]);

    useEffect(() => {
        setPageTitleInfo({ customSuffix: `(${GAME_NAMES[selectedYear] || selectedYear})` });
    }, [selectedYear]);

    // Reset page when debounced search changes
    useEffect(() => {
        setPage(0);
    }, [debouncedSearchQuery]);

    const getEventStatus = useCallback((event: BasicEventInfo) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (!event.date || event.date === 'TBD') return 'upcoming';
        const eventDate = new Date(event.date);
        const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'completed';
        if (diffDays === 0) return 'ongoing';
        return 'upcoming';
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            // Filter by event type based on page
            let matchesType = true;
            if (pageTitle === 'Premier') {
                // Premier events have codes starting with 'FPE'
                matchesType = event.eventCode?.startsWith('FPE') || event.name?.toLowerCase().includes('premier') || event.type?.toLowerCase() === 'premier';
            } else if (pageTitle === 'Championships') {
                // Championship events have codes starting with 'FRC' or contain 'championship'
                matchesType = event.eventCode?.startsWith('FRC') || event.name?.toLowerCase().includes('championship') || event.type?.toLowerCase() === 'championship';
            }
            // For "All Events", show all types

            const query = debouncedSearchQuery.toLowerCase();
            const matchesSearch = !debouncedSearchQuery ||
                event.name.toLowerCase().includes(query) ||
                event.eventCode.toLowerCase().includes(query) ||
                event.location.toLowerCase().includes(query) ||
                (event.date && event.date.toLowerCase().includes(query));

            const matchesStatus = statusFilters.includes(getEventStatus(event));
            const matchesMonth = selectedMonth === 'All' || (event.date && event.date.includes(selectedMonth));

            return matchesType && matchesSearch && matchesStatus && matchesMonth;
        });
    }, [events, debouncedSearchQuery, statusFilters, selectedMonth, pageTitle]);


    const sortedEvents = useMemo(() => {
        const arr = [...filteredEvents];
        arr.sort((a, b) => {
            let cmp = 0;
            if (eventSort === 'name') cmp = (a.name || '').localeCompare(b.name || '');
            else if (eventSort === 'status') cmp = STATUS_ORDER[getEventStatus(a)] - STATUS_ORDER[getEventStatus(b)];
            else cmp = new Date(a.rawDate || a.date || 0).getTime() - new Date(b.rawDate || b.date || 0).getTime();
            return eventSortAsc ? cmp : -cmp;
        });
        return arr;
    }, [filteredEvents, eventSort, eventSortAsc, getEventStatus]);

    const paginatedEvents = useMemo(() => {
        return sortedEvents.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    }, [sortedEvents, page]);

    const sortEventsBy = (k: 'name' | 'status' | 'date') => {
        if (eventSort === k) setEventSortAsc((v) => !v);
        else { setEventSort(k); setEventSortAsc(k === 'name' || k === 'status'); }
        setPage(0);
    };


    if (error) {
        return <View style={styles.container}><ErrorState error={error} onRetry={() => fetchEvents(selectedYear)} /></View>;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(selectedYear, true)} tintColor={isDarkMode ? '#F9FAFB' : '#111827'} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{pageTitle}</Text>
                    <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>{GAME_NAMES[selectedYear]}</Text>
                    {!!summary && (
                        <Text style={{ fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 620, color: '#8A94A3' }}>{summary}</Text>
                    )}
                    <MetaRow
                        items={[
                            { icon: 'calendar', label: 'Events Loaded', value: loading ? 'Loading…' : filteredEvents.length },
                            { icon: 'radio', label: 'Ongoing', value: loading ? 'Loading…' : filteredEvents.filter((e) => getEventStatus(e) === 'ongoing').length },
                            { icon: 'arrow-right-circle', label: 'Upcoming', value: loading ? 'Loading…' : filteredEvents.filter((e) => getEventStatus(e) === 'upcoming').length },
                            { icon: 'check-circle', label: 'Completed', value: loading ? 'Loading…' : filteredEvents.filter((e) => getEventStatus(e) === 'completed').length },
                            { icon: 'clock', label: 'Last Updated', value: lastUpdated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Loading…' },
                        ]}
                    />
                </View>

                <YearSelector selectedYear={selectedYear} availableYears={availableYears} onYearChange={(y) => {setSelectedYear(y); setPage(0);}} />

                {(
                    <TableShell
                        controls={
                            <>
                                <View
                                    style={[
                                        tableStyles.filterInput,
                                        webTransition('border-color'),
                                        { backgroundColor: t.c.field, borderColor: searchFocused ? t.c.accent : t.c.border },
                                    ]}
                                >
                                    <Feather name="search" size={13} color={searchFocused ? t.c.accent : t.c.textMuted} />
                                    <TextInput
                                        style={[tableStyles.filterInputText, { color: t.c.text }]}
                                        placeholder="Search name, code, location…"
                                        placeholderTextColor={t.c.textMuted}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        onFocus={() => setSearchFocused(true)}
                                        onBlur={() => setSearchFocused(false)}
                                    />
                                    {searchQuery.length > 0 && (
                                        <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                                            <Feather name="x" size={12} color={t.c.textMuted} />
                                        </Pressable>
                                    )}
                                </View>
                                <View style={{ position: 'relative', zIndex: 50 }}>
                                    <TouchableOpacity onPress={() => setMonthDropdownVisible(!monthDropdownVisible)}
                                        style={[tableStyles.actionBtn, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
                                        <Text style={[tableStyles.actionBtnText, { color: t.c.text }]}>{selectedMonth === 'All' ? 'Month' : selectedMonth}</Text>
                                        <Down height={12} width={12} fill={t.c.textMuted} />
                                    </TouchableOpacity>
                                    {monthDropdownVisible && (
                                        <View style={[styles.menu, t.shadow.pop, { backgroundColor: t.c.raised, borderColor: t.c.border, right: 0, width: 150 }]}>
                                            <ScrollView style={{ maxHeight: 260 }}>
                                                {MONTHS.map(m => (
                                                    <TouchableOpacity key={m} style={styles.menuItem} onPress={() => { setSelectedMonth(m); setMonthDropdownVisible(false); setPage(0); }}>
                                                        <Text style={{ fontWeight: selectedMonth === m ? '600' : '400', color: t.c.text, fontSize: 13 }}>{m}</Text>
                                                        {selectedMonth === m && <Check height={13} width={13} fill={t.c.accent} />}
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                                <View style={{ position: 'relative', zIndex: 50 }}>
                                    <TouchableOpacity onPress={() => setStatusDropdownVisible(!statusDropdownVisible)}
                                        style={[tableStyles.actionBtn, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
                                        <Text style={[tableStyles.actionBtnText, { color: t.c.text }]}>Status</Text>
                                        <Down height={12} width={12} fill={t.c.textMuted} />
                                    </TouchableOpacity>
                                    {statusDropdownVisible && (
                                        <View style={[styles.menu, t.shadow.pop, { backgroundColor: t.c.raised, borderColor: t.c.border, right: 0, width: 160 }]}>
                                            {['upcoming', 'ongoing', 'completed'].map(s => (
                                                <TouchableOpacity key={s} style={styles.menuItem} onPress={() => {
                                                    const next = statusFilters.includes(s) ? statusFilters.filter(v => v !== s) : [...statusFilters, s];
                                                    if (next.length > 0) { setStatusFilters(next); setPage(0); }
                                                }}>
                                                    <Text style={{ fontWeight: statusFilters.includes(s) ? '600' : '400', color: t.c.text, fontSize: 13, textTransform: 'capitalize' }}>{s}</Text>
                                                    {statusFilters.includes(s) && <Check height={13} width={13} fill={t.c.accent} />}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </>
                        }
                        footer={
                            <TablePager
                                page={page}
                                totalPages={Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE))}
                                onPage={setPage}
                                label={`${filteredEvents.length} event${filteredEvents.length === 1 ? '' : 's'}`}
                            />
                        }
                    >
                        <TableHead>
                            <HeadCell label="Event" flex={2.6} sortable active={eventSort === 'name'} dir={eventSortAsc ? 'asc' : 'desc'} onPress={() => sortEventsBy('name')} />
                            <HeadCell label="Status" flex={1} sortable active={eventSort === 'status'} dir={eventSortAsc ? 'asc' : 'desc'} onPress={() => sortEventsBy('status')} />
                            <HeadCell label="Location" flex={1.6} align="right" />
                            <HeadCell label="Date" flex={0.9} align="right" sortable active={eventSort === 'date'} dir={eventSortAsc ? 'asc' : 'desc'} onPress={() => sortEventsBy('date')} />
                        </TableHead>

                        {loading && paginatedEvents.length === 0 ? (
                            <TableSkeleton rows={8} />
                        ) : paginatedEvents.length === 0 ? (
                            <TableEmpty icon="calendar" text="No events match your filters" />
                        ) : (
                            <View style={loading ? { opacity: 0.4 } : undefined} pointerEvents={loading ? 'none' : 'auto'}>
                            {paginatedEvents.map((event, idx) => {
                                const status = getEventStatus(event);
                                return (
                                    <TableRow
                                        key={event.eventCode || idx}
                                        first={idx === 0}
                                        last={idx === paginatedEvents.length - 1}
                                        onPress={() => router.push(`/analytics/events/${event.eventCode}?year=${selectedYear}` as any)}
                                    >
                                        <CellView flex={2.6} style={{ minWidth: 0 }}>
                                            <View style={{ flex: 1, minWidth: 0 }}>
                                                <Text style={[styles.evName, { color: t.c.text }]} numberOfLines={1}>{event.name}</Text>
                                                <Text style={[styles.evCode, { color: t.c.textFaint }]} numberOfLines={1}>{event.eventCode}</Text>
                                            </View>
                                        </CellView>
                                        <CellView flex={1}>
                                            <View style={[styles.evStatus, { borderColor: STATUS_COLOR[status] }]}>
                                                <View style={[styles.evDot, { backgroundColor: STATUS_COLOR[status] }]} />
                                                <Text style={{ color: STATUS_COLOR[status], fontSize: 10.5, fontWeight: '700', textTransform: 'capitalize' }}>{status}</Text>
                                            </View>
                                        </CellView>
                                        <Cell flex={1.6} align="right" tone="muted">{event.location}</Cell>
                                        <Cell flex={0.9} align="right" tone="faint" style={{ fontSize: 11.5 }}>{shortDate(event)}</Cell>
                                    </TableRow>
                                );
                            })}
                            </View>
                        )}
                    </TableShell>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 24},
    header: { marginBottom: 10 },
    title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
    subtitle: { fontSize: 17 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
    loadingText: { fontSize: 16, marginTop: 16 },
    metadataContent: { padding: 10 },
    metadataContentDesktop: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32 },
    metadataContentMobile: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    metadataContentRight: { alignSelf: 'flex-end', marginTop: 8 },
    metadataItem: { flexDirection: 'row', alignItems: 'center' },
    metadataItemDesktop: { minWidth: 140 },
    iconContainer: { marginRight: 12 },
    metadataLabel: { fontSize: 14, marginBottom: 2 },
    metadataValue: { fontSize: 14, fontWeight: '700' },
    eventsContainer: { borderRadius: 16, padding: 16 },
    filterRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center', gap: 12 },
    filterRowMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 8 },
    input: { flex: 1, borderWidth: 1, padding: 10, borderRadius: 8 },
    inputMobile: { flex: 1, width: '100%' },
    filterButtons: { flexDirection: 'row', gap: 8 },
    filterButtonsMobile: { flexDirection: 'row', justifyContent: 'space-between' },
    dropdown: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, gap: 4, justifyContent: 'center', minWidth: 70 },
    dropdownText: { fontSize: 14 },
    dropdownMenu: { position: 'absolute', top: 55, zIndex: 100, borderRadius: 8, borderWidth: 1, paddingVertical: 4, elevation: 5, shadowOpacity: 0.1 },
    dropdownMenuMobile: { top: 100 },
    dropdownBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
    dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
    eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
    cardWrapper: {
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: 280,
        padding: 6,
    },
    eventCard: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        height: 150,
        justifyContent: 'space-between',
    },
    eventCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    eventHeader: { flex: 1, marginRight: 8 },
    eventName: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
    eventCode: { fontSize: 11, fontWeight: '600' },
    eventDetails: { gap: 5 },
    statusBanner: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
    statusText: { fontSize: 9, fontWeight: '700' },
    eventDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    eventDetailText: { fontSize: 12 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' },
    selectionText: { fontSize: 10 },
    pagination: { flexDirection: 'row', gap: 8 },
    pageBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    menu: { position: 'absolute', top: 42, borderWidth: 1, borderRadius: 12, zIndex: 30, paddingVertical: 4, minWidth: 150 },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 9 },
    evName: { fontSize: 13.5, fontWeight: '600', textAlign: 'left', writingDirection: 'ltr' },
    evCode: { fontSize: 10.5, fontWeight: '600', marginTop: 1, letterSpacing: 0.3, textAlign: 'left', writingDirection: 'ltr' },
    evStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
    evDot: { width: 5, height: 5, borderRadius: 3 },
});

export default EventTemplate;