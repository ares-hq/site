import { AllianceInfo, EventInfo, MatchInfo } from '@/api/types';
import CalendarIcon from '@/assets/icons/calendar.svg';
import LocationIcon from '@/assets/icons/map-pin.svg';
import TopScore from '@/assets/icons/ranking.svg';
import TrophyIcon from '@/assets/icons/trophy.svg';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useState } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

interface UserGraphSectionProps {
  eventData: EventInfo;
  teamNumber: number;
}

export default function EventCard({ eventData, teamNumber }: UserGraphSectionProps) {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useDarkMode();

  const getEventStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Unknown', color: '#9CA3AF' };
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) return { label: 'Completed', color: '#34C759' };
    if (eventDate.toDateString() === today.toDateString()) return { label: 'Ongoing', color: '#F59E0B' };
    return { label: 'Not Yet Occurred', color: '#EF4444' };
  };

  const status = getEventStatus(eventData.date);
  const isSmallDevice = width < 768;
  const isLargeDevice = width >= 768;
  const matches = eventData.matches || [];

  const handleWebsitePress = async () => {
    const url = 'https://www.google.com/search?q=' + eventData.location.replace(/\s+/g, '+');
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const renderTeamCell = (team: AllianceInfo | undefined, isHovered: boolean = false) => {
    if (!team) return null;
    const isRedAlliance = team.alliance === 'red';
    const teams = [team.team_1, team.team_2].filter(Boolean);
    
    const baseColor = isRedAlliance
      ? (isDarkMode ? '#3B1F1F' : '#FEF2F2')
      : (isDarkMode ? '#1F2F3F' : '#EFF6FF');
    
    const hoverColor = isRedAlliance
      ? (isDarkMode ? '#4B2626' : '#FEE2E2')
      : (isDarkMode ? '#2A3F54' : '#DBEAFE');
    
    return (
      <View style={[styles.teamCell,
        isRedAlliance
          ? [styles.redAlliance, { backgroundColor: isHovered ? hoverColor : baseColor }]
          : [styles.blueAlliance, { backgroundColor: isHovered ? hoverColor : baseColor }],
        isSmallDevice && styles.teamCellSmall]}> {
        teams.map((t, index) => (
          <View key={index} style={[styles.teamRow, isSmallDevice && styles.teamRowSmall]}>
            <View style={styles.teamInfo}>
              <Text style={[styles.teamNumber, { color: isDarkMode ? (isRedAlliance ? '#FCA5A5' : '#93C5FD') : isRedAlliance ? '#DC2626' : '#2563EB' }, isSmallDevice && styles.teamNumberSmall]} numberOfLines={1}>Team {t?.teamNumber}</Text>
              <Text style={[styles.teamName, { color: isDarkMode ? (isRedAlliance ? '#F87171' : '#60A5FA') : isRedAlliance ? '#B91C1C' : '#1D4ED8' }, isSmallDevice && styles.teamNameSmall]} numberOfLines={2} ellipsizeMode="tail">{t?.teamName}</Text>
            </View>
          </View>
        ))
      }</View>
    );
  };

  const renderMatchRow = (match: MatchInfo, index: number) => {
    const [isHovered, setIsHovered] = useState(false);
    const isLastRow = index === matches.length - 1;
    const teamRed = match.redAlliance;
    const teamBlue = match.blueAlliance;
    const teamOnRed = teamRed.team_1?.teamNumber == teamNumber || teamRed.team_2?.teamNumber == teamNumber;
    const redScore = match.redAlliance.totalPoints;
    const blueScore = match.blueAlliance.totalPoints;
    const teamColor = teamOnRed ? 'red' : 'blue';
    const badgeStyle = teamColor === 'red'
      ? { backgroundColor: isDarkMode ? '#4B1C1C' : '#FEE2E2', borderColor: isDarkMode ? '#7F1D1D' : '#FECACA' }
      : { backgroundColor: isDarkMode ? '#1C2C4B' : '#DBEAFE', borderColor: isDarkMode ? '#1E3A8A' : '#BFDBFE' };
    const badgeTextColor = teamColor === 'red'
      ? isDarkMode ? '#FCA5A5' : '#DC2626'
      : isDarkMode ? '#93C5FD' : '#2563EB';
    
    const hoverColor = teamColor === 'red'
      ? isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'
      : isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
    
    if (isSmallDevice) {
      // Mobile layout: fully stacked vertically, each alliance full width
      return (
        <View key={index} style={[styles.tableRowMobileStacked, { borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }, isLastRow && styles.lastRow]}>
          <View style={styles.mobileMatchInfo}>
            <View style={[styles.matchBadge, badgeStyle]}>
              <Text style={[styles.matchText, { color: badgeTextColor }, styles.matchTextSmall]}>{match.matchNumber}</Text>
            </View>
            <View style={styles.mobileScoreDisplay}>
              <Text style={[styles.scoreNumber, match.redAlliance.win ? styles.winningScore : styles.losingScore, styles.scoreNumberSmall]}>{redScore}</Text>
              <Text style={[styles.scoreDivider, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }, styles.scoreDividerSmall]}>-</Text>
              <Text style={[styles.scoreNumber, match.blueAlliance.win ? styles.winningScore : styles.losingScore, styles.scoreNumberSmall]}>{blueScore}</Text>
            </View>
          </View>
          <View style={[styles.mobileAllianceCell, styles.redAlliance, { backgroundColor: isDarkMode ? '#3B1F1F' : '#FEF2F2' }]}>
            {[teamRed.team_1, teamRed.team_2].filter(Boolean).map((t, idx) => (
              <Text key={idx} style={[styles.mobileTeamText, { color: isDarkMode ? '#FCA5A5' : '#DC2626' }]} numberOfLines={1}>
                <Text style={{ fontWeight: '700' }}>{t?.teamNumber}</Text> • {t?.teamName}
              </Text>
            ))}
          </View>
          <View style={[styles.mobileAllianceCell, styles.blueAlliance, { backgroundColor: isDarkMode ? '#1F2F3F' : '#EFF6FF' }]}>
            {[teamBlue.team_1, teamBlue.team_2].filter(Boolean).map((t, idx) => (
              <Text key={idx} style={[styles.mobileTeamText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }]} numberOfLines={1}>
                <Text style={{ fontWeight: '800' }}>{t?.teamNumber}</Text> • {t?.teamName}
              </Text>
            ))}
          </View>
        </View>
      );
    }
    
    // Desktop layout: horizontal
    return (
      <View 
        key={index} 
        style={[
          styles.tableRow, 
          { borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }, 
          isLastRow && styles.lastRow, 
          isSmallDevice && styles.tableRowSmall,
          isHovered && { backgroundColor: hoverColor }
        ]}
        // @ts-ignore - Web only props
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <View style={[styles.matchCell, isSmallDevice && styles.matchCellSmall]}>
          <View style={[styles.matchBadge, badgeStyle]}>
            <Text style={[styles.matchText, { color: badgeTextColor }, isSmallDevice && styles.matchTextSmall]}>{match.matchNumber}</Text>
          </View>
        </View>
        <View style={[styles.scoreCell, isSmallDevice && styles.scoreCellSmall]}>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreNumber, match.redAlliance.win ? styles.winningScore : styles.losingScore, isSmallDevice && styles.scoreNumberSmall]}>{redScore}</Text>
            <Text style={[styles.scoreDivider, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }, isSmallDevice && styles.scoreDividerSmall]}>-</Text>
            <Text style={[styles.scoreNumber, match.blueAlliance.win ? styles.winningScore : styles.losingScore, isSmallDevice && styles.scoreNumberSmall]}>{blueScore}</Text>
          </View>
        </View>
        {renderTeamCell(teamRed, isHovered)}
        {renderTeamCell(teamBlue, isHovered)}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' }
    ]}>
      <View style={[
        styles.card,
        {
          backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
        },
        isSmallDevice && styles.cardSmall,
        isLargeDevice && styles.cardLarge
      ]}>
        <View style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FAFBFC',
            borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#E5E7EB',
          },
          isSmallDevice && styles.headerSmall
        ]}>
          <View style={styles.titleSection}>
          {eventData && (
            <Text style={[
              styles.title,
              { color: isDarkMode ? '#F9FAFB' : '#111827' },
              isSmallDevice ? styles.titleSmall : isLargeDevice ? styles.titleLarge : null
            ]}>
              {eventData.name}
            </Text>
          )}
            <View style={[styles.statusBadge]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
            {(status.label !== 'Completed' && matches.length === 0) && (
              <Text style={{ 
                marginTop: 4, 
                color: isDarkMode ? '#6B7280' : '#9CA3AF', 
                fontSize: 12 
              }}>
                No info yet
              </Text>
            )}
          </View>
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <CalendarIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
              </View>
              <Text style={[
                styles.detailText,
                { color: isDarkMode ? '#D1D5DB' : '#374151' },
                isSmallDevice && styles.detailTextSmall
              ]}>
                {eventData.date}
              </Text>
            </View>
            <TouchableOpacity onPress={handleWebsitePress} style={styles.locationRow}>
              <View style={styles.iconContainer}>
                <LocationIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
              </View>
              <Text style={[
                styles.detailText, 
                styles.linkText,
                { color: isDarkMode ? '#60A5FA' : '#2563EB' },
                isSmallDevice && styles.detailTextSmall
              ]}>
                {eventData.location}
              </Text>
            </TouchableOpacity>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <TrophyIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#fff' : '#000'}/>
              </View>
              <Text style={[
                styles.detailText,
                { color: isDarkMode ? '#D1D5DB' : '#374151' },
                isSmallDevice && styles.detailTextSmall
              ]}>
                {eventData.achievements}
              </Text>
            </View>
          </View>
          <View style={[
            styles.performanceCard,
            {
              backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF',
              borderColor: isDarkMode ? '#374151' : '#E5E7EB',
            },
            isSmallDevice && styles.performanceCardSmall
          ]}>
            <View style={styles.performanceHeader}>
              <Text style={[
                styles.performanceTitle,
                { color: isDarkMode ? '#F9FAFB' : '#111827' },
                isSmallDevice && styles.performanceTitleSmall
              ]}>
                Team Performance
              </Text>
<View style={[
  styles.rankBadge,
  {
    backgroundColor: isDarkMode ? '#3F2F1F' : '#FEF3C7',
    borderColor: isDarkMode ? '#A16207' : '#F59E0B',
  }
]}>
  <TopScore width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill={isDarkMode ? '#FBBF24' : '#92400E'} />
  <Text style={[
    styles.rankText, 
    { color: isDarkMode ? '#FBBF24' : '#92400E' },
    isSmallDevice && styles.rankTextSmall
  ]}>
    {eventData.place} Place
  </Text>
</View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statLabel,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  isSmallDevice && styles.statLabelSmall
                ]}>
                  Record
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' },
                  isSmallDevice && styles.statValueSmall
                ]}>
                  {eventData.record}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statLabel,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  isSmallDevice && styles.statLabelSmall
                ]}>
                  Win Rate
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' },
                  isSmallDevice && styles.statValueSmall
                ]}>
                  {eventData.winRate}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statLabel,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  isSmallDevice && styles.statLabelSmall
                ]}>
                  OPR
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' },
                  isSmallDevice && styles.statValueSmall
                ]}>
                  {eventData.OPR}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[
                  styles.statLabel,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  isSmallDevice && styles.statLabelSmall
                ]}>
                  Average
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: isDarkMode ? '#F9FAFB' : '#111827' },
                  isSmallDevice && styles.statValueSmall
                ]}>
                  {eventData.averageScore}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={[
          styles.matchesSection,
          { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#FFFFFF' },
          isSmallDevice && styles.matchesSectionSmall
        ]}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#F9FAFB' : '#111827' },
            isSmallDevice && styles.sectionTitleSmall
          ]}>
            Match Results
          </Text>
          <View style={[
            styles.table,
            { borderColor: isDarkMode ? '#374151' : '#E5E7EB' }
          ]}>
            {!isSmallDevice && (
              <View style={[
                styles.tableHeader,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
                  borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
                }
              ]}>
                <View style={[styles.matchHeaderCell, isSmallDevice && styles.matchHeaderCellSmall]}>
                <Text style={[
                  styles.headerText,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  isSmallDevice && styles.headerTextSmall
                ]}>
                  Match
                </Text>
              </View>
              <View style={[styles.scoreHeaderCell, isSmallDevice && styles.scoreHeaderCellSmall]}>
                <Text style={[
                  styles.headerText,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  isSmallDevice && styles.headerTextSmall
                ]}>
                  Score
                </Text>
              </View>
              <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                <Text style={[
                  styles.headerText,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                  isSmallDevice && styles.headerTextSmall
                ]}>
                  Red Alliance
                </Text>
              </View>
              <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                <Text style={[
                  styles.headerText,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' },
                isSmallDevice && styles.headerTextSmall
              ]}>
                Blue Alliance
              </Text>
            </View>
              </View>
            )}
            {isSmallDevice && (
              <View style={[
                styles.mobileTableHeader,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
                  borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
                }
              ]}>
                <Text style={[styles.mobileHeaderText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Match</Text>
                <Text style={[styles.mobileHeaderText, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Score</Text>
              </View>
            )}
            {matches.map(renderMatchRow)}
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
    borderWidth: 2,
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
  statusTextSmall: {
    fontSize: 8,
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
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: 50,
  },
  tableRowSmall: {
    minHeight: 50,
  },
  tableRowMobileStacked: {
    flexDirection: 'column',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
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
  mobileMatchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  mobileScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mobileAllianceCell: {
    width: '100%',
    padding: 6,
    borderLeftWidth: 4,
    marginBottom: 4,
  },
  mobileTeamText: {
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 2,
  },
  mobileRowHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mobileAlliancesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  lastRow: {
    borderBottomWidth: 0,
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
  matchCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCellSmall: {
    flex: 0.8,
    minWidth: 0,
    padding: 4,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  redMatchBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  blueMatchBadge: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  matchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  matchTextSmall: {
    fontSize: 9,
  },
  redMatchText: {
    color: '#DC2626',
  },
  blueMatchText: {
    color: '#2563EB',
  },
  scoreCell: {
    flex: 1.2,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCellSmall: {
    flex: 1,
    minWidth: 0,
    padding: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 16,
  },
  scoreNumberSmall: {
    fontSize: 12,
  },
  winningScore: {
    color: '#34C759',
  },
  losingScore: {
    color: '#6B7280',
  },
  scoreDivider: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  scoreDividerSmall: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  teamCell: {
    flex: 2.5,
    padding: 8,
    justifyContent: 'center',
  },
  teamCellSmall: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    padding: 4,
  },
  redAlliance: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  blueAlliance: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  teamRow: {
    marginBottom: 8,
  },
  teamRowSmall: {
    marginBottom: 4,
  },
  teamInfo: {
    flexDirection: 'column',
  },
  teamNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamNumberSmall: {
    fontSize: 8,
  },
  teamName: {
    fontSize: 11,
    marginTop: 2,
  },
  teamNameSmall: {
    fontSize: 6,
    marginTop: 0.5,
  },
  redTeamText: {
    color: '#DC2626',
  },
  blueTeamText: {
    color: '#2563EB',
  },
  redTeamNameText: {
    color: '#B91C1C',
  },
  blueTeamNameText: {
    color: '#1D4ED8',
  },
});