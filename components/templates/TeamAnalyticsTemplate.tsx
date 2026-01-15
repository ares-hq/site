import { getAllTeams, SupportedYear } from '@/api/dashboardInfo';
import { TeamInfo } from '@/api/types';
import { usePageTitleContext } from '@/app/_layout';
import DataTable from '@/components/graphs/teamTables';
import { ErrorState } from '@/components/shared/ErrorState';
import { YearSelector } from '@/components/shared/YearSelector';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import Clock from '../../assets/icons/clock.svg';
import People from '../../assets/icons/users.svg';

interface TeamAnalyticsTemplateProps {
  pageTitle: string;
  dataType: 'overall' | 'auto' | 'teleop' | 'endgame';
}

const GAME_NAMES: Record<SupportedYear, string> = {
  2019: 'Skystone',
  2020: 'Ultimate Goal',
  2021: 'Freight Frenzy',
  2022: 'Power Play',
  2023: 'Centerstage',
  2024: 'Into the Deep',
  2025: 'Decode',
};

const TeamAnalyticsTemplate: React.FC<TeamAnalyticsTemplateProps> = ({ pageTitle, dataType }) => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useDarkMode();
  const { setPageTitleInfo } = usePageTitleContext();

  // State variables
  const [selectedYear, setSelectedYear] = useState<SupportedYear>(2025);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const availableYears: SupportedYear[] = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

  const getSeasonName = (year: SupportedYear): string => {
    return GAME_NAMES[year] || `${year} Season`;
  };

  const fetchTeams = useCallback(async (year: SupportedYear, isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const teamsData = await getAllTeams(year);
      if (teamsData) {
        setTeams(teamsData);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch teams data');
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to fetch teams data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleYearChange = useCallback((year: SupportedYear) => {
    setSelectedYear(year);
  }, []);

  const onRefresh = useCallback(() => {
    fetchTeams(selectedYear, true);
  }, [selectedYear, fetchTeams]);

  // Initial fetch
  useEffect(() => {
    fetchTeams(selectedYear);
  }, [selectedYear, fetchTeams]);

  // Update browser tab title with season and ranking type
  useEffect(() => {
    setPageTitleInfo({
      customSuffix: `(${getSeasonName(selectedYear)})`,
    });
  }, [selectedYear, setPageTitleInfo]);

  const isSmallDevice = width < 768;

  if (error) {
    return (
      <View style={[styles.container]}>
        <ErrorState error={error} onRetry={onRefresh} />
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#F9FAFB' : '#111827'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            {pageTitle}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            {getSeasonName(selectedYear)}
          </Text>
          <View style={[styles.metadataContent, isSmallDevice ? styles.metadataContentMobile : styles.metadataContentDesktop, styles.metadataContentRight]}>
            <View style={[styles.metadataItem, !isSmallDevice && styles.metadataItemDesktop, isSmallDevice && styles.metadataItemMobile]}>
              <View style={[styles.iconContainer, isSmallDevice && styles.iconContainerMobile]}>
                <People width={isSmallDevice ? 20 : 25} height={isSmallDevice ? 20 : 25} fill={isDarkMode ? '#9CA3AF' : '#6B7280'}/>
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.metadataLabel, isSmallDevice && styles.metadataLabelMobile, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  Teams Loaded
                </Text>
                <Text style={[styles.metadataValue, isSmallDevice && styles.metadataValueMobile, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                  {loading ? 'Loading...' : teams.length.toLocaleString()}
                </Text>
              </View>
            </View>
            
            <View style={[styles.metadataItem, !isSmallDevice && styles.metadataItemDesktop, isSmallDevice && styles.metadataItemMobile]}>
              <View style={[styles.iconContainer, isSmallDevice && styles.iconContainerMobile]}>
                <Clock width={isSmallDevice ? 20 : 25} height={isSmallDevice ? 20 : 25} fill={isDarkMode ? '#9CA3AF' : '#6B7280'}/>
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.metadataLabel, isSmallDevice && styles.metadataLabelMobile, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                  Last Updated
                </Text>
                <Text style={[styles.metadataValue, isSmallDevice && styles.metadataValueMobile, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                  {lastUpdated ? lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Loading...'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <YearSelector
          selectedYear={selectedYear}
          availableYears={availableYears}
          onYearChange={handleYearChange}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={isDarkMode ? '#F9FAFB' : '#111827'}
            />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
              Loading team data...
            </Text>
          </View>
        ) : (
          <>
            <DataTable
              teams={teams}
              data={dataType}
              selectedYear={selectedYear}
            />

          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // padding: 16,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    // fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  metadataCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metadataContent: {
    padding: 10,
  },
  metadataContentDesktop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  metadataContentMobile: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  metadataContentRight: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataItemMobile: {
    paddingHorizontal: 4,
  },
  metadataItemDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerMobile: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingTop: 1,
  },
  textContainer: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 14,
    // fontWeight: '600',
    // textTransform: 'uppercase',
    // letterSpacing: 0.5,
    marginBottom: 2,
  },
  metadataLabelMobile: {
    fontSize: 12,
    // fontWeight: '600',
    // textTransform: 'uppercase',
    // letterSpacing: 0.5,
    marginBottom: 1,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  metadataValueMobile: {
    fontSize: 11,
    fontWeight: '700',
  },
  separator: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
});

export default TeamAnalyticsTemplate;