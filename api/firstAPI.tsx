import { calculateTeamOPR } from './calcOPR';
import { fetchTeamName } from './dashboardInfo';
import { EventInfo, MatchInfo, TeamInfoSimple } from './types';

function formatOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

async function batchFetchTeamNames(teamNumbers: number[]): Promise<Map<number, string>> {
  const uniqueTeams = [...new Set(teamNumbers)];
  const teamNamePromises = uniqueTeams.map(async (teamNum) => {
    try {
      const name = await fetchTeamName(teamNum);
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

export const getFirstAPI = async (events: string[], team: number): Promise<EventInfo[]> => {
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const season = 2024;
  const headers = { apikey: supabaseAnonKey };

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
        throw new Error(`Missing data for event ${eventCode}`);
      }

      const teamMatches = allMatches.filter((match: any) => 
        match.teams.some((t: any) => t.teamNumber === team)
      );
      
      const qualificationMatches = allMatches.filter((match: any) => 
        match.tournamentLevel === "QUALIFICATION"
      );

      const allTeamNumbers = new Set<number>();
      teamMatches.forEach((match: any) => {
        match.teams.forEach((t: any) => {
          if (t?.teamNumber) allTeamNumbers.add(t.teamNumber);
        });
      });

      const teamNameMap = await batchFetchTeamNames([...allTeamNumbers]);

      const createTeam = (teamData: any): TeamInfoSimple => ({
        teamName: teamNameMap.get(teamData?.teamNumber) || 'none',
        teamNumber: teamData?.teamNumber || 0,
      });

      const matches: MatchInfo[] = teamMatches.map((match: any): MatchInfo => {
        const redTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('red'));
        const blueTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('blue'));

        const redScore = match.scoreRedFinal || 0;
        const blueScore = match.scoreBlueFinal || 0;

        return {
          matchType: match.tournamentLevel === 'Playoff' ? 'PLAYOFF' : 'QUALIFICATION',
          matchNumber: match.tournamentLevel === 'PLAYOFF' ? 'P-' + match.series : 'Q-' + match.matchNumber,
          date: match.actualStartTime ?? match.postResultTime,
          redAlliance: {
            totalPoints: redScore,
            tele: Math.max(0, redScore - (match.scoreRedAuto || 0)),
            penalty: match.scoreRedFoul || 0,
            win: redScore > blueScore,
            team_1: createTeam(redTeams[0]),
            team_2: createTeam(redTeams[1]),
            date: match.actualStartTime ?? match.postResultTime,
            alliance: 'red',
            matchType: match.tournamentLevel === 'Playoff' ? 'PLAYOFF' : 'QUALIFICATION',
          },
          blueAlliance: {
            totalPoints: blueScore,
            tele: Math.max(0, blueScore - (match.scoreBlueAuto || 0)),
            penalty: match.scoreBlueFoul || 0,
            win: blueScore > redScore,
            team_1: createTeam(blueTeams[0]),
            team_2: createTeam(blueTeams[1]),
            date: match.actualStartTime ?? match.postResultTime,
            alliance: 'blue',
            matchType: match.tournamentLevel === 'Playoff' ? 'PLAYOFF' : 'QUALIFICATION',
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

      for (const match of matches) {
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

      const totalMatches = matches.length;
      const lossCount = totalMatches - winCount - tieCount;
      const averageScore = totalMatches ? Number((totalScore / totalMatches).toFixed(2)) : 0;
      const winRate = totalMatches ? Number(((winCount / totalMatches) * 100).toFixed(1)) : 0;

      const oprResults = calculateTeamOPR(allMatchesForOPR, team);

      const eventInfo: EventInfo = {
        date: eventData.dateStart
          ? new Date(eventData.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Unknown',
        location: `${eventData.address || ''}, ${eventData.city || ''}, ${eventData.stateprov || ''}`.replace(/^,\s*|,\s*$/g, ''),
        name: eventData.name ?? eventCode,
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
      console.error(`Error processing event ${eventCode}:`, error);
      throw error;
    }
  }));

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};