import React, { JSX } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';

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

const EventCard: React.FC = () => {
  const handleWebsitePress = async (): Promise<void> => {
    const url = 'https://www.douglascountyschools.com/robotics';
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const renderTeamCell = (teams: string[], isRed: boolean): JSX.Element => {
    return (
      <View style={[styles.teamCell, isRed ? styles.redAlliance : styles.blueAlliance]}>
        {teams.map((team, index) => (
          <View key={index} style={styles.teamRow}>
            <Text style={[styles.teamNumber, isRed ? styles.redTeamText : styles.blueTeamText]}>
              {team}
            </Text>
            {index < teams.length - 1 && teams.length > 2 && (
              <Text style={[styles.teamName, isRed ? styles.redTeamText : styles.blueTeamText]}>
                {index === 1 ? (team === 'ATOM' ? 'ATOM' : 
                               team === '100 Scholars' ? '100 Scholars' :
                               team === 'Geneton' ? 'Geneton' :
                               team === 'SAE Dragonbots' ? 'SAE Dragonbots' :
                               team === 'Java Beans' ? 'Java Beans' :
                               team === 'Whitefield Robotics' ? 'Whitefield Robotics' :
                               team === 'RoboRibbits' ? 'RoboRibbits' : '') : ''}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderMatchRow = (match: Match, index: number): JSX.Element => {
    const redWon = match.redScore > match.blueScore;
    
    return (
      <View key={index} style={styles.tableRow}>
        <View style={styles.matchCell}>
          <Text style={[styles.matchText, redWon ? styles.redMatchText : styles.blueMatchText]}>
            {match.match}
          </Text>
        </View>
        
        <View style={styles.scoreCell}>
          <Text style={styles.scoreText}>
            <Text style={redWon ? styles.winningScore : styles.normalScore}>{match.redScore}</Text>
            <Text style={styles.scoreDivider}> - </Text>
            <Text style={!redWon ? styles.winningScore : styles.normalScore}>{match.blueScore}</Text>
          </Text>
        </View>
        
        {renderTeamCell(match.redTeams, true)}
        {renderTeamCell(match.blueTeams, false)}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Douglasville-DCHS League meet #2</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>November 23, 2024</Text>
          </View>
          
          <TouchableOpacity onPress={handleWebsitePress}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={[styles.infoText, styles.linkText]}>Douglas County High School, Douglasville, GA, USA</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statText}>9th place (quals)</Text>
            </View>
            
            <Text style={styles.recordText}>W-L-T: 1-4-0</Text>
            <Text style={styles.statsText}>0.40 RP · 13.07 npOPR · 30.20 npAVG</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.matchHeaderCell}>
              <Text style={styles.headerText}>Match</Text>
            </View>
            <View style={styles.scoreHeaderCell}>
              <Text style={styles.headerText}>Score</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#000000',
  },
  linkText: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  statsContainer: {
    marginTop: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statText: {
    fontSize: 16,
    color: '#000000',
  },
  recordText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
    marginLeft: 24,
  },
  statsText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 24,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    minHeight: 60,
  },
  matchHeaderCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  scoreHeaderCell: {
    flex: 1.2,
    padding: 12,
    justifyContent: 'center',
  },
  allianceHeaderCell: {
    flex: 2.5,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  matchCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCell: {
    flex: 1.2,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCell: {
    flex: 2.5,
    padding: 8,
    justifyContent: 'center',
  },
  redAlliance: {
    backgroundColor: '#FEE2E2',
  },
  blueAlliance: {
    backgroundColor: '#DBEAFE',
  },
  matchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  redMatchText: {
    color: '#DC2626',
  },
  blueMatchText: {
    color: '#2563EB',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  winningScore: {
    fontWeight: '700',
  },
  normalScore: {
    fontWeight: '600',
  },
  scoreDivider: {
    color: '#6B7280',
  },
  teamRow: {
    marginBottom: 2,
  },
  teamNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  teamName: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 1,
  },
  redTeamText: {
    color: '#DC2626',
  },
  blueTeamText: {
    color: '#2563EB',
  },
});

export default EventCard;