import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import TrophyIcon from '@/assets/icons/trophy.svg';
import LocationIcon from '@/assets/icons/map-pin.svg';
import CalendarIcon from '@/assets/icons/calendar.svg';
import TopScore from '@/assets/icons/ranking.svg';
import { AllianceInfo, EventInfo, MatchInfo } from '@/api/types';
import { re } from 'mathjs';

interface UserGraphSectionProps {
  eventData: EventInfo;
  teamNumber: number;
}

export default function EventCard({ eventData, teamNumber }: UserGraphSectionProps) {
  const { width } = useWindowDimensions();

  const getEventStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Unknown', color: '#9CA3AF' };

    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return { label: 'Completed', color: '#34C759' }; // green
    } else if (eventDate.toDateString() === today.toDateString()) {
      return { label: 'Ongoing', color: '#F59E0B' }; // orange
    } else {
      return { label: 'Not Yet Occurred', color: '#EF4444' }; // red
    }
  };

  const status = getEventStatus(eventData.date);
  
  const isSmallDevice = width < 380;
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

  const renderTeamCell = (team: AllianceInfo | undefined) => {
    if (!team) return null;

    const isRedAlliance = team.alliance === 'red';
    const teams = [team.team_1, team.team_2].filter(Boolean);

    return (
      <View
        style={[
          styles.teamCell,
          isRedAlliance ? styles.redAlliance : styles.blueAlliance,
          isSmallDevice && styles.teamCellSmall,
        ]}
      >
        {teams.map((t, index) => (
          <View
            key={index}
            style={[styles.teamRow, isSmallDevice && styles.teamRowSmall]}
          >
            <View style={styles.teamInfo}>
              <Text
                style={[
                  styles.teamNumber,
                  isRedAlliance ? styles.redTeamText : styles.blueTeamText,
                  isSmallDevice && styles.teamNumberSmall,
                ]}
              >
                Team {t?.teamNumber}
              </Text>
              <Text
                style={[
                  styles.teamName,
                  isRedAlliance ? styles.redTeamNameText : styles.blueTeamNameText,
                  isSmallDevice && styles.teamNameSmall,
                ]}
              >
                {t?.teamName}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMatchRow = (match: MatchInfo, index: number) => {
    const isLastRow = index === matches.length - 1;

    const teamRed = match.redAlliance;
    const teamBlue = match.blueAlliance;
    const teamOnRed = teamRed.team_1 && teamRed.team_1.teamNumber == teamNumber || teamRed.team_2 && teamRed.team_2.teamNumber == teamNumber;

    const redScore = match.redAlliance.totalPoints;
    const blueScore = match.blueAlliance.totalPoints;

    const teamColor = teamOnRed ? 'red' : 'blue';
    const badgeStyle = teamColor === 'red' ? styles.redMatchBadge : styles.blueMatchBadge;
    const badgeTextStyle = teamColor === 'red' ? styles.redMatchText : styles.blueMatchText;

    return (
      <View key={index} style={[
        styles.tableRow,
        isLastRow && styles.lastRow,
        isSmallDevice && styles.tableRowSmall
      ]}>
        <View style={[styles.matchCell, isSmallDevice && styles.matchCellSmall]}>
          <View style={[styles.matchBadge, badgeStyle]}>
            <Text style={[
              styles.matchText,
              badgeTextStyle,
              isSmallDevice && styles.matchTextSmall
            ]}>
              {match.matchNumber}
            </Text>
          </View>
        </View>

        <View style={[styles.scoreCell, isSmallDevice && styles.scoreCellSmall]}>
          <View style={styles.scoreContainer}>
            <Text style={[
              styles.scoreNumber,
              match.redAlliance.win ? styles.winningScore : styles.losingScore,
              isSmallDevice && styles.scoreNumberSmall
            ]}>
              {redScore}
            </Text>
            <Text style={[styles.scoreDivider, isSmallDevice && styles.scoreDividerSmall]}>-</Text>
            <Text style={[
              styles.scoreNumber,
              match.blueAlliance.win ? styles.winningScore : styles.losingScore,
              isSmallDevice && styles.scoreNumberSmall
            ]}>
              {blueScore}
            </Text>
          </View>
        </View>

        {renderTeamCell(teamRed)}
        {renderTeamCell(teamBlue)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        isSmallDevice && styles.cardSmall,
        isLargeDevice && styles.cardLarge
      ]}>
        <View style={[styles.header, isSmallDevice && styles.headerSmall]}>
          <View style={styles.titleSection}>
          {eventData && (
            <Text style={[
              styles.title,
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
              <Text style={{ marginTop: 4, color: '#9CA3AF', fontSize: 12 }}>
                No info yet
              </Text>
            )}
          </View>
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <CalendarIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} />
              </View>
              <Text style={[styles.detailText, isSmallDevice && styles.detailTextSmall]}>
                {eventData.date}
              </Text>
            </View>
            <TouchableOpacity onPress={handleWebsitePress} style={styles.locationRow}>
              <View style={styles.iconContainer}>
                <LocationIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} />
              </View>
              <Text style={[
                styles.detailText, 
                styles.linkText,
                isSmallDevice && styles.detailTextSmall
              ]}>
                {eventData.location}
              </Text>
            </TouchableOpacity>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <TrophyIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} />
              </View>
              <Text style={[styles.detailText, isSmallDevice && styles.detailTextSmall]}>
                {eventData.achievements}
              </Text>
            </View>
          </View>
          <View style={[styles.performanceCard, isSmallDevice && styles.performanceCardSmall]}>
            <View style={styles.performanceHeader}>
              <Text style={[
                styles.performanceTitle,
                isSmallDevice && styles.performanceTitleSmall
              ]}>
                Team Performance
              </Text>
              <View style={styles.rankBadge}>
                <TopScore width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} fill='#92400E' />
                <Text style={[styles.rankText, isSmallDevice && styles.rankTextSmall]}>
                  {eventData.place} Place
                </Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>Record</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>
                  {eventData.record}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>Win Rate</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>
                  {eventData.winRate}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>OPR</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>{eventData.OPR}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>Average</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>{eventData.averageScore}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.matchesSection, isSmallDevice && styles.matchesSectionSmall]}>
          <Text style={[
            styles.sectionTitle,
            isSmallDevice && styles.sectionTitleSmall
          ]}>
            Match Results
          </Text>
          {width < 600 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <View style={[styles.matchHeaderCell, isSmallDevice && styles.matchHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Match</Text>
                </View>
                <View style={[styles.scoreHeaderCell, isSmallDevice && styles.scoreHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Score</Text>
                </View>
                <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Red Alliance</Text>
                </View>
                <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Blue Alliance</Text>
                </View>
                </View>
                {matches.map(renderMatchRow)}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.matchHeaderCell, isSmallDevice && styles.matchHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Match</Text>
                </View>
                <View style={[styles.scoreHeaderCell, isSmallDevice && styles.scoreHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Score</Text>
                </View>
                <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Red Alliance</Text>
                </View>
                <View style={[styles.allianceHeaderCell, isSmallDevice && styles.allianceHeaderCellSmall]}>
                  <Text style={[styles.headerText, isSmallDevice && styles.headerTextSmall]}>Blue Alliance</Text>
                </View>
              </View>
              {matches.map(renderMatchRow)}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FAFBFC',
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
    backgroundColor: '#FAFBFC',

    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#111827',
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
    color: '#374151',
    flex: 1,
  },
  detailTextSmall: {
    fontSize: 13,
  },
  linkText: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#111827',
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
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  statLabelSmall: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  statValueSmall: {
    fontSize: 14,
  },
  matchesSection: {
    padding: 16,
    borderBottomLeftRadius: 16,  // NEW
    borderBottomRightRadius: 16, // NEW
    overflow: 'hidden',          // NEW
  },
  matchesSectionSmall: {
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    minWidth: 600,
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 80,
  },
  tableRowSmall: {
    minHeight: 70,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  matchHeaderCell: {
    flex: 1,
    minWidth: 70,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchHeaderCellSmall: {
    minWidth: 60,
    padding: 12,
  },
  scoreHeaderCell: {
    flex: 1.2,
    minWidth: 80,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreHeaderCellSmall: {
    minWidth: 70,
    padding: 12,
  },
  allianceHeaderCell: {
    flex: 2.5,
    minWidth: 140,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allianceHeaderCellSmall: {
    minWidth: 120,
    padding: 12,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTextSmall: {
    fontSize: 11,
  },
  matchCell: {
    flex: 1,
    minWidth: 70,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCellSmall: {
    minWidth: 60,
    padding: 12,
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
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
    fontSize: 11,
  },
  redMatchText: {
    color: '#DC2626',
  },
  blueMatchText: {
    color: '#2563EB',
  },
  scoreCell: {
    flex: 1.2,
    minWidth: 80,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCellSmall: {
    minWidth: 70,
    padding: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 16,
  },
  scoreNumberSmall: {
    fontSize: 16,
  },
  winningScore: {
    // color: '#059669',
    color: '#34C759',
  },
  losingScore: {
    color: '#6B7280',
  },
  scoreDivider: {
    fontSize: 16,
    color: '#9CA3AF',
    marginHorizontal: 8,
  },
  scoreDividerSmall: {
    fontSize: 14,
    marginHorizontal: 6,
  },
  teamCell: {
    flex: 2.5,
    minWidth: 140,
    padding: 12,
    justifyContent: 'center',
  },
  teamCellSmall: {
    minWidth: 120,
    padding: 8,
  },
  redAlliance: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  blueAlliance: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  teamRow: {
    marginBottom: 8,
  },
  teamRowSmall: {
    marginBottom: 6,
  },
  teamInfo: {
    flexDirection: 'column',
  },
  teamNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamNumberSmall: {
    fontSize: 12,
  },
  teamName: {
    fontSize: 11,
    // fontStyle: 'italic',
    marginTop: 2,
    // opacity: 0.8,
  },
  teamNameSmall: {
    fontSize: 9,
    marginTop: 1,
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