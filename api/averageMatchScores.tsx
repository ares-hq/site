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

  if (!data || data.length === 0) return [];

  // Pre-allocate Map with expected size for better performance
  const matchMap = new Map<number, Partial<MatchInfo>>();
  
  // Single pass through data with optimized object creation
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const matchNum = row.matchcode;
    
    let match = matchMap.get(matchNum);
    if (!match) {
      match = {
        matchNumber: matchNum,
        matchType: row.matchType,
        date: row.date,
      };
      matchMap.set(matchNum, match);
    }

    // Pre-create alliance data object
    const allianceData = {
      date: row.date,
      alliance: row.alliance,
      matchType: row.matchType,
      totalPoints: row.totalPoints ?? 0,
      tele: row.tele || 0,
      penalty: row.penalty || 0,
      win: row.win || false,
      team_1: {
        teamName: row.team_1?.teamName || `Team ${row.team_1?.teamNumber || 0}`,
        teamNumber: row.team_1?.teamNumber || 0,
      },
      team_2: {
        teamName: row.team_2?.teamName || `Team ${row.team_2?.teamNumber || 0}`,
        teamNumber: row.team_2?.teamNumber || 0,
      },
    };

    // Direct assignment instead of conditional
    if (row.alliance === 'red') {
      match.redAlliance = allianceData;
    } else {
      match.blueAlliance = allianceData;
    }
  }

  // Optimized filtering and mapping
  const results: MatchInfo[] = [];
  for (const match of matchMap.values()) {
    if (match.redAlliance && match.blueAlliance) {
      results.push(match as MatchInfo);
    }
  }

  return results;
}

// Optimized hour window calculation with caching
const hourWindowCache = new Map<string, { start: string; end: string }>();

function getHourWindow(date: string): { start: string; end: string } {
  // Use cache to avoid recalculating same hour windows
  const cached = hourWindowCache.get(date);
  if (cached) return cached;

  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  const start = d.toISOString();
  d.setHours(d.getHours() + 1);
  const end = d.toISOString();
  
  const result = { start, end };
  hourWindowCache.set(date, result);
  return result;
}

export async function attachHourlyAverages(matches: AllianceInfo[]): Promise<AllianceInfo[]> {
  if (!matches.length) return matches;

  // Get unique hour windows from matches
  const uniqueWindows = Array.from(
    new Map(matches.map(match => {
      const hw = getHourWindow(match.date);
      return [`${hw.start}-${hw.end}`, hw];
    })).values()
  );

  // Single database query with optimized date range
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

  if (!data) return matches;
  
  // Pre-compute hourly averages
  const hourlyAverages = new Map<string, { points: number; tele: number; penalty: number }>();
  
  for (const window of uniqueWindows) {
    // Filter data for this specific window and take first 50 matches
    const windowData = data
      .filter(row => row.date >= window.start && row.date < window.end)
      .slice(0, 50);
    
    let totalPoints = 0;
    let totalTele = 0;
    let totalPenalty = 0;

    for (const row of windowData) {
      totalPoints += row.totalPoints || 0;
      totalTele += row.tele || 0;
      totalPenalty += row.penalty || 0;
    }

    const count = windowData.length;
    const windowKey = `${window.start}-${window.end}`;
    
    if (count > 0) {
      hourlyAverages.set(windowKey, {
        points: Number((totalPoints / count).toFixed(2)),
        tele: Number((totalTele / count).toFixed(2)),
        penalty: Number((totalPenalty / count).toFixed(2)),
      });
    } else {
      hourlyAverages.set(windowKey, { points: 0, tele: 0, penalty: 0 });
    }
  }
  
  // Apply averages to matches
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
  if (!matches.length) return { qual: 0, finals: 0 };

  let qualTotal = 0;
  let finalsTotal = 0;
  let qualCount = 0;
  let finalsCount = 0;

  // Single pass through matches
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const points = match.totalPoints;
    
    if (match.matchType === 'QUALIFICATION') {
      qualTotal += points;
      qualCount++;
    } else if (match.matchType === 'PLAYOFF') {
      finalsTotal += points;
      finalsCount++;
    }
  }

  return {
    qual: qualCount > 0 ? Number((qualTotal / qualCount).toFixed(2)) : 0,
    finals: finalsCount > 0 ? Number((finalsTotal / finalsCount).toFixed(2)) : 0,
  };
}

export const getAveragePlace = (events: EventInfo[]): number => {
  if (!events.length) return 0;
  
  let total = 0;
  let count = 0;
  
  // Single pass with optimized number extraction
  for (let i = 0; i < events.length; i++) {
    const place = events[i].place;
    if (place) {
      // More efficient number extraction
      const numStr = place.replace(/\D/g, '');
      if (numStr) {
        total += parseInt(numStr, 10);
        count++;
      }
    }
  }
  
  return count > 0 ? Number((total / count).toFixed(2)) : 0;
};

export const getAwards = (events: EventInfo[]): string => {
  if (!events.length) return '';
  
  const uniqueAwards = new Set<string>();

  // Single pass with early filtering
  for (let i = 0; i < events.length; i++) {
    const achievements = events[i].achievements;
    if (achievements && achievements !== 'No Awards Received') {
      const trimmed = achievements.trim();
      if (trimmed) {
        uniqueAwards.add(trimmed);
      }
    }
  }

  return uniqueAwards.size > 0 ? Array.from(uniqueAwards).join(' • ') : '';
};

// Utility function to clear cache if needed (call periodically to prevent memory leaks)
export const clearHourWindowCache = (): void => {
  hourWindowCache.clear();
};