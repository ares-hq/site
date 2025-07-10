import { createClient } from '@supabase/supabase-js';
import { AllianceInfo, TeamInfo } from './types';

const supabaseUrl = 'https://api.ares-bot.com';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------- CACHE -------------------
const allTeamsCache: { data: TeamInfo[] | null } = { data: null };
const teamInfoCache = new Map<number, TeamInfo>();
const teamMatchesCache = new Map<number, AllianceInfo[]>();
const teamNameCache = new Map<number, string>();
let averageOPRsCache: any | null = null;

// ------------------- TEAMS -------------------
export async function getAllTeams(): Promise<TeamInfo[] | null> {
  if (allTeamsCache.data) return allTeamsCache.data;

  const { data } = await supabase
    .from('season_2024')
    .select('teamName, teamNumber, overallOPR, overallRank, location, autoOPR, teleOPR, endgameOPR, autoRank, teleRank, endgameRank')
    .order('overallRank', { ascending: true })
    .throwOnError();

  const result = data.map(row => ({
    teamName: row.teamName || `Team ${row.teamNumber}`,
    teamNumber: row.teamNumber,
    overallOPR: row.overallOPR || 0,
    overallRank: row.overallRank || 0,
    location: row.location || 'N/A',
    autoOPR: row.autoOPR || 0,
    teleOPR: row.teleOPR || 0,
    endgameOPR: row.endgameOPR || 0,
    autoRank: row.autoRank || 0,
    teleRank: row.teleRank || 0,
    endgameRank: row.endgameRank || 0,
    founded: 'N/A',
    highestScore: '',
    website: 'None',
    sponsors: '',
    achievements: 'None This Season',
  }));

  allTeamsCache.data = result;
  return result;
}

export async function getTeamInfo(teamNumber: number): Promise<TeamInfo | null> {
  if (teamInfoCache.has(teamNumber)) return teamInfoCache.get(teamNumber)!;

  const { data } = await supabase
    .from('season_2024')
    .select(`
      teamName, location, founded, website, sponsors, achievements,
      overallRank, teleRank, autoRank, endgameRank,
      autoOPR, teleOPR, endgameOPR, overallOPR, penalties,
      averagePlace, eventsAttended
    `)
    .eq('teamNumber', teamNumber)
    .single()
    .throwOnError();

  const team: TeamInfo = {
    teamName: data.teamName || `Team ${teamNumber}`,
    location: data.location || 'N/A',
    founded: data.founded?.toString() || 'N/A',
    teamNumber,
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
  };

  teamInfoCache.set(teamNumber, team);
  return team;
}

// ------------------- MATCHES -------------------
export async function getTeamMatches(teamNumber: number): Promise<AllianceInfo[] | null> {
  if (teamMatchesCache.has(teamNumber)) return teamMatchesCache.get(teamNumber)!;

  const { data } = await supabase
    .from('matches_2024')
    .select('date, totalPoints, matchType, win, tele, penalty, alliance, team_1, team_2, matchcode')
    .or(`team_1.eq.${teamNumber},team_2.eq.${teamNumber}`)
    .order('date')
    .throwOnError();

  const mapped = data.map(row => ({
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
  }));

  teamMatchesCache.set(teamNumber, mapped);
  return mapped;
}

export async function getTeamMatchCount(): Promise<number> {
  const { count, error } = await supabase
    .from('matches_2024')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Failed to fetch match count:', error.message);
    return 0;
  }

  return count ?? 0;
}

// ------------------- STATS -------------------
export async function getAverageOPRs() {
  if (averageOPRsCache) return averageOPRsCache;

  const { data } = await supabase
    .from('season_2024')
    .select('autoOPR, teleOPR, endgameOPR, overallOPR')
    .limit(500)
    .throwOnError();

  const total = { auto: 0, tele: 0, endgame: 0, overall: 0 };
  let count = 0;

  for (const row of data) {
    if (row.autoOPR != null) total.auto += row.autoOPR;
    if (row.teleOPR != null) total.tele += row.teleOPR;
    if (row.endgameOPR != null) total.endgame += row.endgameOPR;
    if (row.overallOPR != null) total.overall += row.overallOPR;
    count++;
  }

  averageOPRsCache = {
    autoOPR: total.auto / count,
    teleOPR: total.tele / count,
    endgameOPR: total.endgame / count,
    overallOPR: total.overall / count,
  };

  return averageOPRsCache;
}

// ------------------- UTIL -------------------
export function getWins(matches: AllianceInfo[]): number {
  return matches.reduce((count, match) => count + (match.win ? 1 : 0), 0);
}

export function getTeamRecord(matches: AllianceInfo[]): {
  wins: number;
  losses: number;
  winRate: number;
} {
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

export async function fetchTeamName(teamNumber: number): Promise<string | undefined> {
  if (teamNameCache.has(teamNumber)) return teamNameCache.get(teamNumber);

  const { data } = await supabase
    .from('season_2024')
    .select('teamName')
    .eq('teamNumber', teamNumber)
    .single()
    .throwOnError();

  const name = data?.teamName;
  if (name) teamNameCache.set(teamNumber, name);
  return name;
}

export const getCurrentUserTeam = async (): Promise<number | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }
  
  if (!data.user) return null;

  const { data: teamData, error: teamError } = await supabase
    .from('user_teams')
    .select('currentTeam')
    .eq('id', data.user.id)
    .single()
    .throwOnError();

  if (teamError) {
    console.error('Error fetching user team:', teamError);
    return null;
  }

  return teamData?.currentTeam || null;
};

export const getCurrentUserRole = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error.message);
    return null;
  }

  if (!data.user) return null;

  const { data: roleData, error: roleError } = await supabase
    .from('user_teams')
    .select('accountType')
    .eq('id', data.user.id)
    .single()
    .throwOnError();

  if (roleError) {
    console.error('Error fetching user role:', roleError);
    return null;
  }

  return roleData?.accountType || null;
};

export const getImage = async (teamNumber: number): Promise<string | null> => {
  if (teamNumber < 0) return null; 
  const { data: teamData, error: teamError } = await supabase
    .from('season_2024')
    .select('teamLogo')
    .eq('teamNumber', teamNumber)
    .single()
    .throwOnError();

  if (teamError) {
    console.error('Error fetching user team:', teamError);
    return null;
  }

  return teamData?.teamLogo || null;
};

export async function updateUserProfile({
  userId,
  displayName,
  teamNumber,
  accountType,
}: {
  userId: string
  displayName: string
  teamNumber: number
  accountType: string
}) {
  const { error } = await supabase
    .from('user_teams')
    .update({
      currentTeam: teamNumber,
      accountType,
      displayName,
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update user profile:', error.message)
    throw error
  }
}