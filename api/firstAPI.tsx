import { calculateTeamOPR } from './calcOPR';
import { fetchTeamName, SupportedYear } from './dashboardInfo';
import { EventInfo, MatchInfo, TeamInfoSimple } from './types';

// Re-export SupportedYear for convenience
export type { SupportedYear };

// ------------------- YEAR ADAPTERS -------------------

interface ScoreAdapter {
  endgamePoints(match: any): [number, number]; // [red, blue]
  penalties(match: any): [number, number]; // [red, blue]
  teleopPoints(match: any): [number, number]; // [red, blue]
  mapMatches?(rawMatches: any[]): any[];
}

class DefaultModernAdapter implements ScoreAdapter {
  /**
   * Seasons exposing teleop park/ascent and 'foulPointsCommitted' per alliance.
   */
  endgamePoints(match: any): [number, number] {
    const red = (match.alliances?.[1]?.teleopParkPoints || 0) + (match.alliances?.[1]?.teleopAscentPoints || 0);
    const blue = (match.alliances?.[0]?.teleopParkPoints || 0) + (match.alliances?.[0]?.teleopAscentPoints || 0);
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.foulPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.foulPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Skystone2019Adapter implements ScoreAdapter {
  /**
   * 2019 exposes: parkingPoints, capstonePoints, penaltyPoints, totalPoints, autonomousPoints, etc.
   */
  endgamePoints(match: any): [number, number] {
    const red = (match.alliances?.[1]?.parkingPoints || 0) + (match.alliances?.[1]?.capstonePoints || 0);
    const blue = (match.alliances?.[0]?.parkingPoints || 0) + (match.alliances?.[0]?.capstonePoints || 0);
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPoints || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPoints || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class UltimateGoal2020Adapter implements ScoreAdapter {
  /**
   * 2020 exposes: endgamePoints, penaltyPoints, totalPoints, autonomousPoints, etc.
   */
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPoints || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPoints || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class FreightFrenzy2021Adapter implements ScoreAdapter {
  /**
   * 2021 exposes: endgamePoints, penaltyPoints, totalPoints, autonomousPoints, etc.
   */
  endgamePoints(match: any): [number, number] {
    if (match.alliances) {
      const red = match.alliances[1]?.endgamePoints || 0;
      const blue = match.alliances[0]?.endgamePoints || 0;
      return [red, blue];
    }
    return [0, 0];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPoints || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPoints || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Powerplay2022Adapter implements ScoreAdapter {
  /**
   * 2022 exposes: endgamePoints, penaltyPointsCommitted, totalPoints, autonomousPoints, etc.
   */
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Centerstage2023Adapter implements ScoreAdapter {
  /**
   * 2023 exposes: endgamePoints, penaltyPointsCommitted, totalPoints, autonomousPoints, etc.
   */
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class IntoTheDeep2024Adapter implements ScoreAdapter {
  /**
   * Seasons exposing teleop park/ascent and 'foulPointsCommitted' per alliance.
   */
  endgamePoints(match: any): [number, number] {
    const red = (match.alliances?.[1]?.teleopParkPoints || 0) + (match.alliances?.[1]?.teleopAscentPoints || 0);
    const blue = (match.alliances?.[0]?.teleopParkPoints || 0) + (match.alliances?.[0]?.teleopAscentPoints || 0);
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.foulPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.foulPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Decode2025Adapter implements ScoreAdapter {
  /**
   * 2025 exposes: endgamePoints, foulPointsCommitted, totalPoints, autonomousPoints, etc.
   */
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.foulPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.foulPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

const SCORE_ADAPTERS: Record<SupportedYear, ScoreAdapter> = {
  2019: new Skystone2019Adapter(),
  2020: new UltimateGoal2020Adapter(),
  2021: new FreightFrenzy2021Adapter(),
  2022: new Powerplay2022Adapter(),
  2023: new Centerstage2023Adapter(),
  2024: new IntoTheDeep2024Adapter(),
  2025: new Decode2025Adapter(),
};

const DEFAULT_SCORE_ADAPTER: ScoreAdapter = new DefaultModernAdapter();

function getScoreAdapter(year: SupportedYear): ScoreAdapter {
  return SCORE_ADAPTERS[year] || DEFAULT_SCORE_ADAPTER;
}

function formatOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

async function batchFetchTeamNames(teamNumbers: number[], year: SupportedYear): Promise<Map<number, string>> {
  const uniqueTeams = [...new Set(teamNumbers)];
  const teamNamePromises = uniqueTeams.map(async (teamNum) => {
    try {
      const name = await fetchTeamName(teamNum, year);
      return [teamNum, name || 'none'] as const;
    } catch {
      return [teamNum, 'none'] as const;
    }
  });
  
  const results = await Promise.all(teamNamePromises);
  return new Map(results);
}

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
    }
  }
}

export const getFirstAPI = async (events: string[], team: number, season: SupportedYear): Promise<EventInfo[]> => {
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const headers = { apikey: supabaseAnonKey };

  console.log(`Fetching FIRST API data for team ${team}, season ${season}, events:`, events);

  const results = await Promise.all(events.map(async (eventCode) => {
    try {
      const [eventRes, rankingRes, awardsRes, matchRes] = await Promise.all([
        fetchWithRetry(`https://api.ares-bot.com/functions/v1/first/${season}/events?eventCode=${eventCode}`, headers),
        fetchWithRetry(`https://api.ares-bot.com/functions/v1/first/${season}/rankings/${eventCode}?teamNumber=${team}`, headers),
        fetchWithRetry(`https://api.ares-bot.com/functions/v1/first/${season}/awards/${team}?eventCode=${eventCode}`, headers),
        fetchWithRetry(`https://api.ares-bot.com/functions/v1/first/${season}/matches/${eventCode}`, headers)
      ]);

      const eventData = eventRes.events?.[0];
      const rankData = rankingRes.rankings?.[0];
      const awardData = awardsRes.awards;
      const allMatches = matchRes.matches || [];

      if (!eventData || !rankData) {
        throw new Error(`Missing data for event ${eventCode} in ${season}`);
      }

      const teamMatches = allMatches.filter((match: any) => 
        match.teams.some((t: any) => t.teamNumber === team)
      );
      
      const qualificationMatches = allMatches.filter((match: any) => 
        match.tournamentLevel === "QUALIFICATION"
      );

      const practiceMatches = allMatches.filter((match: any) => 
        match.tournamentLevel === "PRACTICE"
      );

      const allTeamNumbers = new Set<number>();
      teamMatches.forEach((match: any) => {
        match.teams.forEach((t: any) => {
          if (t?.teamNumber) allTeamNumbers.add(t.teamNumber);
        });
      });

      const teamNameMap = await batchFetchTeamNames([...allTeamNumbers], season);

      const createTeam = (teamData: any): TeamInfoSimple => ({
        teamName: teamNameMap.get(teamData?.teamNumber) || 'none',
        teamNumber: teamData?.teamNumber || 0,
      });

      const matches: MatchInfo[] = teamMatches.map((match: any): MatchInfo => {
        const redTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('red'));
        const blueTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('blue'));

        const redScore = match.scoreRedFinal || 0;
        const blueScore = match.scoreBlueFinal || 0;

        // Use the year-specific adapter
        const adapter = getScoreAdapter(season);
        const [redTelePoints, blueTelePoints] = adapter.teleopPoints(match);
        const [redPenaltyPoints, bluePenaltyPoints] = adapter.penalties(match);

        // Normalize tournamentLevel for case-insensitive comparison
        const tournamentLevelUpper = (match.tournamentLevel || '').toUpperCase();
        const isPlayoff = tournamentLevelUpper === 'PLAYOFF' || tournamentLevelUpper === 'FINAL' || tournamentLevelUpper === 'FINALS' || tournamentLevelUpper === 'SEMIFINAL' || tournamentLevelUpper === 'QUARTERFINAL';
        const isQualification = tournamentLevelUpper === 'QUALIFICATION';

        return {
          matchType: isPlayoff ? 'PLAYOFF' : isQualification ? 'QUALIFICATION' : 'PRACTICE',
          matchNumber: isPlayoff ? 'P-' + match.series + '-' + match.matchNumber : isQualification ? 'Q-' + match.matchNumber : 'Pr-' + match.matchNumber,
          date: match.actualStartTime ?? match.postResultTime,
          redAlliance: {
            totalPoints: redScore,
            tele: redTelePoints,
            penalty: redPenaltyPoints,
            win: redScore > blueScore,
            team_1: createTeam(redTeams[0]),
            team_2: createTeam(redTeams[1]),
            date: match.actualStartTime ?? match.postResultTime,
            alliance: 'red',
            matchType: isPlayoff ? 'PLAYOFF' : isQualification ? 'QUALIFICATION' : 'PRACTICE'
          },
          blueAlliance: {
            totalPoints: blueScore,
            tele: blueTelePoints,
            penalty: bluePenaltyPoints,
            win: blueScore > redScore,
            team_1: createTeam(blueTeams[0]),
            team_2: createTeam(blueTeams[1]),
            date: match.actualStartTime ?? match.postResultTime,
            alliance: 'blue',
            matchType: isPlayoff ? 'PLAYOFF' : isQualification ? 'QUALIFICATION' : 'PRACTICE'
          },
        };
      });

      const allMatchesForOPR: MatchInfo[] = qualificationMatches.map((match: any): MatchInfo => {
        const redTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('red'));
        const blueTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('blue'));

        const redScore = match.scoreRedFinal || 0;
        const blueScore = match.scoreBlueFinal || 0;

        const createTeamForOPR = (teamData: any): TeamInfoSimple => ({
          teamName: teamData?.teamName || teamNameMap.get(teamData?.teamNumber) || 'none',
          teamNumber: teamData?.teamNumber || 0,
        });

        return {
          matchType: 'QUALIFICATION',
          matchNumber: 'Q-' + match.matchNumber,
          date: match.actualStartTime ?? match.postResultTime,
          redAlliance: {
            totalPoints: redScore,
            tele: Math.max(0, redScore - (match.scoreRedAuto || 0)),
            penalty: match.scoreRedFoul || 0,
            win: redScore > blueScore,
            team_1: createTeamForOPR(redTeams[0]),
            team_2: createTeamForOPR(redTeams[1]),
            date: match.actualStartTime ?? match.postResultTime,
            alliance: 'red',
            matchType: 'QUALIFICATION',
          },
          blueAlliance: {
            totalPoints: blueScore,
            tele: Math.max(0, blueScore - (match.scoreBlueAuto || 0)),
            penalty: match.scoreBlueFoul || 0,
            win: blueScore > redScore,
            team_1: createTeamForOPR(blueTeams[0]),
            team_2: createTeamForOPR(blueTeams[1]),
            date: match.actualStartTime ?? match.postResultTime,
            alliance: 'blue',
            matchType: 'QUALIFICATION',
          },
        };
      });

      let winCount = 0, tieCount = 0, totalScore = 0;
      const teamSet = new Set<number>();
      
      // Exclude practice matches from win rate calculation
      const nonPracticeMatches = matches.filter(m => m.matchType !== 'PRACTICE');

      for (const match of nonPracticeMatches) {
        const { redAlliance, blueAlliance } = match;
        const redScore = redAlliance.totalPoints;
        const blueScore = blueAlliance.totalPoints;

        const teamInRed = redAlliance.team_1?.teamNumber === team || redAlliance.team_2?.teamNumber === team;
        const teamInBlue = blueAlliance.team_1?.teamNumber === team || blueAlliance.team_2?.teamNumber === team;

        if (redScore === blueScore) {
          tieCount++;
        } else if ((teamInRed && redScore > blueScore) || (teamInBlue && blueScore > redScore)) {
          winCount++;
        }

        totalScore += teamInRed ? redScore : blueScore;

        [redAlliance.team_1, redAlliance.team_2, blueAlliance.team_1, blueAlliance.team_2]
          .forEach(t => t?.teamNumber && teamSet.add(t.teamNumber));
      }

      const totalMatches = nonPracticeMatches.length;
      const lossCount = totalMatches - winCount - tieCount;
      const averageScore = nonPracticeMatches.length ? Number((totalScore / nonPracticeMatches.length).toFixed(2)) : 0;
      const winRate = totalMatches ? Number(((winCount / totalMatches) * 100).toFixed(1)) : 0;

      const oprResults = calculateTeamOPR(allMatchesForOPR, team);

      const eventInfo: EventInfo = {
        date: eventData.dateStart
          ? new Date(eventData.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Unknown',
        location: `${eventData.address || ''}, ${eventData.city || ''}, ${eventData.stateprov || ''}`.replace(/^,\s*|,\s*$/g, ''),
        name: eventData.name ?? eventCode,
        eventCode: eventCode,
        teamCount: teamSet.size,
        winRate,
        achievements: awardData?.length
          ? awardData.map((a: any) => a.name).filter(Boolean).join(' • ')
          : 'No Awards Received',
        OPR: oprResults || 0,
        averageScore,
        place: formatOrdinal(rankData.rank),
        record: `${winCount}-${lossCount}-${tieCount}`,
        matches,
      };

      return eventInfo;
    } catch (error) {
      console.error(`Error processing event ${eventCode} for season ${season}:`, error);
      throw error;
    }
  }));

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Multi-year utility functions

/**
 * Get event info for a team across multiple seasons
 */
export const getFirstAPIMultiYear = async (
  events: string[], 
  team: number, 
  seasons: SupportedYear[]
): Promise<Map<SupportedYear, EventInfo[]>> => {
  const results = new Map<SupportedYear, EventInfo[]>();
  
  await Promise.all(
    seasons.map(async (season) => {
      try {
        const eventData = await getFirstAPI(events, team, season);
        results.set(season, eventData);
      } catch (error) {
        console.warn(`Failed to fetch FIRST API data for team ${team} in season ${season}:`, error);
        results.set(season, []);
      }
    })
  );
  
  return results;
};

/**
 * Get all events for a team in a specific season
 */
export const getAllEventsForTeamInSeason = async (
  team: number, 
  season: SupportedYear
): Promise<EventInfo[]> => {
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const headers = { apikey: supabaseAnonKey };
  
  try {
    // First, get all events the team participated in for this season
    const teamEventsRes = await fetchWithRetry(
      `https://api.ares-bot.com/functions/v1/first/${season}/teams/${team}/events`, 
      headers
    );
    
    const eventCodes = teamEventsRes.events?.map((event: any) => event.code) || [];
    
    if (eventCodes.length === 0) {
      return [];
    }
    
    return await getFirstAPI(eventCodes, team, season);
  } catch (error) {
    console.error(`Error fetching all events for team ${team} in season ${season}:`, error);
    return [];
  }
};

/**
 * Compare team performance across seasons
 */
export interface SeasonPerformanceSummary {
  season: SupportedYear;
  eventsAttended: number;
  totalMatches: number;
  averageWinRate: number;
  averageOPR: number;
  averageScore: number;
  totalAwards: number;
  bestRanking: number;
  events: EventInfo[];
}

export const getTeamSeasonSummaries = async (
  team: number, 
  seasons: SupportedYear[],
  events?: string[]
): Promise<SeasonPerformanceSummary[]> => {
  const summaries: SeasonPerformanceSummary[] = [];
  
  await Promise.all(
    seasons.map(async (season) => {
      try {
        let eventData: EventInfo[] = [];
        
        if (events && events.length > 0) {
          // Use provided events
          eventData = await getFirstAPI(events, team, season);
        } else {
          // Get all events for the team in this season
          eventData = await getAllEventsForTeamInSeason(team, season);
        }
        
        if (eventData.length === 0) {
          return;
        }
        
        // Calculate summary statistics
        const totalMatches = eventData.reduce((sum, event) => sum + event.matches.length, 0);
        const averageWinRate = eventData.reduce((sum, event) => sum + event.winRate, 0) / eventData.length;
        const averageOPR = eventData.reduce((sum, event) => sum + event.OPR, 0) / eventData.length;
        const averageScore = eventData.reduce((sum, event) => sum + event.averageScore, 0) / eventData.length;
        
        const totalAwards = eventData.reduce((sum, event) => {
          return sum + (event.achievements === 'No Awards Received' ? 0 : event.achievements.split(' • ').length);
        }, 0);
        
        const bestRanking = Math.min(...eventData.map(event => {
          const rank = parseInt(event.place.replace(/\D/g, ''));
          return isNaN(rank) ? Infinity : rank;
        }));
        
        summaries.push({
          season,
          eventsAttended: eventData.length,
          totalMatches,
          averageWinRate: Number(averageWinRate.toFixed(1)),
          averageOPR: Number(averageOPR.toFixed(2)),
          averageScore: Number(averageScore.toFixed(2)),
          totalAwards,
          bestRanking: bestRanking === Infinity ? 0 : bestRanking,
          events: eventData,
        });
      } catch (error) {
        console.warn(`Failed to generate summary for team ${team} in season ${season}:`, error);
      }
    })
  );
  
  return summaries.sort((a, b) => a.season - b.season);
};

/**
 * Get team progression metrics across years
 */
export interface TeamProgression {
  seasons: SupportedYear[];
  winRateProgression: number[];
  oprProgression: number[];
  scoreProgression: number[];
  eventsProgression: number[];
  awardsProgression: number[];
}

export const getTeamProgression = async (
  team: number, 
  seasons: SupportedYear[],
  events?: string[]
): Promise<TeamProgression> => {
  const summaries = await getTeamSeasonSummaries(team, seasons, events);
  
  return {
    seasons: summaries.map(s => s.season),
    winRateProgression: summaries.map(s => s.averageWinRate),
    oprProgression: summaries.map(s => s.averageOPR),
    scoreProgression: summaries.map(s => s.averageScore),
    eventsProgression: summaries.map(s => s.eventsAttended),
    awardsProgression: summaries.map(s => s.totalAwards),
  };
};

// ------------------- MATCH SCORE DETAILS -------------------

interface ScoreDetailsResponse {
  matchScores: any[];
}

/**
 * Cache for match score details to avoid repeated API calls
 */
const scoreDetailsCache = new Map<string, any>();

function getScoreCacheKey(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: string,
  matchNumber: number
): string {
  return `${season}-${eventCode}-${tournamentLevel}-${matchNumber}`;
}

/**
 * Fetch detailed score breakdown for a specific match
 * @param season - The season year (e.g., 2024)
 * @param eventCode - The event code (e.g., "USNYRO")
 * @param tournamentLevel - "qual" or "playoff"
 * @param matchNumber - Optional specific match number (for qual) or series number (for playoff)
 */
export async function getMatchScoreDetails(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: 'qual' | 'playoff',
  matchNumber?: number
): Promise<any | null> {
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const headers = { apikey: supabaseAnonKey };

  try {
    let url = `https://api.ares-bot.com/functions/v1/first/${season}/scores/${eventCode}/${tournamentLevel}`;
    
    if (matchNumber !== undefined) {
      // For playoff matches, use matchSeries. For qual matches, use matchNumber
      const paramName = tournamentLevel === 'playoff' ? 'matchSeries' : 'matchNumber';
      url += `?${paramName}=${matchNumber}`;
      console.log('Fetching match score details:', url);
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`Failed to fetch score details: ${response.status}`);
      return null;
    }

    const data: ScoreDetailsResponse = await response.json();
    
    // If looking for a specific match, return just that match's scores
    if (matchNumber !== undefined && data.matchScores && data.matchScores.length > 0) {
      return data.matchScores[0];
    }
    
    return data.matchScores || null;
  } catch (error) {
    console.error('Error fetching match score details:', error);
    return null;
  }
}

/**
 * Get score details with caching
 */
export async function getCachedMatchScoreDetails(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: 'qual' | 'playoff',
  matchNumber: number
): Promise<any | null> {
  const cacheKey = getScoreCacheKey(season, eventCode, tournamentLevel, matchNumber);
  
  // Check cache first
  if (scoreDetailsCache.has(cacheKey)) {
    return scoreDetailsCache.get(cacheKey);
  }

  // Fetch from API
  const scores = await getMatchScoreDetails(season, eventCode, tournamentLevel, matchNumber);

  // Cache the result
  if (scores) {
    scoreDetailsCache.set(cacheKey, scores);
  }

  return scores;
}

// ------------------- BASIC EVENTS (FAST LOADING) -------------------
export interface BasicEventInfo {
  name: string;
  eventCode: string;
  location: string;
  date: string;
  rawDate: string; // ISO date string for reliable parsing
  type?: string;
}

export const getEventsBasic = async (season: SupportedYear, includeCompleted = false): Promise<BasicEventInfo[]> => {
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const headers = { apikey: supabaseAnonKey };
  
  try {
    const eventsRes = await fetchWithRetry(`https://api.ares-bot.com/functions/v1/first/${season}/events`, headers);
    
    if (!eventsRes.events || eventsRes.events.length === 0) {
      console.log('No events found for season');
      return [];
    }
    
    let filteredEvents = eventsRes.events;
    
    // Filter for future and in-progress events based on end date unless includeCompleted is true
    if (!includeCompleted) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filteredEvents = eventsRes.events.filter((event: any) => {
        if (!event.dateEnd && !event.dateStart) return false;
        
        // Use end date if available, otherwise use start date
        const eventDate = new Date(event.dateEnd || event.dateStart);
        eventDate.setHours(23, 59, 59, 999);
        
        // Include events that haven't ended yet (upcoming and ongoing)
        return eventDate >= today;
      });
    }
    
    // Convert to basic format immediately without additional API calls
    const basicEvents: BasicEventInfo[] = filteredEvents.map((event: any) => ({
      name: event.name || 'Unknown Event',
      eventCode: event.code || 'UNKNOWN',
      location: event.venue || event.city || 'TBD',
      date: event.dateStart 
        ? new Date(event.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
        : 'TBD',
      rawDate: event.dateStart || event.dateEnd || '',
      type: event.type || undefined,
    }));
    
    // Sort by date (most recent first)
    basicEvents.sort((b, a) => {
      const dateA = new Date(a.date || '');
      const dateB = new Date(b.date || '');
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log(`Returning ${basicEvents.length} basic events for fast loading`);
    return basicEvents;
    
  } catch (error) {
    console.error('Error fetching basic events:', error);
    return [];
  }
};

// ------------------- UPCOMING EVENTS -------------------
export const getUpcomingEvents = async (season: SupportedYear, team?: number, includeTeamCounts = true, includeCompleted = false): Promise<EventInfo[]> => {
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const headers = { apikey: supabaseAnonKey };
  
  try {
    const eventsRes = await fetchWithRetry(`https://api.ares-bot.com/functions/v1/first/${season}/events?teamNumber=${team}`, headers);
    
    if (!eventsRes.events || eventsRes.events.length === 0) {
      console.log('No events found for season');
      return [];
    }
    
    let filteredEvents = eventsRes.events;
    
    // Filter for future and in-progress events based on end date unless includeCompleted is true
    if (!includeCompleted) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filteredEvents = eventsRes.events.filter((event: any) => {
        if (!event.dateEnd && !event.dateStart) return false;
        
        // Use end date if available, otherwise use start date
        const eventDate = new Date(event.dateEnd || event.dateStart);
        eventDate.setHours(23, 59, 59, 999);
        
        // Include events that haven't ended yet (upcoming and ongoing)
        return eventDate >= today;
      });
    }
    
    // If a team is specified, filter for events where the team is participating
    let teamEvents = filteredEvents;
    
    // Convert to EventInfo format
    const eventPromises = teamEvents.map(async (event: any) => {
      let teamCount = 0;
      
      // Only fetch team count if requested (slower but more complete data)
      if (includeTeamCounts) {
        // Fetch team count from FIRST API
        try {
          const teamsUrl = `https://ftc-api.firstinspires.org/v2.0/${season}/teams?eventCode=${event.code}`;
          const teamsRes = await fetch(teamsUrl, {
            headers: {
              'Authorization': 'Basic ' + btoa(process.env.EXPO_PUBLIC_FTC_USERNAME + ':' + process.env.EXPO_PUBLIC_FTC_API_KEY),
              'Accept': 'application/json'
            }
          });
          
          if (teamsRes.ok) {
            const teamsData = await teamsRes.json();
            teamCount = teamsData.teamCountTotal || teamsData.teams?.length || 0;
          }
        } catch (error) {
          console.error(`Error fetching team count for event ${event.code}:`, error);
        }
      }
      
      const eventInfo: EventInfo = {
        name: event.name || 'Unknown Event',
        eventCode: event.code || 'UNKNOWN',
        location: event.venue || event.city || 'TBD',
        date: event.dateStart 
          ? new Date(event.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
          : 'TBD',
        teamCount: teamCount,
        winRate: 0,
        OPR: 0,
        averageScore: 0,
        place: 'TBD',
        record: 'TBD',
        matches: [],
        achievements: 'Event Not Started',
        type: event.type || undefined, // Include event type from API
      };
      
      return eventInfo;
    });
    
    const eventsWithData = await Promise.all(eventPromises);
    
    eventsWithData.sort((b, a) => {
      const dateA = new Date(a.date || '');
      const dateB = new Date(b.date || '');
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log(`Returning ${eventsWithData.length} events to display`);
    
    return eventsWithData;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

// Get only upcoming and ongoing events (not completed ones)
export const getUpcomingEventsOnly = async (season: SupportedYear, team?: number): Promise<EventInfo[]> => {
  const allEvents = await getUpcomingEvents(season, team, true);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return allEvents.filter(event => {
    if (!event.date || event.date === 'TBD') return true; // Include events with unknown dates
    const eventDate = new Date(event.date);
    // Include events that haven't ended yet (upcoming and ongoing)
    return eventDate >= today;
  });
};