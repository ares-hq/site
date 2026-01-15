import { AllianceInfo, MatchInfo } from '@/api/types';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MatchRowProps {
  match: MatchInfo;
  index: number;
  totalMatches: number;
  isSmallDevice: boolean;
  expandedMatch: string | null;
  highlightedTeam: number | null;
  onMatchClick: (matchNumber: string, match: MatchInfo) => void;
  onTeamClick: (teamNumber: number) => void;
  renderScoreBreakdown: (match: MatchInfo) => React.ReactNode;
}

export default function MatchRow({
  match,
  index,
  totalMatches,
  isSmallDevice,
  expandedMatch,
  highlightedTeam,
  onMatchClick,
  onTeamClick,
  renderScoreBreakdown,
}: MatchRowProps) {
  const { isDarkMode } = useDarkMode();
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = expandedMatch === match.matchNumber;
  const isLastRow = index === totalMatches - 1;

  const teamRed = match.redAlliance;
  const teamBlue = match.blueAlliance;
  const redScore = match.redAlliance.totalPoints ?? '--';
  const blueScore = match.blueAlliance.totalPoints ?? '--';

  const hoverColor = isDarkMode
    ? (match.redAlliance.win
        ? 'rgba(220, 38, 38, 0.15)'  // Subtle red for dark mode
        : 'rgba(37, 99, 235, 0.15)') // Subtle blue for dark mode
    : (match.redAlliance.win
        ? 'rgba(254, 226, 226, 0.4)'  // Light red for light mode
        : 'rgba(219, 234, 254, 0.4)'); // Light blue for light mode

  const renderTeamCell = (team: AllianceInfo | undefined, isHovered: boolean = false) => {
    if (!team) return null;
    const isRedAlliance = team.alliance === 'red';
    const teams = [team.team_1, team.team_2].filter(Boolean);

    const baseColor = isRedAlliance
      ? (isDarkMode ? '#3B1F1F' : '#FEF2F2')
      : (isDarkMode ? '#1F2F3F' : '#EFF6FF');

    const teamHoverColor = isRedAlliance
      ? (isDarkMode ? '#4B2626' : '#FEE2E2')
      : (isDarkMode ? '#2A3F54' : '#DBEAFE');

    return (
      <View style={[
        styles.teamCell,
        isRedAlliance
          ? [styles.redAlliance, { backgroundColor: isHovered ? teamHoverColor : baseColor }]
          : [styles.blueAlliance, { backgroundColor: isHovered ? teamHoverColor : baseColor }],
        isSmallDevice && styles.teamCellSmall
      ]}>
        {teams.map((t, index) => (
          <View key={index} style={[styles.teamRow, isSmallDevice && styles.teamRowSmall]}>
            <View style={styles.teamInfo}>
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onTeamClick(t?.teamNumber || 0);
                }}
                style={[
                  styles.teamContainer,
                  highlightedTeam === t?.teamNumber && {
                    backgroundColor: isRedAlliance
                      ? (isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.2)')
                      : (isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)')
                  }
                ]}
              >
                <Text
                  style={[
                    styles.teamNumber,
                    { color: isDarkMode ? (isRedAlliance ? '#FCA5A5' : '#93C5FD') : isRedAlliance ? '#DC2626' : '#2563EB' },
                    isSmallDevice && styles.teamNumberSmall,
                    highlightedTeam === t?.teamNumber && styles.highlightedTeam
                  ]}
                  numberOfLines={1}
                >
                  Team {t?.teamNumber}
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.teamName,
                  { color: isDarkMode ? (isRedAlliance ? '#F87171' : '#60A5FA') : isRedAlliance ? '#B91C1C' : '#1D4ED8' },
                  isSmallDevice && styles.teamNameSmall
                ]}
                numberOfLines={1}
              >
                {t?.teamName || 'Unknown'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Check if it's any type of playoff match (not QUALIFICATION or PRACTICE)
  const isMatchTypePlayoff = match.matchType && match.matchType !== 'QUALIFICATION' && match.matchType !== 'PRACTICE';
  const badgeStyle = match.redAlliance.win
    ? [styles.redMatchBadge, { backgroundColor: isDarkMode ? '#3B1F1F' : '#FEE2E2', borderColor: isDarkMode ? '#991B1B' : '#FECACA' }]
    : [styles.blueMatchBadge, { backgroundColor: isDarkMode ? '#1F2F3F' : '#DBEAFE', borderColor: isDarkMode ? '#1E40AF' : '#BFDBFE' }];
  const badgeTextColor = match.redAlliance.win
    ? (isDarkMode ? '#FCA5A5' : '#DC2626')
    : (isDarkMode ? '#93C5FD' : '#2563EB');

  // Mobile layout: stacked
  if (isSmallDevice) {
    return (
      <View key={index}>
        <TouchableOpacity
          onPress={() => onMatchClick(match.matchNumber, match)}
          style={[styles.tableRowMobileStacked, { borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }, isLastRow && !isExpanded && styles.lastRow]}
          // @ts-ignore - Web only props
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <View style={[styles.mobileMatchInfo, !isSmallDevice && isHovered && { backgroundColor: hoverColor }]}>
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
              <TouchableOpacity
                key={idx}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onTeamClick(t?.teamNumber || 0);
                }}
                style={[
                  styles.mobileTeamContainer,
                  highlightedTeam === t?.teamNumber && {
                    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.2)'
                  }
                ]}
              >
                <Text style={[styles.mobileTeamText, { color: isDarkMode ? '#FCA5A5' : '#DC2626' }, highlightedTeam === t?.teamNumber && styles.highlightedTeam]} numberOfLines={1}>
                  <Text style={{ fontWeight: '700' }}>{t?.teamNumber}</Text> • {t?.teamName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.mobileAllianceCell, styles.blueAlliance, { backgroundColor: isDarkMode ? '#1F2F3F' : '#EFF6FF' }]}>
            {[teamBlue.team_1, teamBlue.team_2].filter(Boolean).map((t, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onTeamClick(t?.teamNumber || 0);
                }}
                style={[
                  styles.mobileTeamContainer,
                  highlightedTeam === t?.teamNumber && {
                    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.2)'
                  }
                ]}
              >
                <Text style={[styles.mobileTeamText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }, highlightedTeam === t?.teamNumber && styles.highlightedTeam]} numberOfLines={1}>
                  <Text style={{ fontWeight: '800' }}>{t?.teamNumber}</Text> • {t?.teamName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
        {isExpanded && renderScoreBreakdown(match)}
      </View>
    );
  }

  // Desktop layout: horizontal
  return (
    <View key={index}>
      <TouchableOpacity
        onPress={() => onMatchClick(match.matchNumber, match)}
        style={[
          styles.tableRow,
          { borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' },
          isLastRow && !isExpanded && styles.lastRow,
          isSmallDevice && styles.tableRowSmall
        ]}
        // @ts-ignore - Web only props
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <View style={[styles.matchCell, isSmallDevice && styles.matchCellSmall, isHovered && { backgroundColor: hoverColor }]}>
          <View style={[styles.matchBadge, badgeStyle]}>
            <Text style={[styles.matchText, { color: badgeTextColor }, isSmallDevice && styles.matchTextSmall]}>{match.matchNumber}</Text>
          </View>
        </View>
        <View style={[styles.scoreCell, isSmallDevice && styles.scoreCellSmall, isHovered && { backgroundColor: hoverColor }]}>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreNumber, match.redAlliance.win ? styles.winningScore : styles.losingScore, isSmallDevice && styles.scoreNumberSmall]}>{redScore}</Text>
            <Text style={[styles.scoreDivider, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }, isSmallDevice && styles.scoreDividerSmall]}>-</Text>
            <Text style={[styles.scoreNumber, match.blueAlliance.win ? styles.winningScore : styles.losingScore, isSmallDevice && styles.scoreNumberSmall]}>{blueScore}</Text>
          </View>
        </View>
        {renderTeamCell(teamRed, isHovered)}
        {renderTeamCell(teamBlue, isHovered)}
      </TouchableOpacity>
      {isExpanded && renderScoreBreakdown(match)}
    </View>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'stretch',
  },
  tableRowSmall: {
    minHeight: 0,
  },
  tableRowMobileStacked: {
    borderBottomWidth: 1,
    padding: 8,
  },
  lastRow: {
    borderBottomWidth: 0,
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
    marginBottom: 12,
  },
  teamRowSmall: {
    marginBottom: 6,
  },
  teamInfo: {
    flexDirection: 'column',
  },
  teamContainer: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: -4,
    marginVertical: -2,
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
  highlightedTeam: {
    fontWeight: '600',
  },
  mobileMatchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileAllianceCell: {
    padding: 8,
    borderLeftWidth: 4,
    marginBottom: 6,
  },
  mobileTeamText: {
    fontSize: 11,
    fontWeight: '500',
  },
  mobileTeamContainer: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 2,
  },
});
