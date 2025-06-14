import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://api.ares-bot.com';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TeamInfo {
  teamName: string;
  location: string;
  founded: string;
  highestScore: string;
  website: string;
  eventsAttended?: number;
  averagePlace?: number;
  sponsors: string;
  achievements: string;
  overallRank?: number;
  teleRank?: number;
  autoRank?: number;
  endgameRank?: number;
  teleOPR?: number;
  autoOPR?: number;
  endgameOPR?: number;
  overallOPR?: number;
  penalties?: string;
}

export interface MatchInfo {
    date: string;
    totalPoints: number;
    matchType: 'QUALIFICATION' | 'PLAYOFF';
    win: boolean;
    tele: number;
    penalty: number;
}

export interface MatchType {
    qual: number;
    finals: number;
}

/**
 * Fetches team dashboard info from the `season_2024` table.
 * @param teamNumber The team number (e.g. 1234)
 * @returns An object with the team profile info or null if not found.
 */
export async function getTeamInfo(teamNumber: number) {
  const { data, error } = await supabase
    .from('season_2024')
    .select(`
      teamName,
      location,
      founded,
      website,
      sponsors,
      achievements,
      teleRank,
      autoRank,
      endgameRank,
      overallRank,
      penalties,
      autoOPR,
      teleOPR,
      endgameOPR,
      overallOPR,
      founded, 
      website, 
      eventsAttended, 
      averagePlace
    `)
    .eq('teamNumber', teamNumber)
    .single();

  if (error) {
    console.error(`Error fetching team ${teamNumber}:`, error.message);
    return null;
  }

    return {
    teamName: `Team ${teamNumber}`,
    location: data.location || 'N/A',
    founded: data.founded?.toString() || 'N/A',
    eventsAttended: data.eventsAttended || '',
    website: data.website || 'None',
    sponsors: data.sponsors || '',
    achievements: data.achievements || 'None This Season',
    overallRank: data.overallRank,
    teleRank: data.teleRank,
    autoRank: data.autoRank,
    endgameRank: data.endgameRank,
    teleOPR: data.teleOPR,
    autoOPR: data.autoOPR,
    endgameOPR: data.endgameOPR,
    overallOPR: data.overallOPR,
    penalties: data.penalties,
    } as TeamInfo;
}

export async function getAverageOPRs() {
  const { data, error } = await supabase
    .from('season_2024')
    .select('autoOPR, teleOPR, endgameOPR, overallOPR');

  if (error || !data) {
    console.error('Error fetching all OPRs:', error?.message);
    return null;
  }

  const total = {
    auto: 0,
    tele: 0,
    endgame: 0,
    overall: 0,
  };
  let count = 0;

  for (const row of data) {
    if (row.autoOPR != null) total.auto += row.autoOPR;
    if (row.teleOPR != null) total.tele += row.teleOPR;
    if (row.endgameOPR != null) total.endgame += row.endgameOPR;
    if (row.overallOPR != null) total.overall += row.overallOPR;
    count++;
  }

  return {
    autoOPR: total.auto / count,
    teleOPR: total.tele / count,
    endgameOPR: total.endgame / count,
    overallOPR: total.overall / count,
  };
}

export async function getMatches(teamNumber: number): Promise<MatchInfo[] | null> {
  const { data, error } = await supabase
    .from('matches_2024')
    .select('date, totalPoints, matchType, win, tele, penalty')
    .or(`team_1.eq.${teamNumber},team_2.eq.${teamNumber}`);

  if (error) {
    console.error('Error fetching matches:', error.message);
    return null;
  }

  return data as MatchInfo[];
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

export async function attachHourlyAverages(matches: MatchInfo[]): Promise<MatchInfo[]> {
  const hourWindows = matches.map(match => getHourWindow(match.date));
  const uniqueWindows = Array.from(
    new Map(hourWindows.map(hw => [`${hw.start}-${hw.end}`, hw])).values()
  );
  
  const allStarts = uniqueWindows.map(hw => hw.start);
  const allEnds = uniqueWindows.map(hw => hw.end);
  const minDate = new Date(Math.min(...allStarts.map(d => new Date(d).getTime())));
  const maxDate = new Date(Math.max(...allEnds.map(d => new Date(d).getTime())));
  
  console.log(`Fetching all data from ${minDate.toISOString()} to ${maxDate.toISOString()}`);
  
  const { data, error } = await supabase
    .from('matches_2024')
    .select('date, totalPoints, matchType, tele, penalty')
    .gte('date', minDate.toISOString())
    .lt('date', maxDate.toISOString())
    .order('date');
  
  if (error) {
    console.error('Error fetching data:', error.message);
    return matches.map(match => ({ date: match.date, totalPoints: 0, matchType: 'QUALIFICATION', win: false, tele: 0, penalty: 0 }));
  }
  
  const hourlyAverages = new Map<string, number>();
  
  for (const window of uniqueWindows) {
    const windowData = data?.filter(row => 
      row.date >= window.start && row.date < window.end
    ) || [];
    
    const totalPoints = windowData.reduce((sum, row) => sum + row.totalPoints, 0);
    const average = windowData.length > 0 ? totalPoints / windowData.length : 0;
    const windowKey = `${window.start}-${window.end}`;
    hourlyAverages.set(windowKey, Number(average.toFixed(2)));
  }
  
  return matches.map(match => {
    const window = getHourWindow(match.date);
    const windowKey = `${window.start}-${window.end}`;
    const average = hourlyAverages.get(windowKey) || 0;
    
    return {
      date: match.date,
      totalPoints: average,
      matchType: match.matchType || 'QUALIFICATION',
      win: match.win || false,
      tele: match.tele || 0,
      penalty: match.penalty || 0,
    };
  });
}

export function getAverageByMatchType(matches: MatchInfo[]): MatchType {
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

export function getWins(matches: MatchInfo[]): number {
  return matches.reduce((count, match) => {
    return count + (match.win ? 1 : 0);
  }, 0);
}