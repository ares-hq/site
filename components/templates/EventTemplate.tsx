import { getUpcomingEvents, SupportedYear } from '@/api/firstAPI';
import { EventInfo } from '@/api/types';
import { usePageTitleContext } from '@/app/_layout';
import { ErrorState } from '@/components/shared/ErrorState';
import { YearSelector } from '@/components/shared/YearSelector';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
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
import Calendar from '../../assets/icons/calendar.svg';
import Down from '../../assets/icons/caret-down.svg';
import Check from '../../assets/icons/check-circle.svg';
import Clock from '../../assets/icons/clock.svg';
import MapPin from '../../assets/icons/map-pin.svg';

const ITEMS_PER_PAGE = 24;
const MONTHS = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEARCH_DEBOUNCE_MS = 300;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const GAME_NAMES: Record<SupportedYear, string> = {
    2019: 'Skystone', 2020: 'Ultimate Goal', 2021: 'Freight Frenzy',
    2022: 'Power Play', 2023: 'Centerstage', 2024: 'Into the Deep', 2025: 'Decode',
};

// Global cache for API responses
const eventsCache = new Map<SupportedYear, { data: EventInfo[], timestamp: number }>();

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

const EventTemplate: React.FC<{ pageTitle: string }> = ({ pageTitle }) => {
    const { width } = useWindowDimensions();
    const { isDarkMode } = useDarkMode();
    const { setPageTitleInfo } = usePageTitleContext();

    // Memoized Event Card Component
    const EventCard = React.memo(({ 
        event, 
        getEventStatus, 
        isDarkMode 
    }: { 
        event: EventInfo; 
        getEventStatus: (event: EventInfo) => 'upcoming' | 'ongoing' | 'completed'; 
        isDarkMode: boolean; 
    }) => {
        const status = getEventStatus(event);
        const cardBg = isDarkMode ? '#262626' : '#FFFFFF';
        const borderColor = isDarkMode ? '#374151' : '#E5E7EB';
        const textPrimary = isDarkMode ? '#F9FAFB' : '#111827';
        const textSecondary = isDarkMode ? '#9CA3AF' : '#6B7280';

        const statusColors: Record<'upcoming' | 'ongoing' | 'completed', { bg: string; text: string }> = {
            upcoming: { bg: isDarkMode ? '#1E3A8A' : '#DBEAFE', text: isDarkMode ? '#93C5FD' : '#1E40AF' },
            ongoing: { bg: isDarkMode ? '#065F46' : '#D1FAE5', text: isDarkMode ? '#34D399' : '#065F46' },
            completed: { bg: isDarkMode ? '#4B5563' : '#E5E7EB', text: isDarkMode ? '#9CA3AF' : '#6B7280' },
        };

        return (
            <View style={styles.cardWrapper}>
                <TouchableOpacity activeOpacity={0.7} style={[styles.eventCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                    <View style={styles.eventCardTop}>
                        <View style={styles.eventHeader}>
                            <Text style={[styles.eventName, { color: textPrimary }]} numberOfLines={2}>{event.name}</Text>
                            <Text style={[styles.eventCode, { color: textSecondary }]}>{event.eventCode}</Text>
                        </View>
                        {event.teamCount > 0 && (
                            <View style={styles.teamCountBadge}>
                                <Text style={[styles.teamCountLabel, { color: textSecondary }]}>Teams</Text>
                                <Text style={[styles.teamCountValue, { color: textPrimary }]}>{event.teamCount}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.eventDetails}>
                        <View style={[styles.statusBanner, { backgroundColor: statusColors[status].bg }]}>
                            <Text style={[styles.statusText, { color: statusColors[status].text }]}>{status.toUpperCase()}</Text>
                        </View>
                        <View style={styles.eventDetailRow}>
                            <Calendar width={16} height={16} fill={textSecondary} />
                            <Text style={[styles.eventDetailText, { color: textSecondary }]}>{event.date}</Text>
                        </View>
                        <View style={styles.eventDetailRow}>
                            <MapPin width={16} height={16} fill={textSecondary} />
                            <Text style={[styles.eventDetailText, { color: textSecondary }]} numberOfLines={1}>{event.location}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    });

    // State
    const [selectedYear, setSelectedYear] = useState<SupportedYear>(pageTitle === 'Premier' ? 2025 : 2025);
    const [events, setEvents] = useState<EventInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [page, setPage] = useState(0);

    // Dropdown Visibility
    const [statusDropdownVisible, setStatusDropdownVisible] = useState(false);
    const [monthDropdownVisible, setMonthDropdownVisible] = useState(false);
    
    // Filters
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [statusFilters, setStatusFilters] = useState<string[]>(['upcoming', 'ongoing', 'completed']);

    // Debounced search query
    const debouncedSearchQuery = useDebounce(searchQuery, SEARCH_DEBOUNCE_MS);

    // Available years based on page type
    const availableYears: SupportedYear[] = pageTitle === 'Premier' 
        ? [2024, 2025] 
        : [2019, 2020, 2021, 2022, 2023, 2024, 2025];

    // Ensure selected year is valid for current page
    useEffect(() => {
        if (pageTitle === 'Premier' && !availableYears.includes(selectedYear)) {
            setSelectedYear(2025);
        }
    }, [pageTitle, selectedYear, availableYears]);

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
            
            const data = await getUpcomingEvents(year);
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

    const getEventStatus = useCallback((event: EventInfo) => {
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
                console.log('Premier page - checking event:', event.name, event.eventCode, event.type);
            } else if (pageTitle === 'Championships') {
                // Championship events have codes starting with 'FRC' or contain 'championship'
                matchesType = event.eventCode?.startsWith('FRC') || event.name?.toLowerCase().includes('championship') || event.type?.toLowerCase() === 'championship';
                console.log('Championship page - checking event:', event.name, event.eventCode, event.type);
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

    // Debug: Log events and filtered events
    useEffect(() => {
      console.log('All events:', events);
      console.log('Filtered events:', filteredEvents);
      console.log('Page title:', pageTitle);
    }, [events, filteredEvents, pageTitle]);

    const paginatedEvents = useMemo(() => {
        return filteredEvents.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
    }, [filteredEvents, page]);

    const isSmallDevice = width < 768;

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
                    <View style={[styles.metadataContent, isSmallDevice ? styles.metadataContentMobile : styles.metadataContentDesktop, styles.metadataContentRight]}>
                        <View style={[styles.metadataItem, !isSmallDevice && styles.metadataItemDesktop]}>
                            <View style={styles.iconContainer}><Calendar width={20} height={20} fill={isDarkMode ? '#9CA3AF' : '#6B7280'}/></View>
                            <View>
                                <Text style={[styles.metadataLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Events Loaded</Text>
                                <Text style={[styles.metadataValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{loading ? 'Loading...' : filteredEvents.length.toLocaleString()}</Text>
                            </View>
                        </View>
                        <View style={[styles.metadataItem, !isSmallDevice && styles.metadataItemDesktop]}>
                            <View style={styles.iconContainer}><Clock width={20} height={20} fill={isDarkMode ? '#9CA3AF' : '#6B7280'}/></View>
                            <View>
                                <Text style={[styles.metadataLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Last Updated</Text>
                                <Text style={[styles.metadataValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{lastUpdated?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || 'Loading...'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <YearSelector selectedYear={selectedYear} availableYears={availableYears} onYearChange={(y) => {setSelectedYear(y); setPage(0);}} />

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={isDarkMode ? '#F9FAFB' : '#111827'} />
                        <Text style={[styles.loadingText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Loading events data...</Text>
                    </View>
                ) : (
                    <View style={[styles.eventsContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB' }]}>
                        <View style={[styles.filterRow, isSmallDevice && styles.filterRowMobile]}>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isDarkMode ? '#4B5563' : '#e5e7eb', color: isDarkMode ? '#fff' : '#000', outline: 'none' }, isSmallDevice && styles.inputMobile]}
                                placeholder="Search by name, code, location, or date..."
                                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            
                            <View style={[styles.filterButtons, isSmallDevice && styles.filterButtonsMobile]}>
                                <TouchableOpacity onPress={() => setMonthDropdownVisible(!monthDropdownVisible)} 
                                    style={[styles.dropdown, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
                                    <Text style={[styles.dropdownText, { color: isDarkMode ? '#fff' : '#000' }]}>{selectedMonth === 'All' ? 'Month' : selectedMonth}</Text>
                                    <Down height={14} width={14} fill={isDarkMode ? '#fff' : '#000'}/>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setStatusDropdownVisible(!statusDropdownVisible)} 
                                    style={[styles.dropdown, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6' }]}>
                                    <Text style={[styles.dropdownText, { color: isDarkMode ? '#fff' : '#000' }]}>Filter</Text>
                                    <Down height={14} width={14} fill={isDarkMode ? '#fff' : '#000'}/>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Month Selection Menu */}
                        {monthDropdownVisible && (
                            <View style={[styles.dropdownMenu, { backgroundColor: isDarkMode ? 'rgba(61, 61, 61, 1)' : '#fff', borderColor: isDarkMode ? '#4B5563' : '#e5e7eb', right: 85, width: 140 }]}>
                                <ScrollView style={{ maxHeight: 250 }}>
                                    {MONTHS.map(m => (
                                        <TouchableOpacity key={m} style={styles.dropdownItem} onPress={() => {setSelectedMonth(m); setMonthDropdownVisible(false); setPage(0);}}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={{ fontWeight: selectedMonth === m ? 'bold' : 'normal', color: isDarkMode ? '#fff' : '#000' }}>{m}</Text>
                                                {selectedMonth === m && <Check height={14} width={14} fill={isDarkMode ? '#fff' : '#000'}/>}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Status Selection Menu */}
                        {statusDropdownVisible && (
                            <View style={[styles.dropdownMenu, { backgroundColor: isDarkMode ? 'rgba(61, 61, 61, 1)' : '#fff', borderColor: isDarkMode ? '#4B5563' : '#e5e7eb', right: 0, width: 160 }]}>
                                {['upcoming', 'ongoing', 'completed'].map(s => (
                                    <TouchableOpacity key={s} style={styles.dropdownItem} onPress={() => {
                                        const next = statusFilters.includes(s) ? statusFilters.filter(v => v !== s) : [...statusFilters, s];
                                        if(next.length > 0) { setStatusFilters(next); setPage(0); }
                                    }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={{ fontWeight: statusFilters.includes(s) ? 'bold' : 'normal', color: isDarkMode ? '#fff' : '#000', textTransform: 'capitalize' }}>{s}</Text>
                                            {statusFilters.includes(s) && <Check height={14} width={14} fill={isDarkMode ? '#fff' : '#000'}/>}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.eventsGrid}>
                            {paginatedEvents.map((event, idx) => (
                                <EventCard 
                                    key={event.eventCode || idx} 
                                    event={event} 
                                    getEventStatus={getEventStatus} 
                                    isDarkMode={isDarkMode} 
                                />
                            ))}
                        </View>
                        
                        <View style={styles.footer}>
                            <Text style={[styles.selectionText, { color: isDarkMode ? '#9ca3af' : '#6b7280' }]}>
                                {filteredEvents.length} events found. Page {page + 1} of {Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1}
                            </Text>
                            <View style={styles.pagination}>
                                <TouchableOpacity disabled={page === 0} onPress={() => setPage(p => p - 1)} style={[styles.pageBtn, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', opacity: page === 0 ? 0.5 : 1 }]}>
                                    <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Previous</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={page >= Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) - 1} onPress={() => setPage(p => p + 1)} style={[styles.pageBtn, { backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', opacity: page >= Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) - 1 ? 0.5 : 1 }]}>
                                    <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
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
    eventCode: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    teamCountBadge: { alignItems: 'flex-end' },
    teamCountLabel: { fontSize: 10, textTransform: 'uppercase' },
    teamCountValue: { fontSize: 18, fontWeight: '700' },
    eventDetails: { gap: 5 },
    statusBanner: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 },
    statusText: { fontSize: 9, fontWeight: '700' },
    eventDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    eventDetailText: { fontSize: 12 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' },
    selectionText: { fontSize: 10 },
    pagination: { flexDirection: 'row', gap: 8 },
    pageBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
});

export default EventTemplate;