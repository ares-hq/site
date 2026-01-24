import { getScoreAdapter } from './utils/adapters';
import { MatchInfo, SupportedYear, TeamInfoSimple } from "./utils/types";

function createTeam(teamData: any, teamNameMap: Map<number, string>): TeamInfoSimple | undefined {
  const teamNumber = teamData?.teamNumber;
  if (!teamNumber || teamNumber === 0) return undefined;
  return {
    teamName: teamNameMap.get(teamNumber) || `Team ${teamNumber}`,
    teamNumber: teamNumber,
  };
}

export function processMatches(
  rawMatches: any[],
  season: SupportedYear,
  teamNameMap: Map<number, string>
): MatchInfo[] {
  return rawMatches.map((match) => {
    const adapter = getScoreAdapter(season);

    // Normalize tournament level
    const tournamentLevelUpper = (match.tournamentLevel || match.matchLevel || '').toUpperCase();
    const isPlayoff = tournamentLevelUpper === 'PLAYOFF' || tournamentLevelUpper === 'FINAL' || 
                     tournamentLevelUpper === 'FINALS' || tournamentLevelUpper === 'SEMIFINAL' || 
                     tournamentLevelUpper === 'QUARTERFINAL';
    const isQualification = tournamentLevelUpper === 'QUALIFICATION';

    // Extract teams from the match.teams array by station
    const allTeams = match.teams || [];
    const redTeams = allTeams.filter((t: any) => t?.station?.toLowerCase?.()?.includes('red')) || [];
    const blueTeams = allTeams.filter((t: any) => t?.station?.toLowerCase?.()?.includes('blue')) || [];

    const [redEndgame, blueEndgame] = isQualification ? adapter.endgamePoints(match) : [0, 0];
    const [redTele, blueTele] = isQualification ? adapter.teleopPoints(match) : [0, 0];

    const redScore = match.scoreRedFinal || 0;
    const blueScore = match.scoreBlueFinal || 0;

    return {
      matchType: isPlayoff ? 'PLAYOFF' : isQualification ? 'QUALIFICATION' : 'PRACTICE',
      matchNumber: isPlayoff
        ? `P-${match.matchSeries || match.series || 'F'}-${match.matchNumber}`
        : isQualification
        ? `Q-${match.matchNumber}`
        : `Pr-${match.matchNumber}`,
      date: match.actualStartTime ?? match.postResultTime,
      redAlliance: {
        totalPoints: redScore,
        auto: match.scoreRedAuto ?? 0,
        tele: redTele,
        endgame: redEndgame,
        penalty: match.scoreRedFoul ?? 0,
        win: redScore > blueScore,
        team_1: createTeam(redTeams[0], teamNameMap),
        team_2: createTeam(redTeams[1], teamNameMap),
        date: match.actualStartTime ?? match.postResultTime,
        alliance: 'red',
        matchType: isPlayoff ? 'PLAYOFF' : isQualification ? 'QUALIFICATION' : 'PRACTICE',
      },
      blueAlliance: {
        totalPoints: blueScore,
        auto: match.scoreBlueAuto ?? 0,
        tele: blueTele,
        endgame: blueEndgame,
        penalty: match.scoreBlueFoul ?? 0,
        win: blueScore > redScore,
        team_1: createTeam(blueTeams[0], teamNameMap),
        team_2: createTeam(blueTeams[1], teamNameMap),
        date: match.actualStartTime ?? match.postResultTime,
        alliance: 'blue',
        matchType: isPlayoff ? 'PLAYOFF' : isQualification ? 'QUALIFICATION' : 'PRACTICE',
      },
    };
  });
}

export function extractTeamNumbers(matches: any[]): Set<number> {
  const teamNumbers = new Set<number>();
  
  matches.forEach((match: any) => {
    // Extract from match.teams array - this is the main source
    if (match.teams && Array.isArray(match.teams)) {
      match.teams.forEach((t: any) => {
        if (t?.teamNumber && t.teamNumber > 0) {
          teamNumbers.add(t.teamNumber);
        }
      });
    }
  });
  
  return teamNumbers;
}