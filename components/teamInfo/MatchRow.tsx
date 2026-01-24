import { AllianceInfo, MatchInfo } from '@/api/utils/types';
import { useDarkMode } from '@/context/DarkModeContext';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CaretRight from '../../assets/icons/caret-right.svg';

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
  const [hoveredTeam, setHoveredTeam] = useState<number | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isExpanded = expandedMatch === match.matchNumber;
  const isLastRow = index === totalMatches - 1;
  const isPracticeMatch = match.matchType === 'PRACTICE';

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

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
      ]}
      // @ts-ignore
      pointerEvents="box-none"
    >
          {teams.map((t, index) => {
            const isHighlighted = highlightedTeam === t?.teamNumber;
            const isHoveredTeam = hoveredTeam === t?.teamNumber && !isHighlighted;
            
            const getBgColor = () => {
              if (isHighlighted) {
                return isRedAlliance
                  ? (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.15)')
                  : (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.15)');
              }
              if (isHoveredTeam) {
                return isRedAlliance
                  ? (isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(220, 38, 38, 0.08)')
                  : (isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)');
              }
              return 'transparent';
            };

            return (
              <View key={index} style={[styles.teamRow, isSmallDevice && styles.teamRowSmall]}>
                <View style={styles.teamInfo}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onTeamClick(t?.teamNumber || 0);
                    }}
                    style={{
                      cursor: 'pointer',
                      paddingLeft: 12,
                      paddingRight: 8,
                      paddingVertical: 2,
                      marginLeft: -4,
                      alignSelf: 'flex-start',
                      backgroundColor: getBgColor(),
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                      maxWidth: '100%',
                      overflow: 'hidden',
                    }}
                    // @ts-ignore - Web only props
                    onMouseEnter={() => !isHighlighted && setHoveredTeam(t?.teamNumber || null)}
                    onMouseLeave={() => setHoveredTeam(null)}
                  >
                    <Text
                      style={[
                        styles.teamNumber,
                        { color: isDarkMode ? (isRedAlliance ? '#FCA5A5' : '#93C5FD') : isRedAlliance ? '#DC2626' : '#2563EB' },
                        isSmallDevice && styles.teamNumberSmall,
                        isHighlighted && styles.highlightedTeam
                      ]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {t?.teamName || 'Unknown'}
                    </Text>
                    <Text
                      style={[
                        styles.teamName,
                        { color: isDarkMode ? (isRedAlliance ? '#F87171' : '#60A5FA') : isRedAlliance ? '#B91C1C' : '#1D4ED8' },
                        isSmallDevice && styles.teamNameSmall
                      ]}
                      numberOfLines={1}
                      ellipsizeMode='tail'
                    >
                      {t?.teamNumber}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
          style={[styles.tableRowMobileStacked, { borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB' }, isLastRow && !isExpanded && styles.lastRow, { cursor: 'pointer' }]}
          // @ts-ignore - Web only props
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <View style={[styles.mobileMatchInfo, !isSmallDevice && isHovered && { backgroundColor: hoverColor }]}>
            <Animated.View style={[styles.mobileExpandIndicatorInline, { transform: [{ rotate: rotate }] }]}>
              <CaretRight fill={isDarkMode ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)'} width={14} height={14} />
            </Animated.View>
            <View style={[styles.matchBadge, badgeStyle]}>
              <Text style={[styles.matchText, { color: badgeTextColor }, styles.matchTextSmall]}>{match.matchNumber}</Text>
            </View>
            <View style={styles.mobileScoreDisplay}>
              <Text style={[styles.scoreNumber, match.redAlliance.win ? styles.winningScore : styles.losingScore, styles.scoreNumberSmall]}>{redScore}</Text>
              <Text style={[styles.scoreDivider, { color: isDarkMode ? '#6B7280' : '#9CA3AF' }, styles.scoreDividerSmall]}>-</Text>
              <Text style={[styles.scoreNumber, match.blueAlliance.win ? styles.winningScore : styles.losingScore, styles.scoreNumberSmall]}>{blueScore}</Text>
            </View>
          </View>
          <View style={styles.mobileAllianceContainer}>
            <View style={[styles.mobileAllianceCell, styles.redAlliance, { backgroundColor: isDarkMode ? '#3B1F1F' : '#FEF2F2' }]}>
              {[teamRed.team_1, teamRed.team_2].filter(Boolean).map((t, idx) => {
                const isHighlighted = highlightedTeam === t?.teamNumber;
                const isHoveredTeam = hoveredTeam === t?.teamNumber && !isHighlighted;
                
                const getBgColor = () => {
                  if (isHighlighted) return isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.15)';
                  if (isHoveredTeam) return isDarkMode ? 'rgba(239, 68, 68, 0.12)' : 'rgba(220, 38, 38, 0.08)';
                  return 'transparent';
                };

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onTeamClick(t?.teamNumber || 0);
                    }}
                    style={[
                      styles.mobileTeamContainer,
                      { 
                        cursor: 'pointer', 
                        paddingLeft: 6,
                        paddingRight: 8,
                        paddingVertical: 2,
                        marginLeft: -6,
                        alignSelf: 'flex-start',
                        backgroundColor: getBgColor(),
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4
                      }
                    ]}
                    // @ts-ignore - Web only props
                    onMouseEnter={() => !isHighlighted && setHoveredTeam(t?.teamNumber || null)}
                    onMouseLeave={() => setHoveredTeam(null)}
                  >
                    <View style={{ maxWidth: '100%' }}>
                      <Text style={[styles.mobileTeamText, { color: isDarkMode ? '#FCA5A5' : '#DC2626' }, isHighlighted && styles.highlightedTeam]}>
                        {t?.teamNumber}
                      </Text>
                      <Text style={[styles.mobileTeamName, { color: isDarkMode ? '#F87171' : '#B91C1C' }]} numberOfLines={1} ellipsizeMode='tail'>
                        {t?.teamName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.mobileAllianceCell, styles.blueAlliance, { backgroundColor: isDarkMode ? '#1F2F3F' : '#EFF6FF' }]}>
              {[teamBlue.team_1, teamBlue.team_2].filter(Boolean).map((t, idx) => {
                const isHighlighted = highlightedTeam === t?.teamNumber;
                const isHoveredTeam = hoveredTeam === t?.teamNumber && !isHighlighted;
                
                const getBgColor = () => {
                  if (isHighlighted) return isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.15)';
                  if (isHoveredTeam) return isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)';
                  return 'transparent';
                };

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onTeamClick(t?.teamNumber || 0);
                    }}
                    style={[
                      styles.mobileTeamContainer,
                      { 
                        cursor: 'pointer', 
                        paddingLeft: 6,
                        paddingRight: 8,
                        paddingVertical: 2,
                        marginLeft: -6,
                        alignSelf: 'flex-start',
                        backgroundColor: getBgColor(),
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4
                      }
                    ]}
                    // @ts-ignore - Web only props
                    onMouseEnter={() => !isHighlighted && setHoveredTeam(t?.teamNumber || null)}
                    onMouseLeave={() => setHoveredTeam(null)}
                  >
                    <View style={{ maxWidth: '100%' }}>
                      <Text style={[styles.mobileTeamText, { color: isDarkMode ? '#93C5FD' : '#2563EB' }, isHighlighted && styles.highlightedTeam]}>
                        {t?.teamNumber}
                      </Text>
                      <Text style={[styles.mobileTeamName, { color: isDarkMode ? '#60A5FA' : '#1D4ED8' }]} numberOfLines={1} ellipsizeMode='tail'>
                        {t?.teamName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
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
          isSmallDevice && styles.tableRowSmall,
          { cursor: 'pointer' }
        ]}
        // @ts-ignore - Web only props
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Animated.View style={[styles.expandIndicator, { transform: [{ rotate: rotate }] }]}>
          <CaretRight fill={isDarkMode ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.6)'} width={12} height={12} />
        </Animated.View>
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
};

const styles = StyleSheet.create({
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    alignItems: 'stretch',
    position: 'relative',
  },
  tableRowSmall: {
    minHeight: 0,
  },
  tableRowMobileStacked: {
    borderBottomWidth: 1,
    padding: 8,
    position: 'relative',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  matchCell: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCellSmall: {
    flex: 0.8,
    minWidth: 0,
    padding: 1,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 0.3,
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
    fontSize: 12,
    fontWeight: '600',
  },
  matchTextSmall: {
    fontSize: 9,
  },
  scoreCell: {
    flex: 1.2,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCellSmall: {
    flex: 1,
    minWidth: 0,
    padding: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 15,
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
    fontSize: 14,
    marginHorizontal: 8,
  },
  scoreDividerSmall: {
    fontSize: 11,
    marginHorizontal: 4,
  },
  teamCell: {
    flex: 2.5,
    padding: 4,
    justifyContent: 'center',
  },
  teamCellSmall: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    padding: 1,
  },
  redAlliance: {
    borderLeftWidth: 1,
    borderLeftColor: '#EF4444',
  },
  blueAlliance: {
    borderLeftWidth: 1,
    borderLeftColor: '#3B82F6',
  },
  teamRow: {
    marginBottom: 8,
  },
  teamRowSmall: {
    marginBottom: 3,
  },
  teamInfo: {
    flexDirection: 'column',
  },
  teamContainer: {
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginHorizontal: -2,
    marginVertical: -2,
  },
  teamNumber: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '100%',
  },
  teamNumberSmall: {
    fontSize: 8,
    maxWidth: '100%',
  },
  teamName: {
    fontSize: 10,
    marginTop: 1,
    maxWidth: '100%',
  },
  teamNameSmall: {
    fontSize: 6,
    marginTop: 0,
    maxWidth: '100%',
  },
  highlightedTeam: {
    fontWeight: '600',
  },
  mobileMatchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mobileScoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  mobileAllianceContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  mobileAllianceCell: {
    flex: 1,
    padding: 6,
    borderLeftWidth: 1,
  },
  mobileTeamText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mobileTeamContainer: {
    borderRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginBottom: 2,
    maxWidth: '100%',
  },
  expandIndicator: {
    width: 20,
    height: 20,
    position: 'absolute',
    left: 5,
    top: '50%',
    marginTop: -10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  mobileExpandIndicator: {
    width: 20,
    height: 20,
    position: 'absolute',
    left: 4,
    top: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  mobileExpandIndicatorInline: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  mobileTeamName: {
    fontSize: 9,
    fontWeight: '400',
    marginTop: 1,
    maxWidth: '100%',
  },
});
