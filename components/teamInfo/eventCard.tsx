import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import TopScore from '@/assets/icons/trophy.svg';
import LocationIcon from '@/assets/icons/map-pin.svg';
import CalendarIcon from '@/assets/icons/calendar.svg';

const matches = [
  {
    match: 'Q-2',
    redScore: 10,
    blueScore: 7,
    redTeams: ['14750', 'ATOM', '26418', 'Flying Nuggets'],
    blueTeams: ['22', '100 Scholars', '7482', 'Java Beans']
  },
  {
    match: 'Q-5',
    redScore: 31,
    blueScore: 46,
    redTeams: ['26507', 'Geneton', '22', '100 Scholars'],
    blueTeams: ['17005', 'SAE Dragonbots', '12769', 'Rebellion Engineering']
  },
  {
    match: 'Q-7',
    redScore: 121,
    blueScore: 37,
    redTeams: ['22', '100 Scholars', '17005', 'SAE Dragonbots'],
    blueTeams: ['7482', 'Java Beans', '23509', 'RoboRibbits']
  },
  {
    match: 'Q-10',
    redScore: 92,
    blueScore: 46,
    redTeams: ['11127', 'Whitefield Robotics', '26507', 'Geneton'],
    blueTeams: ['21915', 'SMA Bobcats', '22', '100 Scholars']
  },
  {
    match: 'Q-11',
    redScore: 76,
    blueScore: 11,
    redTeams: ['23509', 'RoboRibbits', '21915', 'SMA Bobcats'],
    blueTeams: ['22', '100 Scholars', '26418', 'Flying Nuggets']
  }
];

export default function EventCard() {
  const { width } = useWindowDimensions();
  
  const isSmallDevice = width < 380;
  const isLargeDevice = width >= 768;

  const handleWebsitePress = async () => {
    const url = 'https://www.douglascountyschools.com/robotics';
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const getTeamDisplayName = (team: string) => {
    const knownNames: { [key: string]: string } = {
      'ATOM': 'ATOM',
      '100 Scholars': '100 Scholars',
      'Geneton': 'Geneton',
      'SAE Dragonbots': 'SAE Dragonbots',
      'Java Beans': 'Java Beans',
      'Whitefield Robotics': 'Whitefield Robotics',
      'RoboRibbits': 'RoboRibbits',
      'Flying Nuggets': 'Flying Nuggets',
      'Rebellion Engineering': 'Rebellion Engineering',
      'SMA Bobcats': 'SMA Bobcats'
    };
    return knownNames[team] || team;
  };

  const renderTeamCell = (teams: any[], isRed: boolean) => (
    <View style={[
      styles.teamCell, 
      isRed ? styles.redAlliance : styles.blueAlliance,
      isSmallDevice && styles.teamCellSmall
    ]}>
      {teams.map((team, index) => {
        const isNumber = /^\d+$/.test(team);
        const displayName = getTeamDisplayName(team);
        return (
          <View key={index} style={[styles.teamRow, isSmallDevice && styles.teamRowSmall]}>
            <View style={styles.teamInfo}>
              {isNumber ? (
                <>
                  <Text style={[
                    styles.teamNumber, 
                    isRed ? styles.redTeamText : styles.blueTeamText,
                    isSmallDevice && styles.teamNumberSmall
                  ]}>
                    Team {team}
                  </Text>
                  {displayName !== team && (
                    <Text style={[
                      styles.teamName, 
                      isRed ? styles.redTeamNameText : styles.blueTeamNameText,
                      isSmallDevice && styles.teamNameSmall
                    ]}>
                      {displayName}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={[
                  styles.teamName, 
                  isRed ? styles.redTeamNameText : styles.blueTeamNameText,
                  isSmallDevice && styles.teamNameSmall
                ]}>
                  {team}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderMatchRow = (match: any, index: number) => {
    const redWon = (match.redScore ?? 0) > (match.blueScore ?? 0);
    const isLastRow = index === matches.length - 1;
    return (
      <View key={index} style={[
        styles.tableRow, 
        isLastRow && styles.lastRow,
        isSmallDevice && styles.tableRowSmall
      ]}>
        <View style={[styles.matchCell, isSmallDevice && styles.matchCellSmall]}>
          <View style={[styles.matchBadge, redWon ? styles.redMatchBadge : styles.blueMatchBadge]}>
            <Text style={[
              styles.matchText, 
              redWon ? styles.redMatchText : styles.blueMatchText,
              isSmallDevice && styles.matchTextSmall
            ]}>
              {match.match}
            </Text>
          </View>
        </View>
        <View style={[styles.scoreCell, isSmallDevice && styles.scoreCellSmall]}>
          <View style={styles.scoreContainer}>
            <Text style={[
              styles.scoreNumber, 
              redWon ? styles.winningScore : styles.losingScore,
              isSmallDevice && styles.scoreNumberSmall
            ]}>
              {match.redScore}
            </Text>
            <Text style={[styles.scoreDivider, isSmallDevice && styles.scoreDividerSmall]}>-</Text>
            <Text style={[
              styles.scoreNumber, 
              !redWon ? styles.winningScore : styles.losingScore,
              isSmallDevice && styles.scoreNumberSmall
            ]}>
              {match.blueScore}
            </Text>
          </View>
        </View>
        {renderTeamCell(match.redTeams, true)}
        {renderTeamCell(match.blueTeams, false)}
      </View>
    );
  };

  const teamWins = matches.filter(match => {
    const isOnRed = match.redTeams.includes('22') || match.redTeams.includes('100 Scholars');
    const isOnBlue = match.blueTeams.includes('22') || match.blueTeams.includes('100 Scholars');
    return isOnRed ? match.redScore > match.blueScore : isOnBlue && match.blueScore > match.redScore;
  }).length;

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        isSmallDevice && styles.cardSmall,
        isLargeDevice && styles.cardLarge
      ]}>
        <View style={[styles.header, isSmallDevice && styles.headerSmall]}>
          <View style={styles.titleSection}>
            <Text style={[
              styles.title,
              isSmallDevice && styles.titleSmall,
              isLargeDevice && styles.titleLarge
            ]}>
              Douglasville-DCHS League Meet #2
            </Text>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, isSmallDevice && styles.statusTextSmall]}>
                COMPLETED
              </Text>
            </View>
          </View>
          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <CalendarIcon width={isSmallDevice ? 14 : 16} height={isSmallDevice ? 14 : 16} />
              </View>
              <Text style={[styles.detailText, isSmallDevice && styles.detailTextSmall]}>
                November 23, 2024
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
                Douglas County High School, Douglasville, GA
              </Text>
            </TouchableOpacity>
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
                  9th Place
                </Text>
              </View>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>Record</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>
                  {teamWins}-{matches.length - teamWins}-0
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>Win Rate</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>
                  {((teamWins / matches.length) * 100).toFixed(0)}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>OPR</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>13.07</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, isSmallDevice && styles.statLabelSmall]}>Average</Text>
                <Text style={[styles.statValue, isSmallDevice && styles.statValueSmall]}>30.20</Text>
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
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 18,
    fontWeight: '600',
  },
  scoreNumberSmall: {
    fontSize: 16,
  },
  winningScore: {
    // color: '#059669',
    color: '#34C759',
    fontWeight: '700',
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
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
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