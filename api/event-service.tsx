import { calculateTeamOPR } from "./algorithms/calcOPR";
import { extractTeamNumbers, processMatches } from "./match-processor";
import { ApiClient } from "./utils/api-client";
import { EventInfo, SupportedYear } from "./utils/types";
import { formatOrdinal } from "./utils/utils";

/**
 * Merges match schedules with detailed score data.
 * Prioritizes score data over schedule data when conflicts occur.
 */
function mergeMatchData(schedule: any[], qualScores: any[], playoffScores: any[]) {
  const matchMap = new Map();
  // Helper to create a truly unique key for playoffs vs quals
  const getMatchKey = (m: any) => {
    const level = m.tournamentLevel || m.matchLevel || 'UNKNOWN';
    const matchNum = m.matchNumber;
    const series = m.series || 0; // Use actual series number for playoffs
    return `${level}-${matchNum}-${series}`;
  };

  schedule.forEach(m => matchMap.set(getMatchKey(m), m));

  [...qualScores, ...playoffScores].forEach(m => {
    const key = getMatchKey(m);
    if (matchMap.has(key)) {
      const existing = matchMap.get(key);
      // Merge the two, ensuring score data from the score-endpoints wins
      matchMap.set(key, { ...existing, ...m });
    }
  });

  return Array.from(matchMap.values());
}
/**
 * Calculates win/loss/tie record and average scores for a specific team.
 */
function calculateTeamStats(matches: any[], team: number) {
  let wins = 0, ties = 0, totalScore = 0;
  const teamMatches = matches.filter(m => m.matchType !== 'PRACTICE');

  teamMatches.forEach(m => {
    const isRed = m.redAlliance.team_1?.teamNumber === team || m.redAlliance.team_2?.teamNumber === team;
    const myScore = isRed ? m.redAlliance.totalPoints : m.blueAlliance.totalPoints;
    const oppScore = isRed ? m.blueAlliance.totalPoints : m.redAlliance.totalPoints;

    if (myScore > oppScore) wins++;
    else if (myScore === oppScore) ties++;
    totalScore += myScore;
  });

  const count = teamMatches.length;
  return {
    winRate: count ? Number(((wins / count) * 100).toFixed(1)) : 0,
    averageScore: count ? Number((totalScore / count).toFixed(2)) : 0,
    record: `${wins}-${count - wins - ties}-${ties}`
  };
}

// --- Main Exported Functions ---

export async function getEventData(eventCode: string, season: SupportedYear): Promise<EventInfo> {
  const api = new ApiClient();
  const [eventRes, matchesRes, qualRes, playoffRes, teamsRes] = await Promise.all([
    api.fetchEvents(season, eventCode),
    api.fetchMatches(season, eventCode),
    api.fetchQualScores(season, eventCode),
    api.fetchPlayoffScores(season, eventCode),
    api.fetchTeams(season, eventCode)
  ]);

  const allMatches = mergeMatchData(
    matchesRes.matches || [], 
    qualRes.matchScores || [], 
    playoffRes.matchScores || []
  );

  const teamNameMap = new Map<number, string>(teamsRes.teams?.map((t: any) => [t.teamNumber as number, t.nameShort as string]));
  const processedMatches = processMatches(allMatches, season, teamNameMap);
  const event = eventRes.events?.[0];

  return {
    name: event?.name || eventCode,
    date: event?.dateStart ? new Date(event.dateStart).toLocaleDateString() : 'Unknown',
    location: `${event?.city}, ${event?.stateprov}`,
    eventCode,
    teamCount: extractTeamNumbers(allMatches).size,
    winRate: 0, OPR: 0, averageScore: 0, place: '', record: '', achievements: '',
    matches: processedMatches,
  };
}

export async function getFirstAPI(events: string[], team: number, season: SupportedYear): Promise<EventInfo[]> {
  const api = new ApiClient();
  
  const results = await Promise.all(events.map(async (code) => {
    const [eventR, rankR, awardR, qualR, playR, matchR, teamR] = await Promise.all([
      api.fetchEvents(season, code),
      api.fetchRankings(season, code, team),
      api.fetchAwards(season, code, team),
      api.fetchQualScores(season, code),
      api.fetchPlayoffScores(season, code),
      api.fetchMatches(season, code),
      api.fetchTeams(season, code)
    ]);

    const allMatches = mergeMatchData(matchR.matches || [], qualR.matchScores || [], playR.matchScores || []);
    const teamNameMap = new Map<number, string>(teamR.teams?.map((t: any) => [t.teamNumber as number, t.nameShort as string]));
    const allProcessed = processMatches(allMatches, season, teamNameMap);
    
    // Filter matches involving the specific team
    const teamMatches = allProcessed.filter(m => 
      [m.redAlliance, m.blueAlliance].some(a => a.team_1?.teamNumber === team || a.team_2?.teamNumber === team)
    );

    const stats = calculateTeamStats(teamMatches, team);
    const opr = calculateTeamOPR(allProcessed.filter(m => m.matchType === 'QUALIFICATION'), team);
    
    console.error(eventR)
    return {
      ...stats,
      OPR: opr,
      name: eventR.events?.[0]?.name,
      date: new Date(eventR.events?.[0]?.dateStart).toDateString(),
      place: formatOrdinal(rankR.rankings?.[0]?.rank),
      achievements: awardR.awards?.map((a: any) => a.name).join(' • ') || 'None',
      matches: teamMatches,
      eventCode: code,
      teamCount: extractTeamNumbers(allMatches).size,
      location: eventR.events?.[0]?.venue
    } as EventInfo;
  }));

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}