import { calculateTeamOPR } from "./algorithms/calcOPR";
import { extractTeamNumbers, processMatches } from "./match-processor";
import { ApiClient } from "./utils/api-client";
import { EventInfo, SupportedYear } from "./utils/types";
import { formatOrdinal } from "./utils/utils";

export async function getEventData(eventCode: string, season: SupportedYear): Promise<EventInfo> {
  try {
    const apiClient = new ApiClient();
    const [eventRes, qualScoresRes, playoffScoresRes] = await Promise.all([
      apiClient.fetchEvents(season, eventCode),
      apiClient.fetchQualScores(season, eventCode),
      apiClient.fetchPlayoffScores(season, eventCode),
    ]);

    const eventData = eventRes.events?.[0];
    const allMatches = [...(qualScoresRes.matchScores || []), ...(playoffScoresRes.matchScores || [])];
    
    const teamNumbers = extractTeamNumbers(allMatches);
    const teamsRes = await apiClient.fetchTeams(season, eventCode);
    const teamNameMap = new Map<number, string>(teamsRes.teams?.map((t: any) => [t.teamNumber, t.nameShort || `Team ${t.teamNumber}`]) || []);
    const matches = processMatches(allMatches, season, teamNameMap);

    return {
      date: eventData?.dateStart
        ? new Date(eventData.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Unknown',
      location: `${eventData?.address || ''}, ${eventData?.city || ''}, ${eventData?.stateprov || ''}`.replace(/^,\s*|,\s*$/g, ''),
      name: eventData?.name ?? eventCode,
      eventCode,
      teamCount: teamNumbers.size,
      winRate: 0,
      achievements: 'No Awards Received',
      OPR: 0,
      averageScore: 0,
      place: '',
      record: '',
      matches,
    };
  } catch (error) {
    console.error(`Error fetching event ${eventCode} for season ${season}:`, error);
    throw error;
  }
}

export async function getFirstAPI(events: string[], team: number, season: SupportedYear): Promise<EventInfo[]> {
  const results = await Promise.all(
    events.map(async (eventCode) => {
      try {
        const apiClient = new ApiClient();
        const [eventRes, rankingRes, awardsRes, qualScoresRes, playoffScoresRes, matchesRes, teams] = await Promise.all([
          apiClient.fetchEvents(season, eventCode),
          apiClient.fetchRankings(season, eventCode, team),
          apiClient.fetchAwards(season, eventCode, team),
          apiClient.fetchQualScores(season, eventCode),
          apiClient.fetchPlayoffScores(season, eventCode),
          apiClient.fetchMatches(season, eventCode),
          apiClient.fetchTeams(season, eventCode)
        ]);

        const eventData = eventRes.events?.[0];
        const rankData = rankingRes.rankings?.[0];
        const awardData = awardsRes.awards;
        
        // Get matches from all sources, ensuring they're arrays
        const fetchedMatches = Array.isArray(matchesRes) ? matchesRes : (matchesRes?.matches || []);
        const qualMatches = Array.isArray(qualScoresRes) ? qualScoresRes : (qualScoresRes?.matchScores || []);
        const playoffMatches = Array.isArray(playoffScoresRes) ? playoffScoresRes : (playoffScoresRes?.matchScores || []);
        
        // Combine all matches - filter out any duplicates by match ID
        const matchMap = new Map();
        [...fetchedMatches, ...qualMatches, ...playoffMatches].forEach((match: any) => {
          const key = `${match.matchNumber}-${match.tournamentLevel || match.matchLevel}`;
          if (!matchMap.has(key)) {
            matchMap.set(key, match);
          }
        });
        const allMatches = Array.from(matchMap.values());

        if (!eventData || !rankData) {
          throw new Error(`Missing data for event ${eventCode}`);
        }

        const teamNumbers = extractTeamNumbers(allMatches);
        const teamNameMap = new Map<number, string>(teams.teams?.map((t: any) => [t.teamNumber, t.nameShort || `Team ${t.teamNumber}`]) || []);
        const allProcessedMatches = processMatches(allMatches, season, teamNameMap);
        
        const matches = allProcessedMatches.filter((match: any) => 
          match.redAlliance.team_1?.teamNumber === team || match.redAlliance.team_2?.teamNumber === team ||
          match.blueAlliance.team_1?.teamNumber === team || match.blueAlliance.team_2?.teamNumber === team
        );
        
        const qualificationMatches = allMatches.filter((match: any) => 
          match.tournamentLevel === "QUALIFICATION"
        );

        const practiceMatches = allMatches.filter((match: any) => 
          match.tournamentLevel === "PRACTICE"
        );

        // Calculate stats
        let winCount = 0, tieCount = 0, totalScore = 0;
        const teamSet = new Set<number>();
        const nonPracticeMatches = matches.filter(m => m.matchType !== 'PRACTICE');

        for (const match of nonPracticeMatches) {
          const teamInRed = match.redAlliance.team_1?.teamNumber === team || match.redAlliance.team_2?.teamNumber === team;
          const teamInBlue = match.blueAlliance.team_1?.teamNumber === team || match.blueAlliance.team_2?.teamNumber === team;

          if (match.redAlliance.totalPoints === match.blueAlliance.totalPoints) {
            tieCount++;
          } else if (
            (teamInRed && match.redAlliance.totalPoints > match.blueAlliance.totalPoints) ||
            (teamInBlue && match.blueAlliance.totalPoints > match.redAlliance.totalPoints)
          ) {
            winCount++;
          }

          totalScore += teamInRed ? match.redAlliance.totalPoints : match.blueAlliance.totalPoints;
          [match.redAlliance.team_1, match.redAlliance.team_2, match.blueAlliance.team_1, match.blueAlliance.team_2]
            .forEach(t => t?.teamNumber && teamSet.add(t.teamNumber));
        }

        const totalMatches = nonPracticeMatches.length;
        const lossCount = totalMatches - winCount - tieCount;
        const averageScore = totalMatches ? Number((totalScore / totalMatches).toFixed(2)) : 0;
        const winRate = totalMatches ? Number(((winCount / totalMatches) * 100).toFixed(1)) : 0;

        // Calculate OPR for the specific team using only qualification matches
        const qualProcessedMatches = allProcessedMatches.filter(match => match.matchType === 'QUALIFICATION');
        const teamOPR = calculateTeamOPR(qualProcessedMatches, team);

        return {
          date: eventData.dateStart
            ? new Date(eventData.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'Unknown',
          location: `${eventData.address || ''}, ${eventData.city || ''}, ${eventData.stateprov || ''}`.replace(/^,\s*|,\s*$/g, ''),
          name: eventData.name ?? eventCode,
          eventCode,
          teamCount: teamSet.size,
          winRate,
          achievements: awardData?.length ? awardData.map((a: any) => a.name).filter(Boolean).join(' • ') : 'No Awards Received',
          OPR: teamOPR,
          averageScore,
          place: formatOrdinal(rankData.rank),
          record: `${winCount}-${lossCount}-${tieCount}`,
          matches,
        };
      } catch (error) {
        console.error(`Error processing event ${eventCode}:`, error);
        throw error;
      }
    })
  );

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAllEventsForTeamInSeason(team: number, season: SupportedYear): Promise<EventInfo[]> {
  try {
    const apiClient = new ApiClient();
    const teamEventsRes = await apiClient.fetchTeamEvents(season, team);
    const eventCodes = teamEventsRes.events?.map((event: any) => event.code) || [];
    
    if (eventCodes.length === 0) return [];
    return await getFirstAPI(eventCodes, team, season);
  } catch (error) {
    console.error(`Error fetching all events for team ${team}:`, error);
    return [];
  }
}