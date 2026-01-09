import { getAllTeams, SupportedYear } from '@/api/dashboardInfo';
import type { TeamInfo } from '@/api/types';
import { usePageTitleContext } from '@/app/_layout';
import DataTable from '@/components/graphs/teamTables';
import { useDarkMode } from '@/context/DarkModeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

const TRanks = () => {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedYear, setSelectedYear] = useState<SupportedYear>(2025);
  const { isDarkMode } = useDarkMode();
  const { setPageTitleInfo } = usePageTitleContext();

  const availableYears: SupportedYear[] = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
  
  const getSeasonName = (year: SupportedYear): string => {
    const seasonNames: Record<SupportedYear, string> = {
      2019: '2019 - Skystone',
      2020: '2020 - Ultimate Goal',
      2021: '2021 - Freight Frenzy',
      2022: '2022 - Power Play',
      2023: '2023 - Centerstage',
      2024: '2024 - Into the Deep',
      2025: '2025 - Decode',
    };
    return seasonNames[year] || `${year} Season`;
  };

  // Update browser tab title with season and ranking type
  useEffect(() => {
    setPageTitleInfo({
      customSuffix: `(${getSeasonName(selectedYear)})`,
    });
  }, [selectedYear, setPageTitleInfo]);

  const fetchTeams = useCallback(async (isRefresh = false, year = selectedYear) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const result = await getAllTeams(year);
      const teamsData = result ?? [];
      
      setTeams(teamsData);
      setLastUpdated(new Date());
      
    } catch (err) {
      setError('Failed to load team data. Please try again.');
      console.error(`Error fetching teams for ${year}:`, err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [selectedYear]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeams(true);
  }, [fetchTeams]);

  const handleYearChange = useCallback((year: SupportedYear) => {
    setSelectedYear(year);
    setTeams([]); // Clear current teams while loading
    fetchTeams(false, year);
  }, []);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const YearSelector = () => (
    <View style={[
      styles.yearSelectorContainer,
      { 
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
        borderColor: isDarkMode ? '#374151' : '#E2E8F0',
      }
    ]}>
      <Text style={[
        styles.yearSelectorLabel,
        { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
      ]}>
        Season
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.yearScrollContent}
        bounces={false}
      >
        {availableYears.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearButton,
              {
                backgroundColor: selectedYear === year
                  ? (isDarkMode ? '#374151' : '#e5e7eb')
                  : 'transparent',
                borderColor: selectedYear === year
                  ? (isDarkMode ? '#374151' : '#e5e7eb')
                  : (isDarkMode ? '#374151' : '#e5e7eb'),
              }
            ]}
            onPress={() => handleYearChange(year)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.yearButtonText,
              {
                color: selectedYear === year
                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151')
                  : (isDarkMode ? '#D1D5DB' : '#374151'),
              }
            ]}>
              {year}
            </Text>
            <Text style={[
              styles.yearButtonSubtext,
              {
                color: selectedYear === year
                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#374151')
                  : (isDarkMode ? '#9CA3AF' : '#374151'),
              }
            ]}>
              {getSeasonName(year)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons 
        name="alert-circle-outline" 
        size={80} 
        color={isDarkMode ? '#EF4444' : '#DC2626'} 
      />
      <Text style={[styles.errorTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorMessage, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
        {error}
      </Text>
      <TouchableOpacity
        style={[
          styles.retryButton, 
          { backgroundColor: isDarkMode ? '#6B7280' : '#374151' }
        ]}
        onPress={() => fetchTeams()}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={20} color="#ffffff" style={{ marginRight: 8 }} />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const StatsHeader = () => {
    const { width } = useWindowDimensions();

    return (
      <View 
        style={[
          styles.statsContainer,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
            borderColor: isDarkMode ? '#374151' : '#E2E8F0',
          }
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text 
              style={[
                styles.statNumber, 
                { color: isDarkMode ? '#F9FAFB' : '#111827' }
              ]}
            >
              {teams.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              Teams Loaded
            </Text>
          </View>

          {width > 600 && (
            <>
              <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]} />
              <View style={styles.statItem}>
                <View style={styles.statusIndicator}>
                  <View style={[
                    styles.statusDot, 
                    { backgroundColor: '#FF0000' }
                  ]} />
                  <Text style={[styles.statusText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                    Live
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  Status
                </Text>
              </View>
            </>
          )}

          <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#374151' : '#E5E7EB' }]} />
          
          <View style={styles.statItem}>
            {lastUpdated ? (
              <>
                <Text style={[styles.statNumber, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  Updated
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.statNumber, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  --:--
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  Updated
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[
        styles.loadingOverlay,
      ]}>
        <View style={[
          styles.loadingContainer,
        ]}>
          <ActivityIndicator size="large" color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          <Text style={[
            styles.loadingText,
            { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
          ]}>
            Loading {getSeasonName(selectedYear)} Rankings...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[
        styles.container,
        { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
      ]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <YearSelector />
        <ErrorState />
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
    ]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? '#9CA3AF' : '#6B7280']}
            tintColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
            title="Pull to refresh"
            titleColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
          />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Team Rankings
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Discover {getSeasonName(selectedYear)}'s top performing teams
          </Text>
        </View>

        <YearSelector />
        <StatsHeader />

        <View style={styles.tableContainer}>
          <DataTable teams={teams} data='overall' selectedYear={selectedYear}/>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.8,
  },
  yearSelectorContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  yearSelectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  yearScrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  yearButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  yearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  yearButtonSubtext: {
    fontSize: 10,
    lineHeight: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  statsContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
    lineHeight: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    height: 24,
    justifyContent: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 12,
  },
  tableContainer: {
    // paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    opacity: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TRanks;