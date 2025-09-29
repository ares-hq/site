import { supabase, SupportedYear } from "./dashboardInfo";
import { AllianceInfo, EventInfo, MatchInfo, MatchTypeAverages } from "./types";

/** Shape of rows we read from matches tables */
type MatchRow = {
  date: string;
  totalPoints: number | null;
  matchType: 'QUALIFICATION' | 'PLAYOFF' | string;
  win: boolean | null;
  tele: number | null;
  penalty: number | null;
  alliance: 'red' | 'blue';
  matchcode: string; // treat as string; many datasets use codes like "Q16"
  team_1?: { teamName?: string | null; teamNumber?: number | null } | null;
  team_2?: { teamName?: string | null; teamNumber?: number | null } | null;
};

/** Helper: table name for a given year */
function getMatchesTable(year: SupportedYear): string {
  return `matches_${year}`;
}

/**
 * Fetch complete match data with both red and blue alliance info.
 * - Makes ordering valid for Supabase
 * - Treats matchcode as string keys
 * - Defensively defaults nullish numeric fields to 0
 */
export async function getCompleteMatches(
  year: SupportedYear,
  matchNumber?: string
): Promise<MatchInfo[] | null> {
  // Be explicit about nested columns in case relations are configured
  let query = supabase
    .from(getMatchesTable(year))
    .select(
      `
      date,
      totalPoints,
      matchType,
      win,
      tele,
      penalty,
      alliance,
      matchcode,
      team_1 ( teamName, teamNumber ),
      team_2 ( teamName, teamNumber )
    `
    )
    .order('matchcode', { ascending: true })
    .order('alliance', { ascending: true });

  if (matchNumber) {
    query = query.eq('matchcode', matchNumber);
  }

  const { data, error } = await query as unknown as { data: MatchRow[] | null; error: { message: string } | null };

  if (error) {
    console.error(`Error fetching complete matches for ${year}:`, error.message);
    return null;
  }
  if (!data || data.length === 0) return [];

  const matchMap = new Map<string, Partial<MatchInfo>>();

  for (let i = 0; i < data.length; i++) {
    const row: any = data[i];
    const matchKey = row.matchcode;

    let match = matchMap.get(matchKey);
    if (!match) {
      match = {
        matchNumber: row.matchcode,
        matchType: row.matchType === "QUALIFICATION" || row.matchType === "PLAYOFF"
          ? row.matchType
          : undefined,
        date: row.date,
      };
      matchMap.set(matchKey, match);
    }

    const allianceData: AllianceInfo = {
      date: row.date,
      alliance: row.alliance,
      matchType: row.matchType === 'QUALIFICATION' || row.matchType === 'PLAYOFF' ? row.matchType : 'QUALIFICATION',
      totalPoints: row.totalPoints ?? 0,
      tele: row.tele ?? 0,
      penalty: row.penalty ?? 0,
      win: row.win ?? false,
      team_1: {
        teamName: row.team_1?.teamName ?? `Team ${row.team_1?.teamNumber ?? 0}`,
        teamNumber: row.team_1?.teamNumber ?? 0,
      },
      team_2: {
        teamName: row.team_2?.teamName ?? `Team ${row.team_2?.teamNumber ?? 0}`,
        teamNumber: row.team_2?.teamNumber ?? 0,
      },
    };

    if (row.alliance === 'red') {
      match.redAlliance = allianceData;
    } else {
      match.blueAlliance = allianceData;
    }
  }

  const results: MatchInfo[] = [];
  for (const match of matchMap.values()) {
    if (match.redAlliance && match.blueAlliance) {
      results.push(match as MatchInfo);
    }
  }
  return results;
}

// ----- Hour-window cache (keyed by the original date string) -----

const hourWindowCache = new Map<string, { start: string; end: string }>();

function getHourWindow(dateISO: string): { start: string; end: string } {
  const cached = hourWindowCache.get(dateISO);
  if (cached) return cached;

  const d = new Date(dateISO);
  d.setMinutes(0, 0, 0);
  const start = d.toISOString();
  d.setHours(d.getHours() + 1);
  const end = d.toISOString();

  const window = { start, end };
  hourWindowCache.set(dateISO, window);
  return window;
}

/**
 * Attach hourly averages (by local hour bucket) for a given year.
 * Uses a single range fetch, then filters client-side by window.
 */
export async function attachHourlyAverages(
  matches: AllianceInfo[],
  year: SupportedYear
): Promise<AllianceInfo[]> {
  if (!matches.length) return matches;

  const uniqueWindows = Array.from(
    new Map(
      matches.map((m) => {
        const hw = getHourWindow(m.date);
        return [`${hw.start}-${hw.end}`, hw];
      })
    ).values()
  );

  const allStarts = uniqueWindows.map((hw) => hw.start);
  const allEnds = uniqueWindows.map((hw) => hw.end);
  const minDate = new Date(Math.min(...allStarts.map((d) => new Date(d).getTime())));
  const maxDate = new Date(Math.max(...allEnds.map((d) => new Date(d).getTime())));

  const { data, error } = (await supabase
    .from(getMatchesTable(year))
    .select('date, totalPoints, matchType, tele, penalty')
    .gte('date', minDate.toISOString())
    .lt('date', maxDate.toISOString())
    .order('date', { ascending: true })) as unknown as { data: MatchRow[] | null; error: { message: string } | null };

  if (error) {
    console.error(`Error fetching data for ${year}:`, error.message);
    return matches;
  }
  if (!data) return matches;

  // Calculate averages for ALL matches in each hour window (not just team-specific)
  const hourlyAverages = new Map<string, { points: number; tele: number; penalty: number }>();

  for (const window of uniqueWindows) {
    const windowData = data
      .filter((row: any) => row.date >= window.start && row.date < window.end);

    let totalPoints = 0;
    let totalTele = 0;
    let totalPenalty = 0;
    let count = 0;

    for (const row of windowData) {
      if ((row.totalPoints ?? 0) > 0) { // Only count matches with actual scores
        totalPoints += row.totalPoints ?? 0;
        totalTele += row.tele ?? 0;
        totalPenalty += row.penalty ?? 0;
        count++;
      }
    }

    const windowKey = `${window.start}-${window.end}`;
    if (count > 0) {
      hourlyAverages.set(windowKey, {
        points: Number((totalPoints / count).toFixed(2)),
        tele: Number((totalTele / count).toFixed(2)),
        penalty: Number((totalPenalty / count).toFixed(2)),
      });
    }
    // Don't store empty hours
  }

  // Calculate overall averages as final fallback
  const allValidMatches = data.filter(row => (row.totalPoints ?? 0) > 0);
  const overallFallback = {
    points: allValidMatches.length > 0 ? Number((allValidMatches.reduce((sum, row) => sum + (row.totalPoints ?? 0), 0) / allValidMatches.length).toFixed(2)) : 50,
    tele: allValidMatches.length > 0 ? Number((allValidMatches.reduce((sum, row) => sum + (row.tele ?? 0), 0) / allValidMatches.length).toFixed(2)) : 25,
    penalty: allValidMatches.length > 0 ? Number((allValidMatches.reduce((sum, row) => sum + (row.penalty ?? 0), 0) / allValidMatches.length).toFixed(2)) : 5,
  };

  // Helper function to get smooth average using expanding time window
  const getSmoothAverage = (matchDate: string, previousAverage?: { points: number; tele: number; penalty: number }) => {
    const matchTime = new Date(matchDate).getTime();
    
    // Try expanding time windows until we find enough data
    const windowSizes = [1, 2, 4, 8, 12, 24]; // hours
    
    for (const windowSize of windowSizes) {
      const startTime = new Date(matchTime - (windowSize * 60 * 60 * 1000));
      const endTime = new Date(matchTime + (windowSize * 60 * 60 * 1000));
      
      const relevantMatches = data.filter(row => {
        const rowTime = new Date(row.date).getTime();
        return rowTime >= startTime.getTime() && 
               rowTime <= endTime.getTime() && 
               (row.totalPoints ?? 0) > 0;
      });
      
      // Reduce minimum matches required for smaller windows to make it more responsive
      const minMatches = windowSize <= 2 ? 3 : windowSize <= 8 ? 5 : 8;
      
      if (relevantMatches.length >= minMatches) {
        let totalPoints = 0;
        let totalTele = 0;
        let totalPenalty = 0;
        
        for (const row of relevantMatches) {
          totalPoints += row.totalPoints ?? 0;
          totalTele += row.tele ?? 0;
          totalPenalty += row.penalty ?? 0;
        }
        
        const newAverage = {
          points: Number((totalPoints / relevantMatches.length).toFixed(2)),
          tele: Number((totalTele / relevantMatches.length).toFixed(2)),
          penalty: Number((totalPenalty / relevantMatches.length).toFixed(2)),
        };
        
        // If we have a previous average, smooth the transition (blend 70% new, 30% previous)
        if (previousAverage) {
          return {
            points: Number((0.7 * newAverage.points + 0.3 * previousAverage.points).toFixed(2)),
            tele: Number((0.7 * newAverage.tele + 0.3 * previousAverage.tele).toFixed(2)),
            penalty: Number((0.7 * newAverage.penalty + 0.3 * previousAverage.penalty).toFixed(2)),
          };
        }
        
        return newAverage;
      }
    }
    
    // If no good window found, use overall average (possibly blended with previous)
    if (previousAverage) {
      return {
        points: Number((0.8 * overallFallback.points + 0.2 * previousAverage.points).toFixed(2)),
        tele: Number((0.8 * overallFallback.tele + 0.2 * previousAverage.tele).toFixed(2)),
        penalty: Number((0.8 * overallFallback.penalty + 0.2 * previousAverage.penalty).toFixed(2)),
      };
    }
    
    return overallFallback;
  };

  // Create a smoothed average cache for better interpolation
  const sortedMatches = matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const smoothedAverages = new Map<string, { points: number; tele: number; penalty: number }>();
  
  // Pre-calculate smooth averages for each unique time point with progressive smoothing
  const uniqueTimes = [...new Set(sortedMatches.map(m => m.date))];
  let previousAverage: { points: number; tele: number; penalty: number } | undefined;
  
  for (const time of uniqueTimes) {
    const window = getHourWindow(time);
    const windowKey = `${window.start}-${window.end}`;
    
    // First try exact hour match
    let avg = hourlyAverages.get(windowKey);
    
    // If no exact match, use smooth averaging with previous context
    if (!avg) {
      avg = getSmoothAverage(time, previousAverage);
    }
    
    smoothedAverages.set(time, avg);
    previousAverage = avg; // Store for next iteration
  }

  // Return matches with smoothed average data
  return matches.map((match) => {
    const avg = smoothedAverages.get(match.date) || overallFallback;
    
    // Return the original match data PLUS the average data for comparison
    return {
      ...match,
      // Keep original values
      totalPoints: match.totalPoints ?? 0,
      tele: match.tele ?? 0,
      penalty: match.penalty ?? 0,
      // Add smoothed average data for graph comparison
      averagePoints: avg.points,
      averageTele: avg.tele,
      averagePenalty: avg.penalty,
    };
  });
}

/** Averages by match type with null-safe totals */
export function getAverageByMatchType(matches: AllianceInfo[]): MatchTypeAverages {
  if (!matches.length) return { qual: 0, finals: 0 };

  let qualTotal = 0;
  let finalsTotal = 0;
  let qualCount = 0;
  let finalsCount = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const pts = m.totalPoints ?? 0;

    if (m.matchType === 'QUALIFICATION') {
      qualTotal += pts;
      qualCount++;
    } else if (m.matchType === 'PLAYOFF' || (typeof m.matchType === 'string' && (m.matchType as string).includes('FINAL'))) {
      finalsTotal += pts;
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

  for (let i = 0; i < events.length; i++) {
    const place = events[i].place;
    if (place) {
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

  for (let i = 0; i < events.length; i++) {
    const achievements = events[i].achievements;
    if (achievements && achievements !== 'No Awards Received') {
      const trimmed = achievements.trim();
      if (trimmed) uniqueAwards.add(trimmed);
    }
  }

  return uniqueAwards.size > 0 ? Array.from(uniqueAwards).join(' • ') : '';
};

// ----- Cache utilities -----

export const clearHourWindowCache = (): void => {
  hourWindowCache.clear();
};

export const clearHourWindowCacheForDateRange = (startDateISO: string, endDateISO: string): void => {
  for (const key of hourWindowCache.keys()) {
    if (key >= startDateISO && key <= endDateISO) {
      hourWindowCache.delete(key);
    }
  }
};

// ----- Multi-year helpers -----

export async function getCompleteMatchesMultiYear(
  years: SupportedYear[],
  matchNumber?: string
): Promise<Map<SupportedYear, MatchInfo[]>> {
  const results = new Map<SupportedYear, MatchInfo[]>();

  await Promise.all(
    years.map(async (year) => {
      try {
        const matches = await getCompleteMatches(year, matchNumber);
        results.set(year, matches || []);
      } catch (err) {
        console.warn(`Failed to fetch matches for ${year}:`, err);
        results.set(year, []);
      }
    })
  );

  return results;
}

export async function getMatchTypeAveragesMultiYear(
  teamNumber: number,
  years: SupportedYear[]
): Promise<Map<SupportedYear, MatchTypeAverages>> {
  const results = new Map<SupportedYear, MatchTypeAverages>();
  const { getTeamMatches } = await import('./dashboardInfo');

  await Promise.all(
    years.map(async (year) => {
      try {
        const matches = await getTeamMatches(teamNumber, year);
        const averages = getAverageByMatchType(matches || []);
        results.set(year, averages);
      } catch (err) {
        console.warn(`Failed to fetch match averages for team ${teamNumber} in ${year}:`, err);
        results.set(year, { qual: 0, finals: 0 });
      }
    })
  );

  return results;
}

export interface YearlyPerformance {
  year: SupportedYear;
  averageScore: number;
  totalMatches: number;
  winRate: number; // percentage 0–100
  qualAverage: number;
  playoffAverage: number;
}

export async function getTeamPerformanceAcrossYears(
  teamNumber: number,
  years: SupportedYear[]
): Promise<YearlyPerformance[]> {
  const { getTeamMatches, getWins } = await import('./dashboardInfo');

  const performances: YearlyPerformance[] = [];

  await Promise.all(
    years.map(async (year) => {
      try {
        const matches = await getTeamMatches(teamNumber, year);
        if (!matches || matches.length === 0) return;

        const wins = await getWins(matches);
        const typeAvgs = getAverageByMatchType(matches);
        const totalScore = matches.reduce((sum, m) => sum + (m.totalPoints ?? 0), 0);

        performances.push({
          year,
          averageScore: Number((totalScore / matches.length).toFixed(2)),
          totalMatches: matches.length,
          winRate: Number(((wins / matches.length) * 100).toFixed(1)),
          qualAverage: typeAvgs.qual,
          playoffAverage: typeAvgs.finals,
        });
      } catch (err) {
        console.warn(`Failed to get performance for team ${teamNumber} in ${year}:`, err);
      }
    })
  );

  return performances.sort((a, b) => a.year - b.year);
}