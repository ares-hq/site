import { getCachedMatchScoreDetails } from '@/api/match-scores';
import { EventInfo, MatchInfo, SupportedYear } from '@/api/utils/types';
import CalendarIcon from '@/assets/icons/calendar.svg';
import LocationIcon from '@/assets/icons/map-pin.svg';
import TopScore from '@/assets/icons/ranking.svg';
import TrophyIcon from '@/assets/icons/trophy.svg';
import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Animated
} from 'react-native';
import MatchRow from './MatchRow';
import MatchScoreBreakdown from './MatchScoreBreakdown';

// --- Animated Live Indicator ---
const LiveDot = () => {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.liveDot, { opacity }]} />;
};

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

  const getRoutePath = (year: SupportedYear) => {
    const routePaths: Record<SupportedYear, string> = {
      2019: 'rise', 2020: 'forward', 2021: 'gamechangers',
      2022: 'energize', 2023: 'inshow', 2024: 'intothedeep', 2025: 'age',
    };
    return routePaths[year] || 'age';
  };

  const getEventStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Unknown', color: '#9CA3AF', isLive: false };
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) return { label: 'Completed', color: '#34C759', isLive: false };
    if (eventDate.toDateString() === today.toDateString()) return { label: 'LIVE', color: '#EF4444', isLive: true };
    return { label: 'Upcoming', color: '#6B7280', isLive: false };
  };

  const status = getEventStatus(eventData.date);
  const isSmallDevice = width < 768;
  const matches = eventData.matches || [];

  const handleEventPress = () => {
    // Navigate to the specific event page using eventCode
    router.push(`/analytics/events/${eventData.eventCode}?year=${seasonYear}` as any);
  };

  const handleWebsitePress = async () => {
    const url = 'https://www.google.com/search?q=' + eventData.location.replace(/\s+/g, '+');
    try { await Linking.openURL(url); } catch (error) { console.error('URL error:', error); }
  };

  const handleTeamClick = (clickedTeamNumber: number) => {
    if (highlightedTeam === clickedTeamNumber) {
      router.push(`/dashboards/${getRoutePath(seasonYear)}?teamnumber=${clickedTeamNumber}` as any);
    } else {
      setHighlightedTeam(clickedTeamNumber);
    }
  };

  const handleMatchClick = async (matchNumber: string, match: MatchInfo) => {
    const isExpanding = expandedMatch !== matchNumber;
    setExpandedMatch(isExpanding ? matchNumber : null);
    if (isExpanding) {
      setLoadingScores(true);
      const eventCode = eventData.eventCode || 'UNKNOWN';
      const tournamentLevel = (match.matchType?.toUpperCase() === 'PRACTICE') ? 'practice' : 
                             (['PLAYOFF', 'SEMIFINAL', 'FINAL'].includes(match.matchType?.toUpperCase() || '')) ? 'playoff' : 'qual';
      try {
        const details = await getCachedMatchScoreDetails(seasonYear, eventCode, tournamentLevel, matchNumber);
        if (details) setMatchScoreDetails(details);
      } catch (error) { console.error(error); } finally { setLoadingScores(false); }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }]}>
      <View style={[styles.card, { 
        backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF', 
        borderColor: status.isLive ? '#EF4444' : (isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#E5E7EB'),
        borderWidth: status.isLive ? 2 : 1 
      }]}>
        
        <View style={[styles.header, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC' }]}>
          <TouchableOpacity 
            onPress={handleEventPress} 
            style={styles.titleSection}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.title, 
              { color: isDarkMode ? '#F9FAFB' : '#111827', textDecorationLine: 'underline' }, 
              isSmallDevice && styles.titleSmall
            ]}>
              {eventData.name}
            </Text>
            <View style={[styles.statusBadge, { 
                backgroundColor: status.isLive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)', 
                borderColor: status.color, 
                borderWidth: 1, 
                flexDirection: 'row', 
                alignItems: 'center' 
            }]}>
              {status.isLive && <LiveDot />}
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}><CalendarIcon width={14} height={14} fill={isDarkMode ? '#fff' : '#000'}/></View>
              <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>{eventData.date}</Text>
            </View>
            <TouchableOpacity onPress={handleWebsitePress} style={styles.locationRow}>
              <View style={styles.iconContainer}><LocationIcon width={14} height={14} fill={isDarkMode ? '#fff' : '#000'}/></View>
              <Text style={[styles.detailText, styles.linkText, { color: isDarkMode ? '#60A5FA' : '#2563EB' }]}>{eventData.location}</Text>
            </TouchableOpacity>
            {eventData.achievements && (
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}><TrophyIcon width={14} height={14} fill={isDarkMode ? '#fff' : '#000'}/></View>
                <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>{eventData.achievements}</Text>
              </View>
            )}
          </View>

          {/* Performance Data */}
          {(eventData.place || eventData.OPR || eventData.record || eventData.winRate) && (
            <View style={[styles.performanceCard, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF', borderColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
              <View style={styles.performanceHeader}>
                <Text style={[styles.performanceTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>Event Performance</Text>
                {eventData.place && (
                  <View style={[styles.rankBadge, { backgroundColor: isDarkMode ? '#3F2F1F' : '#FEF3C7', borderColor: isDarkMode ? '#A16207' : '#F59E0B' }]}>
                    <TopScore width={14} height={14} fill={isDarkMode ? '#FBBF24' : '#92400E'} />
                    <Text style={[styles.rankText, { color: isDarkMode ? '#FBBF24' : '#92400E' }]}>{eventData.place} Place</Text>
                  </View>
                )}
              </View>
              <View style={styles.statsGrid}>
                {eventData.record && <View style={styles.statItem}><Text style={styles.statLabel}>Record</Text><Text style={[styles.statValue, {color: isDarkMode ? '#FFF' : '#000'}]}>{eventData.record}</Text></View>}
                {eventData.winRate != null && <View style={styles.statItem}><Text style={styles.statLabel}>Win Rate</Text><Text style={[styles.statValue, {color: isDarkMode ? '#FFF' : '#000'}]}>{eventData.winRate}%</Text></View>}
                {eventData.OPR && <View style={styles.statItem}><Text style={styles.statLabel}>OPR</Text><Text style={[styles.statValue, {color: isDarkMode ? '#FFF' : '#000'}]}>{eventData.OPR}</Text></View>}
                {eventData.averageScore && <View style={styles.statItem}><Text style={styles.statLabel}>Avg</Text><Text style={[styles.statValue, {color: isDarkMode ? '#FFF' : '#000'}]}>{eventData.averageScore}</Text></View>}
              </View>
            </View>
          )}
        </View>

        {/* Matches Section */}
        {matches.length > 0 && (
          <View style={styles.matchesSection}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>Match Results</Text>
            <View style={[styles.table, { borderColor: isDarkMode ? '#374151' : '#E5E7EB' }]}>
              <View style={[styles.mobileTableHeader, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB' }]}>
                <Text style={styles.mobileHeaderText}>Match</Text>
                <Text style={styles.mobileHeaderText}>Score</Text>
              </View>
              {matches.map((match, index) => (
                <MatchRow
                  key={index} match={match} index={index} totalMatches={matches.length}
                  isSmallDevice={isSmallDevice} expandedMatch={expandedMatch}
                  highlightedTeam={highlightedTeam} onMatchClick={handleMatchClick}
                  onTeamClick={handleTeamClick}
                  renderScoreBreakdown={() => (
                    <MatchScoreBreakdown match={match} matchScoreDetails={matchScoreDetails} loadingScores={loadingScores} />
                  )}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginBottom: 20 },
  card: { borderRadius: 16, width: '100%', overflow: 'hidden' },
  header: { padding: 16, borderBottomWidth: 1, borderColor: 'transparent' },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', flex: 1, marginRight: 10 },
  titleSmall: { fontSize: 16 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
  eventDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconContainer: { width: 24, alignItems: 'center' },
  detailText: { fontSize: 14 },
  linkText: { textDecorationLine: 'underline' },
  performanceCard: { borderRadius: 8, padding: 12, borderWidth: 1 },
  performanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  performanceTitle: { fontSize: 14, fontWeight: '600' },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  rankText: { fontSize: 11, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, color: '#6B7280', marginBottom: 2 },
  statValue: { fontSize: 14, fontWeight: '700' },
  matchesSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  table: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  mobileTableHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderColor: '#374151' },
  mobileHeaderText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' }
});