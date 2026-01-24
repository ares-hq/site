import { getCachedMatchScoreDetails } from '@/api/match-scores';
import { EventInfo, MatchInfo, SupportedYear } from '@/api/utils/types';
import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import MatchRow from './MatchRow';
import MatchScoreBreakdown from './MatchScoreBreakdown';

interface UserGraphSectionProps {
  eventData: EventInfo;
  seasonYear: SupportedYear;
}

export default function EventMatchCard({ eventData, seasonYear }: UserGraphSectionProps) {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [highlightedTeam, setHighlightedTeam] = useState<number | null>(null);
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
    //   setHighlightedTeam(clickedTeamNumber);
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
      let tournamentLevel: 'qual' | 'playoff' | 'practice' = 'qual';
      
      const matchTypeUpper = match.matchType?.toUpperCase() || '';
      
      // Check if it's a practice match first
      if (matchTypeUpper === 'PRACTICE') {
        tournamentLevel = 'practice';
      } else {
        // Then check if it's a playoff match
        const isPlayoffMatch = matchTypeUpper !== 'QUALIFICATION' && 
                               matchTypeUpper !== '';
        
        if (isPlayoffMatch) {
          tournamentLevel = 'playoff';
        }
        
        const matchNumberUpper = matchNumber?.toUpperCase() || '';
        if (matchNumberUpper.startsWith('P-') || 
            matchNumberUpper.startsWith('SF-') || 
            matchNumberUpper.startsWith('F-') ||
            matchNumberUpper.startsWith('QF-')) {
          tournamentLevel = 'playoff';
        }
      }
      
      const matchNum = parseInt(matchNumber.replace(/\D/g, '')) || 0;
      
      try {
        const details = await getCachedMatchScoreDetails(seasonYear, eventCode, tournamentLevel, matchNum);
        if (details) {
          setMatchScoreDetails(details);
        } else {
          console.log('No details returned for match:', matchNumber, tournamentLevel);
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

  return (
    <View style={[styles.container]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
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
  performanceCard: {
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
  },
  performanceCardSmall: {
    padding: 12,
    borderRadius: 4,
  },
  matchesSection: {
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
    borderRadius: 12,
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
