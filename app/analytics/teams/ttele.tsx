import { getAllTeams } from '@/api/dashboardInfo';
import DataTable from '@/components/graphs/teamTables';
import type { TeamInfo } from '@/api/types';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';
import { Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

const TTele = () => {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { isDarkMode } = useDarkMode();

  const fetchTeams = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      
      const result = await getAllTeams();
      const teamsData = result ?? [];
      
      setTeams(teamsData);
      setLastUpdated(new Date());
      
    } catch (err) {
      setError('Failed to load team data. Please try again.');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeams(true);
  }, [fetchTeams]);

  React.useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

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
                    { backgroundColor: isDarkMode ? '#9CA3AF' : '#6B7280' }
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
        { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' },
      ]}>
        <View style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }
        ]}>
          <ActivityIndicator size="large" color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
          <Text style={[
            styles.loadingText,
            { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
          ]}>
            Loading...
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
            Teleop Rankings
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Teleoperated performance standings
          </Text>
        </View>

        <StatsHeader />

        <View style={styles.tableContainer}>
          <DataTable teams={teams} data='teleop' />
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

export default TTele;