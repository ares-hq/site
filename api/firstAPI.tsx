import { calculateTeamOPR } from './calcOPR';
import { fetchTeamName } from './dashboardInfo';
import { EventInfo, MatchInfo, TeamInfoSimple } from './types';

// Format ordinal numbers (e.g., 1st, 2nd, 3rd)
function formatOrdinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export const getFirstAPI = async (events: string[], team: number): Promise<EventInfo[]> => {
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const season = 2024;

  const results = await Promise.all(events.map(async (eventCode) => {
    // --- Fetch Event Metadata ---
    const eventRes = await fetch(
      `https://api.ares-bot.com/functions/v1/first/${season}/events?eventCode=${eventCode}`,
      { headers: { apikey: supabaseAnonKey } }
    );
    if (!eventRes.ok) throw new Error(`Failed to fetch event metadata for ${eventCode}`);
    const eventData = (await eventRes.json()).events?.[0];
    if (!eventData) throw new Error(`No event data for ${eventCode}`);

    // --- Fetch Team Ranking ---
    const rankingRes = await fetch(
      `https://api.ares-bot.com/functions/v1/first/${season}/rankings/${eventCode}?teamNumber=${team}`,
      { headers: { apikey: supabaseAnonKey } }
    );
    if (!rankingRes.ok) throw new Error(`Failed to fetch rankings for ${eventCode}`);
    const rankData = (await rankingRes.json()).rankings?.[0];
    if (!rankData) throw new Error(`No rank data for team ${team} at ${eventCode}`);

    // --- Fetch Awards for Team ---
    const awardsRes = await fetch(
      `https://api.ares-bot.com/functions/v1/first/${season}/awards/${team}?eventCode=${eventCode}`,
      { headers: { apikey: supabaseAnonKey } }
    );
    if (!awardsRes.ok) throw new Error(`Failed to fetch awards for ${eventCode}`);
    const awardData = (await awardsRes.json()).awards;

    // --- Fetch Matches for Event ---
    const matchRes = await fetch(
      `https://api.ares-bot.com/functions/v1/first/${season}/matches/${eventCode}`,
      { headers: { apikey: supabaseAnonKey } }
    );
    if (!matchRes.ok) throw new Error(`Failed to fetch matches for ${eventCode}`);
    const matchData = await matchRes.json();

    // --- Filter & Format Matches with the Team ---
    const matches: MatchInfo[] = await Promise.all(
      (matchData.matches || [])
        .filter((match: any) => match.teams.some((t: any) => t.teamNumber === team))
        .map(async (match: any): Promise<MatchInfo> => {
          const redTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('red'));
          const blueTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('blue'));

          const redScore = match.scoreRedFinal || 0;
          const blueScore = match.scoreBlueFinal || 0;

          const createTeam = async (teamData: any): Promise<TeamInfoSimple> => ({
            teamName: await fetchTeamName(teamData?.teamNumber || 0) || 'none',
            teamNumber: teamData?.teamNumber || 0,
          });

          return {
            matchType: match.tournamentLevel === 'Playoff' ? 'PLAYOFF' : 'QUALIFICATION',
            matchNumber: match.tournamentLevel === 'PLAYOFF' ? 'P-' + match.series : 'Q-' + match.matchNumber,
            date: match.actualStartTime ?? match.postResultTime,
            redAlliance: {
              totalPoints: redScore,
              tele: Math.max(0, redScore - (match.scoreRedAuto || 0)),
              penalty: match.scoreRedFoul || 0,
              win: redScore > blueScore,
              team_1: await createTeam(redTeams[0]),
              team_2: await createTeam(redTeams[1]),
              date: match.actualStartTime ?? match.postResultTime,
              alliance: 'red',
              matchType: match.tournamentLevel === 'Playoff' ? 'PLAYOFF' : 'QUALIFICATION',
            },
            blueAlliance: {
              totalPoints: blueScore,
              tele: Math.max(0, blueScore - (match.scoreBlueAuto || 0)),
              penalty: match.scoreBlueFoul || 0,
              win: blueScore > redScore,
              team_1: await createTeam(blueTeams[0]),
              team_2: await createTeam(blueTeams[1]),
              date: match.actualStartTime ?? match.postResultTime,
              alliance: 'blue',
              matchType: match.tournamentLevel === 'Playoff' ? 'PLAYOFF' : 'QUALIFICATION',
            },
          };
        })
    );

    const allmatches: MatchInfo[] = (matchData.matches || [])
      .filter((match: any) => match.tournamentLevel === "QUALIFICATION")
      .map((match: any): MatchInfo => {
        const redTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('red'));
        const blueTeams = match.teams.filter((t: any) => t.station.toLowerCase().includes('blue'));

        const redScore = match.scoreRedFinal || 0;
        const blueScore = match.scoreBlueFinal || 0;

        const createTeam = (teamData: any): TeamInfoSimple => ({
          teamName: teamData?.teamName || fetchTeamName(teamData?.teamNumber || 0),
          teamNumber: teamData?.teamNumber || 0,
        });

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


    // --- Compute Stats ---
    let winCount = 0, tieCount = 0, totalScore = 0;
    const teamSet = new Set<number>();

    for (const match of matches) {
      const redScore = match.redAlliance.totalPoints;
      const blueScore = match.blueAlliance.totalPoints;

      const teamInRed = [match.redAlliance.team_1, match.redAlliance.team_2].some(t => t && t.teamNumber === team);
      const teamInBlue = [match.blueAlliance.team_1, match.blueAlliance.team_2].some(t => t && t.teamNumber === team);

      if (redScore === blueScore) {
        tieCount++;
      } else if ((teamInRed && redScore > blueScore) || (teamInBlue && blueScore > redScore)) {
        winCount++;
      }

      totalScore += teamInRed ? redScore : blueScore;

      [match.redAlliance.team_1, match.redAlliance.team_2, match.blueAlliance.team_1, match.blueAlliance.team_2]
        .forEach(t => t && teamSet.add(t.teamNumber));
    }

    const totalMatches = matches.length;
    const lossCount = totalMatches - winCount - tieCount;
    const averageScore = totalMatches ? Number((totalScore / totalMatches).toFixed(2)) : 0;
    const winRate = totalMatches ? Number(((winCount / totalMatches) * 100).toFixed(1)) : 0;

    // --- Calculate OPR ---
    const oprResults = calculateTeamOPR(allmatches, team);

    // --- Assemble EventInfo Object ---
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
  }));

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};