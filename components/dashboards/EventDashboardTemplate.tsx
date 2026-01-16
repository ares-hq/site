import { calculateTeamOPR } from '@/api/calcOPR';
import { getEventsBasic, SupportedYear } from '@/api/firstAPI';
import { usePageTitleContext } from '@/app/_layout';
import { useDarkMode } from '@/context/DarkModeContext';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

// Icons
import CalendarIcon from '@/assets/icons/calendar.svg';
import ShieldIcon from '@/assets/icons/identification-card.svg';
import LocationIcon from '@/assets/icons/map-pin.svg';
import { Feather } from '@expo/vector-icons';

type StatCardProps = {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
  color: 'blue' | 'indigo';
  isMobile?: boolean;
};

const StatCard = ({ title, value, change, positive, color, isMobile }: StatCardProps) => {
  const { isDarkMode } = useDarkMode();
  
  const getBackgroundColor = () => {
    if (isDarkMode) {
      return color === 'blue' ? 'rgba(30, 58, 138, 0.4)' : 'rgba(55, 48, 163, 0.4)';
    }
    return color === 'blue' ? '#E6F1FD' : '#EDEEFC';
  };

  const textColor = positive ? '#16a34a' : '#dc2626';

  return (
    <View style={[
      isMobile ? styles.statCardMobile : styles.statCard,
      { backgroundColor: getBackgroundColor() }
    ]}>
      <Text style={[
        isMobile ? styles.titleMobile : styles.title,
        { color: isDarkMode ? '#D1D5DB' : '#6b7280' }
      ]}>
        {title}
      </Text>
      <View style={isMobile ? styles.rowMobile : styles.row}>
        <Text style={[
          isMobile ? styles.valueMobile : styles.value,
          { color: isDarkMode ? '#F9FAFB' : '#000' }
        ]}>
          {value}
        </Text>
        {change && (
          <View style={styles.changeRow}>
            <Text style={[styles.change, { color: textColor }]}>{change}</Text>
            <Feather name={positive ? 'trending-up' : 'trending-down'} size={isMobile ? 9 : 11} color={textColor} />
          </View>
        )}
      </View>
    </View>
  );
};

const LiveDataIndicator = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.liveIndicatorContainer}>
      <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
      <Text style={[styles.liveText, { color: isDarkMode ? '#FCA5A5' : '#DC2626' }]}>
        Live Data
      </Text>
    </View>
  );
};

const EventDashboardTemplate = () => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useDarkMode();
  const { setPageTitleInfo } = usePageTitleContext();
  const params = useLocalSearchParams();
  const isMobile = width < 820;

  const eventCode = Array.isArray(params.eventCode) ? params.eventCode[0] : params.eventCode;
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const seasonYear = (yearParam ? parseInt(yearParam, 10) : 2025) as SupportedYear;

  const [eventData, setEventData] = useState<any>(null);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [teamOPRs, setTeamOPRs] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        if (!eventCode) throw new Error('No event code');

        // Fetch event basic info
        const basicEvents = await getEventsBasic(seasonYear, true);
        const basicEvent = basicEvents.find(e => e.eventCode === eventCode);

        if (!basicEvent) throw new Error('Event not found');

        // Fetch all matches for this event from FIRST API
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
        const headers = { apikey: supabaseAnonKey };

        const matchRes = await fetch(
          `https://api.ares-bot.com/functions/v1/first/${seasonYear}/matches/${eventCode}`,
          { headers }
        );
        const matchData = await matchRes.json();
        const fetchedMatches = matchData.matches || [];

        // Fetch team names for all teams at the event
        const allTeamNumbers = new Set<number>();
        fetchedMatches.forEach((match: any) => {
          match.teams?.forEach((t: any) => {
            if (t?.teamNumber) allTeamNumbers.add(t.teamNumber);
          });
        });

        // Calculate OPR for all teams using qualification matches only
        const qualMatches = fetchedMatches.filter((m: any) => 
          m.tournamentLevel?.toUpperCase() === 'QUALIFICATION'
        );

        // Create a mapping of team numbers to OPR values
        const oprMap = new Map<number, number>();
        allTeamNumbers.forEach(teamNum => {
          // For event-level OPR, we need to build match info for OPR calculation
          const matchesForOPR = qualMatches.map((match: any) => {
            const redTeams = match.teams?.filter((t: any) => t.station?.toLowerCase().includes('red')) || [];
            const blueTeams = match.teams?.filter((t: any) => t.station?.toLowerCase().includes('blue')) || [];
            
            return {
              redAlliance: {
                team_1: redTeams[0] ? { teamNumber: redTeams[0].teamNumber } : undefined,
                team_2: redTeams[1] ? { teamNumber: redTeams[1].teamNumber } : undefined,
                totalPoints: match.scoreRedFinal || 0,
                penalty: 0,
              },
              blueAlliance: {
                team_1: blueTeams[0] ? { teamNumber: blueTeams[0].teamNumber } : undefined,
                team_2: blueTeams[1] ? { teamNumber: blueTeams[1].teamNumber } : undefined,
                totalPoints: match.scoreBlueFinal || 0,
                penalty: 0,
              }
            };
          });

          const opr = calculateTeamOPR(matchesForOPR, teamNum);
          if (opr > 0) oprMap.set(teamNum, opr);
        });

        setEventData(basicEvent);
        setAllMatches(fetchedMatches);
        setTeamOPRs(oprMap);
        setPageTitleInfo({ customSuffix: basicEvent.name });
      } catch (err) {
        console.error('Error fetching event data:', err);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventCode, seasonYear]);

  if (loading) return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }]}>
      <ActivityIndicator size="large" color={isDarkMode ? '#F9FAFB' : '#111827'} />
    </View>
  );

  if (error || !eventData) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }]}>
        <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827' }}>{error || 'Event not found'}</Text>
      </View>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(eventData.date);
  
  let status = { label: 'Upcoming', color: '#EF4444' };
  if (eventDate < today) status = { label: 'Completed', color: '#34C759' };
  else if (eventDate.toDateString() === today.toDateString()) status = { label: 'Ongoing', color: '#F59E0B' };

  const matchCount = allMatches.length;
  const isOngoing = status.label === 'Ongoing';

  // Calculate tournament difficulty rating (average OPR of all teams)
  const avgOPR = teamOPRs.size > 0 
    ? Array.from(teamOPRs.values()).reduce((a, b) => a + b, 0) / teamOPRs.size
    : 0;

  const getDifficultyRating = (avgOpr: number) => {
    if (avgOpr >= 120) return { label: 'Elite', color: '#EF4444' };
    if (avgOpr >= 100) return { label: 'Competitive', color: '#F59E0B' };
    if (avgOpr >= 80) return { label: 'Balanced', color: '#3B82F6' };
    if (avgOpr >= 60) return { label: 'Moderate', color: '#10B981' };
    return { label: 'Accessible', color: '#8B5CF6' };
  };

  const difficulty = getDifficultyRating(avgOPR);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* MAIN CARD - MATCHING EVENTCARD STYLE */}
      <View
        style={[styles.card, {
          backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
        }]}
      >
        <View style={[styles.header, {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
          borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#E5E7EB',
        }]}>
          <View style={styles.titleSection}>
            <Text style={[styles.mainTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
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
            {isOngoing && <LiveDataIndicator isDarkMode={isDarkMode} />}
          </View>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <CalendarIcon width={16} height={16} fill={isDarkMode ? '#fff' : '#000'} />
              <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>
                {eventData.date}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <LocationIcon width={16} height={16} fill={isDarkMode ? '#fff' : '#000'} />
              <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>
                {eventData.location}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <ShieldIcon width={16} height={16} fill={isDarkMode ? '#fff' : '#000'} />
              <Text style={[styles.detailText, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>
                {eventData.type || 'Regular'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* STATS GRID - MATCHING DASHBOARDTEMPLATE */}
      <View style={[styles.statsGridContainer, isMobile && styles.statsGridContainerMobile]}>
        <StatCard
          title="Total Matches"
          value={matchCount.toString()}
          color="blue"
          isMobile={isMobile}
        />
        <StatCard
          title="Participating Teams"
          value={teamOPRs.size.toString()}
          color="indigo"
          isMobile={isMobile}
        />
        <StatCard
          title="Tournament Difficulty"
          value={difficulty.label}
          color={difficulty.color === '#EF4444' ? 'blue' : 'indigo'}
          isMobile={isMobile}
        />
        <StatCard
          title="Avg Team OPR"
          value={avgOPR.toFixed(1)}
          color={difficulty.color === '#EF4444' ? 'indigo' : 'blue'}
          isMobile={isMobile}
        />
      </View>

      {/* DIFFICULTY INDICATOR */}
      <View style={[styles.difficultyCard, {
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
      }]}>
        <View style={styles.difficultyHeader}>
          <Text style={[styles.difficultyLabel, { color: isDarkMode ? '#D1D5DB' : '#6B7280' }]}>
            Tournament Difficulty
          </Text>
          <View style={[styles.difficultyBadge, { backgroundColor: `${difficulty.color}20` }]}>
            <View style={[styles.difficultyDot, { backgroundColor: difficulty.color }]} />
            <Text style={[styles.difficultyValue, { color: difficulty.color }]}>
              {difficulty.label}
            </Text>
          </View>
        </View>
        <Text style={[styles.difficultyDesc, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
          Based on average OPR across {teamOPRs.size} teams
        </Text>
      </View>

      {/* MATCH RESULTS SECTION - MAIN CONTENT */}
      {matchCount > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            Matches ({matchCount})
          </Text>
          <View style={[styles.matchesContainer, {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
          }]}>
            {allMatches.map((match: any, idx: number) => {
              const redTeams = match.teams?.filter((t: any) => t.station?.toLowerCase().includes('red')) || [];
              const blueTeams = match.teams?.filter((t: any) => t.station?.toLowerCase().includes('blue')) || [];
              const redScore = match.scoreRedFinal || 0;
              const blueScore = match.scoreBlueFinal || 0;
              const isExpanded = expandedMatch === match.matchNumber;

              return (
                <View key={idx}>
                  <TouchableOpacity
                    onPress={() => setExpandedMatch(isExpanded ? null : match.matchNumber)}
                    style={[styles.matchRow, {
                      borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#E5E7EB',
                      borderBottomWidth: idx < allMatches.length - 1 ? 1 : 0,
                      backgroundColor: isExpanded ? (isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F5F7FA') : undefined
                    }]}
                  >
                    <View style={styles.matchRowContent}>
                      <Text style={[styles.matchNumber, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
                        {match.matchNumber || `Match ${idx + 1}`}
                      </Text>

                      <View style={styles.allianceContainer}>
                        {/* RED ALLIANCE */}
                        <View style={[styles.allianceBox, {
                          backgroundColor: redScore > blueScore ? (isDarkMode ? 'rgba(220, 38, 38, 0.15)' : 'rgba(254, 226, 226, 0.4)') : (isDarkMode ? 'rgba(55, 65, 81, 0.2)' : '#F9FAFB')
                        }]}>
                          <View style={styles.teamListRed}>
                            {redTeams.map((team: any, i: number) => (
                              <View key={i} style={styles.teamBadgeRed}>
                                <Text style={[styles.teamNumberBadge, { color: '#DC2626' }]}>
                                  {team.teamNumber}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <Text style={[styles.scoreText, { color: '#DC2626' }]}>
                            {redScore}
                          </Text>
                        </View>

                        <Text style={[styles.vs, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }]}>vs</Text>

                        {/* BLUE ALLIANCE */}
                        <View style={[styles.allianceBox, {
                          backgroundColor: blueScore > redScore ? (isDarkMode ? 'rgba(37, 99, 235, 0.15)' : 'rgba(219, 234, 254, 0.4)') : (isDarkMode ? 'rgba(55, 65, 81, 0.2)' : '#F9FAFB')
                        }]}>
                          <View style={styles.teamListBlue}>
                            {blueTeams.map((team: any, i: number) => (
                              <View key={i} style={styles.teamBadgeBlue}>
                                <Text style={[styles.teamNumberBadge, { color: '#2563EB' }]}>
                                  {team.teamNumber}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <Text style={[styles.scoreText, { color: '#2563EB' }]}>
                            {blueScore}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.matchType, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                        {match.tournamentLevel || 'QUALIFICATION'}
                      </Text>
                      <Text style={[styles.expandIcon, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>
                        {isExpanded ? '−' : '+'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                    <View style={[styles.matchExpanded, {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#FAFBFC',
                      borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#E5E7EB',
                    }]}>
                      {/* RED TEAM DETAILS */}
                      <View style={styles.allianceDetails}>
                        <Text style={[styles.allianceTitle, { color: '#DC2626' }]}>Red Alliance</Text>
                        {redTeams.map((team: any, i: number) => {
                          const opr = teamOPRs.get(team.teamNumber) || 0;
                          return (
                            <View key={i} style={styles.teamDetailRow}>
                              <Text style={[styles.teamDetailNumber, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>
                                Team {team.teamNumber}
                              </Text>
                              {opr > 0 && (
                                <View style={[styles.oprBadge, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
                                  <Text style={[styles.oprText, { color: '#DC2626' }]}>OPR: {opr.toFixed(1)}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>

                      {/* BLUE TEAM DETAILS */}
                      <View style={styles.allianceDetails}>
                        <Text style={[styles.allianceTitle, { color: '#2563EB' }]}>Blue Alliance</Text>
                        {blueTeams.map((team: any, i: number) => {
                          const opr = teamOPRs.get(team.teamNumber) || 0;
                          return (
                            <View key={i} style={styles.teamDetailRow}>
                              <Text style={[styles.teamDetailNumber, { color: isDarkMode ? '#D1D5DB' : '#374151' }]}>
                                Team {team.teamNumber}
                              </Text>
                              {opr > 0 && (
                                <View style={[styles.oprBadge, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
                                  <Text style={[styles.oprText, { color: '#2563EB' }]}>OPR: {opr.toFixed(1)}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* EMPTY STATE */}
      {matchCount === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC' }]}>
          <Text style={[styles.emptyTitle, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
            {status.label === 'Upcoming' ? 'Event Upcoming' : 'Event In Progress'}
          </Text>
          <Text style={[styles.emptyText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
            Match data will appear here once the event starts or concludes.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  titleSection: {
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsGridContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statsGridContainerMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    height: 97,
    borderRadius: 13,
    padding: 20,
  },
  statCardMobile: {
    flex: 1,
    minWidth: 160,
    height: 80,
    borderRadius: 10,
    padding: 12,
  },
  title: {
    fontSize: 15,
    marginBottom: 9,
  },
  titleMobile: {
    fontSize: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  rowMobile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
  },
  valueMobile: {
    fontSize: 18,
    fontWeight: '700',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  change: {
    fontSize: 13,
    fontWeight: '600',
  },
  difficultyCard: {
    borderRadius: 13,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  difficultyDesc: {
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  matchesContainer: {
    borderRadius: 13,
    borderWidth: 1,
    overflow: 'hidden',
  },
  matchRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  matchRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  matchNumber: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 70,
  },
  allianceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allianceBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    minHeight: 40,
  },
  teamListRed: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  teamListBlue: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  teamBadgeRed: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  teamBadgeBlue: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  teamNumberBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  vs: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  matchType: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 50,
  },
  expandIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  matchExpanded: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
  },
  allianceDetails: {
    flex: 1,
  },
  allianceTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  teamDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  teamDetailNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  oprBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  oprText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.1)',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default EventDashboardTemplate;