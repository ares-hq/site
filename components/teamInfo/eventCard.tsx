import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity
} from 'react-native';

interface Match {
  match: string;
  redScore: number;
  blueScore: number;
  redTeams: string[];
  blueTeams: string[];
}

const matches: Match[] = [
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

function EventCard() {
  const handleWebsitePress = async () => {
    const url = 'https://www.douglascountyschools.com/robotics';
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const getTeamDisplayName = (team: string) => {
    const knownNames: Record<string, string> = {
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

  const renderTeamCell = (teams: string[], isRed: boolean) => {
    return (
      <View style={[styles.teamCell, isRed ? styles.redAlliance : styles.blueAlliance]}>
        {teams.map((team, index) => {
          const isNumber = /^\d+$/.test(team);
          const displayName = getTeamDisplayName(team);
          
          return (
            <View key={index} style={styles.teamRow}>
              <View style={styles.teamInfo}>
                <Text style={[
                  styles.teamNumber, 
                  isRed ? styles.redTeamText : styles.blueTeamText
                ]}>
                  {isNumber ? `#${team}` : team}
                </Text>
                {!isNumber && displayName !== team && (
                  <Text style={[
                    styles.teamName, 
                    isRed ? styles.redTeamNameText : styles.blueTeamNameText
                  ]}>
                    {displayName}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMatchRow = (match: Match, index: number) => {
    const redWon = match.redScore > match.blueScore;
    const isLastRow = index === matches.length - 1;

    return (
      <View key={index} style={[styles.tableRow, isLastRow && styles.lastRow]}>
        <View style={styles.matchCell}>
          <View style={[
            styles.matchBadge, 
            redWon ? styles.redMatchBadge : styles.blueMatchBadge
          ]}>
            <Text style={[
              styles.matchText, 
              redWon ? styles.redMatchText : styles.blueMatchText
            ]}>
              {match.match}
            </Text>
          </View>
        </View>

        <View style={styles.scoreCell}>
          <View style={styles.scoreContainer}>
            <Text style={[
              styles.scoreNumber,
              redWon ? styles.winningScore : styles.losingScore
            ]}>
              {match.redScore}
            </Text>
            <Text style={styles.scoreDivider}>-</Text>
            <Text style={[
              styles.scoreNumber,
              !redWon ? styles.winningScore : styles.losingScore
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

  // Calculate team stats
  const teamWins = matches.filter(match => {
    const isOnRed = match.redTeams.includes('22') || match.redTeams.includes('100 Scholars');
    const isOnBlue = match.blueTeams.includes('22') || match.blueTeams.includes('100 Scholars');
    
    if (isOnRed) return match.redScore > match.blueScore;
    if (isOnBlue) return match.blueScore > match.redScore;
    return false;
  }).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Douglasville-DCHS League Meet #2</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>COMPLETED</Text>
            </View>
          </View>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.detailIcon}>📅</Text>
              </View>
              <Text style={styles.detailText}>November 23, 2024</Text>
            </View>

            <TouchableOpacity onPress={handleWebsitePress} style={styles.locationRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.detailIcon}>📍</Text>
              </View>
              <Text style={[styles.detailText, styles.linkText]}>
                Douglas County High School, Douglasville, GA
              </Text>
            </TouchableOpacity>
          </View>

          {/* Performance Summary */}
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceTitle}>Team Performance</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>9th Place</Text>
              </View>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Record</Text>
                <Text style={styles.statValue}>{teamWins}-{matches.length - teamWins}-0</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={styles.statValue}>{((teamWins / matches.length) * 100).toFixed(0)}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>OPR</Text>
                <Text style={styles.statValue}>13.07</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>30.20</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Matches Table */}
        <View style={styles.matchesSection}>
          <Text style={styles.sectionTitle}>Match Results</Text>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.matchHeaderCell}>
                <Text style={styles.headerText}>Match</Text>
              </View>
              <View style={styles.scoreHeaderCell}>
                <Text style={styles.headerText}>Final Score</Text>
              </View>
              <View style={styles.allianceHeaderCell}>
                <Text style={styles.headerText}>Red Alliance</Text>
              </View>
              <View style={styles.allianceHeaderCell}>
                <Text style={styles.headerText}>Blue Alliance</Text>
              </View>
            </View>

            {matches.map(renderMatchRow)}
          </View>
        </View>
      </View>
    </ScrollView>
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
    margin: 16,
    borderRadius: 16,
    elevation: 4,
  },
  header: {
    padding: 20,
    backgroundColor: '#FAFBFC',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
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
  rankBadge: {
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
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  matchesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  table: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
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
  lastRow: {
    borderBottomWidth: 0,
  },
  matchHeaderCell: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreHeaderCell: {
    flex: 1.2,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allianceHeaderCell: {
    flex: 2.5,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  matchCell: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  redMatchText: {
    color: '#DC2626',
  },
  blueMatchText: {
    color: '#2563EB',
  },
  scoreCell: {
    flex: 1.2,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  winningScore: {
    color: '#059669',
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
  teamCell: {
    flex: 2.5,
    padding: 12,
    justifyContent: 'center',
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
  teamInfo: {
    flexDirection: 'column',
  },
  teamNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamName: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
    opacity: 0.8,
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

export default EventCard;