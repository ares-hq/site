import { createClient } from '@supabase/supabase-js';
import { AllianceInfo, TeamInfo } from './types';

const supabaseUrl = 'https://api.ares-bot.com';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetches team dashboard info from the `season_2024` table.
 * @param teamNumber The team number (e.g. 1234)
 * @returns An object with the team profile info or null if not found.
 */
export async function getTeamInfo(teamNumber: number): Promise<TeamInfo | null> {
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
      averagePlace,
      eventsAttended
    `)
    .eq('teamNumber', teamNumber)
    .single();

  if (error) {
    console.error(`Error fetching team ${teamNumber}:`, error.message);
    return null;
  }

  return {
    teamName: data.teamName || `Team ${teamNumber}`,
    location: data.location || 'N/A',
    founded: data.founded?.toString() || 'N/A',
    teamNumber: teamNumber,
    eventsAttended: data.eventsAttended || 0,
    events: JSON.parse(data.eventsAttended || '[]') || [],
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
    averagePlace: data.averagePlace || 0,
  } as TeamInfo;
}

export async function getAllTeams() {
  const { data, error } = await supabase
    .from('season_2024')
    .select('teamName, teamNumber, overallOPR, overallRank, location')

  if (error || !data) {
    console.error('Error fetching all OPRs:', error?.message);
    return null;
  }

  return data.map(row => ({
    teamName: row.teamName || `Team ${row.teamNumber}`,
    teamNumber: row.teamNumber,
    overallOPR: row.overallOPR || 0,
    overallRank: row.overallRank || 0,
    location: row.location || 'N/A',
  })) as TeamInfo[];
}

export async function getAverageOPRs() {
  const { data, error } = await supabase
    .from('season_2024')
    .select('autoOPR, teleOPR, endgameOPR, overallOPR')
    .limit(500);

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

/**
 * Fetches all match records for a specific team
 * @param teamNumber The team number to fetch matches for
 * @returns Array of AllianceInfo records or null if error
 */
export async function getTeamMatches(teamNumber: number): Promise<AllianceInfo[] | null> {
  const { data, error } = await supabase
    .from('matches_2024')
    .select('date, totalPoints, matchType, win, tele, penalty, alliance, team_1, team_2, matchcode')
    .or(`team_1.eq.${teamNumber},team_2.eq.${teamNumber}`)
    .order('date');

  if (error) {
    console.error('Error fetching matches:', error.message);
    return null;
  }

  return data.map(row => ({
    date: row.date,
    totalPoints: row.totalPoints ?? 0,
    win: row.win || false,
    tele: row.tele || 0,
    penalty: row.penalty || 0,
    alliance: row.alliance,
    matchType: row.matchType,
    matchNumber: row.matchcode,
    team_1: row.team_1 ? {
      teamName: row.team_1.teamName || `Team ${row.team_1.teamNumber}`,
      teamNumber: row.team_1.teamNumber || 0,
    } : undefined,
    team_2: row.team_2 ? {
      teamName: row.team_2.teamName || `Team ${row.team_2.teamNumber}`,
      teamNumber: row.team_2.teamNumber || 0,
    } : undefined,
  })) as AllianceInfo[];
}

export function getWins(matches: AllianceInfo[]): number {
  return matches.reduce((count, match) => {
    return count + (match.win ? 1 : 0);
  }, 0);
}

export function getTeamRecord(matches: AllianceInfo[]): { wins: number; losses: number; winRate: number } {
  const wins = getWins(matches);
  const losses = matches.length - wins;
  const winRate = matches.length > 0 ? Number((wins / matches.length * 100).toFixed(1)) : 0;
  
  return { wins, losses, winRate };
}

export function getMatchesByType(matches: AllianceInfo[]): { 
  qualificationMatches: AllianceInfo[]; 
  playoffMatches: AllianceInfo[]; 
} {
  return {
    qualificationMatches: matches.filter(m => m.matchType === 'QUALIFICATION'),
    playoffMatches: matches.filter(m => m.matchType === 'PLAYOFF'),
  };
}

export const fetchTeamName = async (teamNumber: number): Promise<string> => {
  const { data, error } = await supabase
    .from('season_2024')
    .select('teamName')
    .eq('teamNumber', teamNumber)
    .single();

  return data?.teamName;
};