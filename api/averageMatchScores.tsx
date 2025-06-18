import { supabase } from "./dashboardInfo";
import { AllianceInfo, EventInfo, MatchInfo, MatchTypeAverages } from "./types";

/**
 * Fetches complete match data with both red and blue alliance info
 * @param matchNumber Optional specific match number to fetch
 * @returns Array of complete MatchInfo records
 */
export async function getCompleteMatches(matchNumber?: string): Promise<MatchInfo[] | null> {
  let query = supabase
    .from('matches_2024')
    .select('date, totalPoints, matchType, win, tele, penalty, alliance, team_1, team_2, matchcode')
    .order('matchcode, alliance');

  if (matchNumber) {
    query = query.eq('matchcode', matchNumber);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching complete matches:', error.message);
    return null;
  }

  const matchMap = new Map<number, Partial<MatchInfo>>();

  for (const row of data) {
    const matchNum = row.matchcode;
    if (!matchMap.has(matchNum)) {
      matchMap.set(matchNum, {
        matchNumber: matchNum,
        matchType: row.matchType,
        date: row.date,
      });
    }

    const match = matchMap.get(matchNum)!;
    const allianceData = {
      date: row.date,
      alliance: row.alliance,
      matchType: row.matchType,
      totalPoints: row.totalPoints ?? 0,
      tele: row.tele || 0,
      penalty: row.penalty || 0,
      win: row.win || false,
      team_1: {
        teamName: row.team_1?.teamName || `Team ${row.team_1?.teamNumber}`,
        teamNumber: row.team_1?.teamNumber || 0,
      },
      team_2: {
        teamName: row.team_2?.teamName || `Team ${row.team_2?.teamNumber}`,
        teamNumber: row.team_2?.teamNumber || 0,
      },
    };

    if (row.alliance === 'red') {
      match.redAlliance = allianceData;
    } else {
      match.blueAlliance = allianceData;
    }
  }

  return Array.from(matchMap.values())
    .filter(match => match.redAlliance && match.blueAlliance)
    .map(match => match as MatchInfo);
}

function getHourWindow(date: string): { start: string; end: string } {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  const start = d.toISOString();
  const endDate = new Date(d);
  endDate.setHours(endDate.getHours() + 1);
  const end = endDate.toISOString();
  return { start, end };
}

export async function attachHourlyAverages(matches: AllianceInfo[]): Promise<AllianceInfo[]> {
  const hourWindows = matches.map(match => getHourWindow(match.date));
  const uniqueWindows = Array.from(
    new Map(hourWindows.map(hw => [`${hw.start}-${hw.end}`, hw])).values()
  );
  
  const allStarts = uniqueWindows.map(hw => hw.start);
  const allEnds = uniqueWindows.map(hw => hw.end);
  const minDate = new Date(Math.min(...allStarts.map(d => new Date(d).getTime())));
  const maxDate = new Date(Math.max(...allEnds.map(d => new Date(d).getTime())));
    
  const { data, error } = await supabase
    .from('matches_2024')
    .select('date, totalPoints, matchType, tele, penalty')
    .gte('date', minDate.toISOString())
    .lt('date', maxDate.toISOString())
    .order('date');
  
  if (error) {
    console.error('Error fetching data:', error.message);
    return matches.map(match => ({
      ...match,
      totalPoints: 0,
      tele: 0,
      penalty: 0,
    }));
  }
  
  const hourlyAverages = new Map<string, {
    points: number;
    tele: number;
    penalty: number;
  }>();
  
  for (const window of uniqueWindows) {
    const windowData = data?.filter(row => 
      row.date >= window.start && row.date < window.end
    ).slice(0, 50) || [];
    
    const total = {
      points: 0,
      tele: 0,
      penalty: 0,
    };

    for (const row of windowData) {
      total.points += row.totalPoints;
      total.tele += row.tele;
      total.penalty += row.penalty;
    }

    const count = windowData.length;
    const average = {
      points: count > 0 ? total.points / count : 0,
      tele: count > 0 ? total.tele / count : 0,
      penalty: count > 0 ? total.penalty / count : 0,
    };

    const windowKey = `${window.start}-${window.end}`;
    hourlyAverages.set(windowKey, {
      points: Number(average.points.toFixed(2)),
      tele: Number(average.tele.toFixed(2)),
      penalty: Number(average.penalty.toFixed(2)),
    });
  }
  
  return matches.map(match => {
    const window = getHourWindow(match.date);
    const windowKey = `${window.start}-${window.end}`;
    const avg = hourlyAverages.get(windowKey);

    return {
      ...match,
      totalPoints: avg?.points ?? match.totalPoints,
      tele: avg?.tele ?? match.tele,
      penalty: avg?.penalty ?? match.penalty,
    };
  });
}

export function getAverageByMatchType(matches: AllianceInfo[]): MatchTypeAverages {
  let qualTotal = 0;
  let finalsTotal = 0;
  let qualCount = 0;
  let finalsCount = 0;

  for (const match of matches) {
    if (match.matchType === 'QUALIFICATION') {
      qualTotal += match.totalPoints;
      qualCount++;
    } else if (match.matchType === 'PLAYOFF') {
      finalsTotal += match.totalPoints;
      finalsCount++;
    }
  }

  return {
    qual: qualCount > 0 ? Number((qualTotal / qualCount).toFixed(2)) : 0,
    finals: finalsCount > 0 ? Number((finalsTotal / finalsCount).toFixed(2)) : 0,
  };
}

export const getAveragePlace = (event: EventInfo[]): number => {
    if (event.length === 0) return 0;
    let total = 0;
    let count = 0;
    for (const currEvent of event) {
        if (currEvent.place !== undefined) {
            total += Number(currEvent.place.replace(/\D/g, ''));
            count++;
        }
    }
    return count > 0 ? Number((total / count).toFixed(2)) : 0;
}

export const getAwards = (events: EventInfo[]): string => {
  const uniqueAwards = new Set<string>();

  for (const event of events) {
    const awards = event.achievements?.trim();
    if (awards && awards !== 'No Awards Received') {
      uniqueAwards.add(awards);
    }
  }

  return Array.from(uniqueAwards).join(' • ');
};