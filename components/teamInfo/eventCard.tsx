import { getCachedMatchScoreDetails, SupportedYear } from '@/api/firstAPI';
import { EventInfo, MatchInfo } from '@/api/types';
import CalendarIcon from '@/assets/icons/calendar.svg';
import LocationIcon from '@/assets/icons/map-pin.svg';
import TopScore from '@/assets/icons/ranking.svg';
import TrophyIcon from '@/assets/icons/trophy.svg';
import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import MatchRow from './MatchRow';
import MatchScoreBreakdown from './MatchScoreBreakdown';

interface UserGraphSectionProps {
  eventData: EventInfo;
  teamNumber: number;
  seasonYear: SupportedYear;
}

export default function EventCard({ eventData, teamNumber, seasonYear }: UserGraphSectionProps) {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [highlightedTeam, setHighlightedTeam] = useState<number | null>(teamNumber);
  const [matchScoreDetails, setMatchScoreDetails] = useState<any>(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const lastClickRef = useRef<{ teamNumber: number; timestamp: number } | null>(null);

  const getRoutePath = (year: SupportedYear) => {
    const routePaths: Record<SupportedYear, string> = {
      2019: 'rise',
      2020: 'forward', 
      2021: 'gamechangers',
      2022: 'energize',
      2023: 'inshow',
      2024: 'intothedeep',
      2025: 'age',
    };
    return routePaths[year] || 'age';
  };

  const getEventStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Unknown', color: '#9CA3AF' };
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) return { label: 'Completed', color: '#34C759' };
    if (eventDate.toDateString() === today.toDateString()) return { label: 'Ongoing', color: '#F59E0B' };
    return { label: 'Upcoming', color: '#EF4444' };
  };

  const status = getEventStatus(eventData.date);
  const isSmallDevice = width < 768;
  const isLargeDevice = width >= 768;
  const matches = eventData.matches || [];

  const isUpcomingEvent = status.label === 'Upcoming' || status.label === 'Ongoing';

  const handleWebsitePress = async () => {
    const url = 'https://www.google.com/search?q=' + eventData.location.replace(/\s+/g, '+');
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const handleTeamClick = (clickedTeamNumber: number) => {
    if (highlightedTeam === clickedTeamNumber) {
      const routePath = getRoutePath(seasonYear);
      router.push(`/dashboards/${routePath}?teamnumber=${clickedTeamNumber}` as any);
      setHighlightedTeam(teamNumber);
      lastClickRef.current = null;
    } else {
      setHighlightedTeam(clickedTeamNumber);
      lastClickRef.current = { teamNumber: clickedTeamNumber, timestamp: Date.now() };
    }
  };

  const handleMatchClick = async (matchNumber: string, match: MatchInfo) => {
    const isExpanding = expandedMatch !== matchNumber;
    
    if (isExpanding && expandedMatch !== null && expandedMatch !== matchNumber) {
      setMatchScoreDetails(null);
    }
    
    setExpandedMatch(isExpanding ? matchNumber : null);
    
    if (isExpanding) {
      setLoadingScores(true);
      setMatchScoreDetails(null);
      
      const eventCode = eventData.eventCode || 'UNKNOWN';
      let tournamentLevel: 'qual' | 'playoff' = 'qual';
      
      // Check if it's any type of playoff match (PLAYOFF, FINALS, SEMIFINAL, etc.)
      if (match.matchType && match.matchType !== 'QUALIFICATION' && match.matchType !== 'PRACTICE') {
        tournamentLevel = 'playoff';
      }
      
      const matchNum = parseInt(matchNumber.replace(/\D/g, '')) || 0;
      
      try {
        const details = await getCachedMatchScoreDetails(seasonYear, eventCode, tournamentLevel, matchNum);
        if (details) {
          setMatchScoreDetails(details);
        }
      } catch (error) {
        console.error('Error fetching match score details:', error);
      } finally {
        setLoadingScores(false);
      }
    }
  };

  const renderScoreBreakdown = (match: MatchInfo) => (
    <MatchScoreBreakdown
      match={match}
      matchScoreDetails={matchScoreDetails}
      loadingScores={loadingScores}
    />
  );

  if (isUpcomingEvent) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }]}>
        <View 
          style={[styles.card, {
            backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
          }, isSmallDevice && styles.cardSmall, isLargeDevice && styles.cardLarge]}
        >
          <View style={[styles.header, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
            borderBottomColor: 'transparent',
          }, isSmallDevice && styles.headerSmall]}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice ? styles.titleSmall : isLargeDevice ? styles.titleLarge : null]}>
                {eventData.name}
              </Text>
              <View style={[styles.statusBadge, {
                backgroundColor: status.label === 'Upcoming' ? 'rgba(239, 68, 68, 0.1)' : status.label === 'Ongoing' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(52, 199, 89, 0.1)',
                borderColor: status.color,
                borderWidth: 1,
              }]}>
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>
            <View>
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <CalendarIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
                </View>
                <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }, isSmallDevice && styles.detailTextSmall]}>
                  {eventData.date}
                </Text>
              </View>
              <TouchableOpacity onPress={handleWebsitePress} style={styles.locationRow}>
                <View style={styles.iconContainer}>
                  <LocationIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
                </View>
                <Text style={[styles.detailText, styles.linkText, { color: isDarkMode ? '#60A5FA' : '#2563EB' }, isSmallDevice && styles.detailTextSmall]}>
                  {eventData.location}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }]}>
      <View 
        style={[styles.card, {
          backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
        }, isSmallDevice && styles.cardSmall, isLargeDevice && styles.cardLarge]}
      >
        <View style={[styles.header, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
          borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#E5E7EB',
        }, isSmallDevice && styles.headerSmall]}>
          <View style={styles.titleSection}>
            {eventData && (
              <Text style={[styles.title, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice ? styles.titleSmall : isLargeDevice ? styles.titleLarge : null]}>
                {eventData.name}
              </Text>
            )}
            <View style={[styles.statusBadge, {
              backgroundColor: status.label === 'Upcoming' ? 'rgba(239, 68, 68, 0.1)' : status.label === 'Ongoing' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(52, 199, 89, 0.1)',
              borderColor: status.color,
              borderWidth: 1,
            }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
            {(status.label !== 'Completed' && matches.length === 0) && (
              <Text style={{ marginTop: 4, color: isDarkMode ? '#6B7280' : '#9CA3AF', fontSize: 12 }}>
                No info yet
              </Text>
            )}
          </View>
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <CalendarIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
              </View>
              <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }, isSmallDevice && styles.detailTextSmall]}>
                {eventData.date}
              </Text>
            </View>
            <TouchableOpacity onPress={handleWebsitePress} style={styles.locationRow}>
              <View style={styles.iconContainer}>
                <LocationIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
              </View>
              <Text style={[styles.detailText, styles.linkText, { color: isDarkMode ? '#60A5FA' : '#2563EB' }, isSmallDevice && styles.detailTextSmall]}>
                {eventData.location}
              </Text>
            </TouchableOpacity>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <TrophyIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
              </View>
              <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }, isSmallDevice && styles.detailTextSmall]}>
                {eventData.achievements}
              </Text>
            </View>
          </View>
          <View style={[styles.performanceCard, {
            backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF',
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
          }, isSmallDevice && styles.performanceCardSmall]}>
            <View style={styles.performanceHeader}>
              <Text style={[styles.performanceTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice && styles.performanceTitleSmall]}>
                Team Performance
              </Text>
              <View style={[styles.rankBadge, {
                backgroundColor: isDarkMode ? '#3F2F1F' : '#FEF3C7',
                borderColor: isDarkMode ? '#A16207' : '#F59E0B',
              }]}>
                <TopScore width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#FBBF24' : '#92400E'} />
                <Text style={[styles.rankText, { color: isDarkMode ? '#FBBF24' : '#92400E' }, isSmallDevice && styles.rankTextSmall]}>
                  {eventData.place} Place
                </Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.statLabelSmall]}>Record</Text>
                <Text style={[styles.statValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice && styles.statValueSmall]}>{eventData.record}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.statLabelSmall]}>Win Rate</Text>
                <Text style={[styles.statValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice && styles.statValueSmall]}>{eventData.winRate}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.statLabelSmall]}>OPR</Text>
                <Text style={[styles.statValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice && styles.statValueSmall]}>{eventData.OPR}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.statLabelSmall]}>Average</Text>
                <Text style={[styles.statValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice && styles.statValueSmall]}>{eventData.averageScore}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.matchesSection, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }, isSmallDevice && styles.matchesSectionSmall]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }, isSmallDevice && styles.sectionTitleSmall]}>
            Match Results
          </Text>
          <View style={[styles.table, { borderColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
            {!isSmallDevice && (
              <View style={[styles.tableHeader, {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
                borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
              }]}>
                <View style={[styles.matchHeaderCell, isSmallDevice && styles.matchHeaderCellSmall]}>
                  <Text style={[styles.headerText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.headerTextSmall]}>Match</Text>
                </View>
                <View style={[styles.scoreHeaderCell, isSmallDevice && styles.scoreHeaderCellSmall]}>
                  <Text style={[styles.headerText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.headerTextSmall]}>Score</Text>
                </View>
                <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                  <Text style={[styles.headerText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.headerTextSmall]}>Red Alliance</Text>
                </View>
                <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                  <Text style={[styles.headerText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }, isSmallDevice && styles.headerTextSmall]}>Blue Alliance</Text>
                </View>
              </View>
            )}
            {isSmallDevice && (
              <View style={[styles.mobileTableHeader, {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
                borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
              }]}>
                <Text style={[styles.mobileHeaderText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Match</Text>
                <Text style={[styles.mobileHeaderText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Score</Text>
              </View>
            )}
            {matches.map((match, index) => (
              <MatchRow
                key={index}
                match={match}
                index={index}
                totalMatches={matches.length}
                isSmallDevice={isSmallDevice}
                expandedMatch={expandedMatch}
                highlightedTeam={highlightedTeam}
                onMatchClick={handleMatchClick}
                onTeamClick={handleTeamClick}
                renderScoreBreakdown={renderScoreBreakdown}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
  },
  card: {
    borderWidth: 3,
    borderRadius: 16,
    elevation: 4,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden', 
  },
  cardSmall: {
    borderRadius: 16,
  },
  cardLarge: {
    borderRadius: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  headerSmall: {
    padding: 12,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
    lineHeight: 28,
  },
  titleSmall: {
    fontSize: 18,
    lineHeight: 24,
    marginRight: 8,
  },
  titleLarge: {
    fontSize: 26,
    lineHeight: 32,
  },
  statusBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34C759',
    letterSpacing: 0.5,
  },
  eventDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 15,
    flex: 1,
  },
  detailTextSmall: {
    fontSize: 13,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  performanceCard: {
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
  },
  performanceCardSmall: {
    padding: 12,
    borderRadius: 4,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  performanceTitleSmall: {
    fontSize: 14,
  },
  rankBadge: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  rankTextSmall: {
    fontSize: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  statLabelSmall: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  statValueSmall: {
    fontSize: 14,
  },
  matchesSection: {
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  matchesSectionSmall: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionTitleSmall: {
    fontSize: 16,
    marginBottom: 12,
  },
  table: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  mobileTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  mobileHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchHeaderCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchHeaderCellSmall: {
    flex: 1,
    minWidth: 0,
    padding: 8,
  },
  scoreHeaderCell: {
    flex: 1.2,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreHeaderCellSmall: {
    flex: 1.2,
    minWidth: 0,
    padding: 8,
  },
  allianceHeaderCell: {
    flex: 2.5,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allianceHeaderCellSmall: {
    flex: 1,
    minWidth: 0,
    padding: 8,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTextSmall: {
    fontSize: 11,
  },
});
