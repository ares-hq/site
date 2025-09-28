import { createClient } from '@supabase/supabase-js';
import { AllianceInfo, TeamInfo } from './types';

const supabaseUrl = 'https://api.ares-bot.com';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------- TYPES -------------------
export type SupportedYear = 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025;

// ------------------- CACHE -------------------
const allTeamsCache = new Map<SupportedYear, TeamInfo[] | null>();
const teamInfoCache = new Map<string, TeamInfo>();
const teamMatchesCache = new Map<string, AllianceInfo[]>();
const teamNameCache = new Map<string, string>();
const averageOPRsCache = new Map<SupportedYear, any>();

// ------------------- HELPER FUNCTIONS -------------------
function getSeasonTable(year: SupportedYear): string {
  return `season_${year}`;
}

function getMatchesTable(year: SupportedYear): string {
  return `matches_${year}`;
}

function getCacheKey(year: SupportedYear, teamNumber: number): string {
  return `${year}-${teamNumber}`;
}

// ------------------- TEAMS -------------------
export async function getAllTeams(year: SupportedYear): Promise<TeamInfo[] | null> {
  if (allTeamsCache.has(year) && allTeamsCache.get(year)) {
    return allTeamsCache.get(year)!;
  }

  const { data } = await supabase
    .from(getSeasonTable(year))
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

  allTeamsCache.set(year, result);
  return result;
}

export async function getTeamInfo(teamNumber: number, year: SupportedYear): Promise<TeamInfo | null> {
  const cacheKey = getCacheKey(year, teamNumber);
  
  if (teamInfoCache.has(cacheKey)) {
    return teamInfoCache.get(cacheKey)!;
  }

  const { data } = await supabase
    .from(getSeasonTable(year))
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

  teamInfoCache.set(cacheKey, team);
  return team;
}

// ------------------- MATCHES -------------------
export async function getTeamMatches(teamNumber: number, year: SupportedYear): Promise<AllianceInfo[] | null> {
  const cacheKey = getCacheKey(year, teamNumber);
  
  if (teamMatchesCache.has(cacheKey)) {
    return teamMatchesCache.get(cacheKey)!;
  }

  const { data } = await supabase
    .from(getMatchesTable(year))
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

  teamMatchesCache.set(cacheKey, mapped);
  return mapped;
}

export async function getTeamMatchCount(year: SupportedYear): Promise<number> {
  const { count, error } = await supabase
    .from(getMatchesTable(year))
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Failed to fetch match count:', error.message);
    return 0;
  }

  return count ?? 0;
}

// ------------------- STATS -------------------
export async function getAverageOPRs(year: SupportedYear) {
  if (averageOPRsCache.has(year)) {
    return averageOPRsCache.get(year);
  }

  const { data } = await supabase
    .from(getSeasonTable(year))
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

  const result = {
    autoOPR: total.auto / count,
    teleOPR: total.tele / count,
    endgameOPR: total.endgame / count,
    overallOPR: total.overall / count,
  };

  averageOPRsCache.set(year, result);
  return result;
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

export async function fetchTeamName(teamNumber: number, year: SupportedYear): Promise<string | undefined> {
  const cacheKey = getCacheKey(year, teamNumber);
  
  if (teamNameCache.has(cacheKey)) {
    return teamNameCache.get(cacheKey);
  }

  const { data } = await supabase
    .from(getSeasonTable(year))
    .select('teamName')
    .eq('teamNumber', teamNumber)
    .single()
    .throwOnError();

  const name = data?.teamName;
  if (name) teamNameCache.set(cacheKey, name);
  return name;
}

export async function getImage(teamNumber: number, year: SupportedYear): Promise<string | null> {
  if (teamNumber < 0) return null; 
  
  const { data: teamData, error: teamError } = await supabase
    .from(getSeasonTable(year))
    .select('teamLogo')
    .eq('teamNumber', teamNumber)
    .single()
    .throwOnError();

  if (teamError) {
    console.error('Error fetching team logo:', teamError);
    return null;
  }

  return teamData?.teamLogo || null;
}

// ------------------- CACHE MANAGEMENT -------------------
export function clearCache(): void {
  allTeamsCache.clear();
  teamInfoCache.clear();
  teamMatchesCache.clear();
  teamNameCache.clear();
  averageOPRsCache.clear();
}

export function clearCacheForYear(year: SupportedYear): void {
  allTeamsCache.delete(year);
  averageOPRsCache.delete(year);
  
  // Clear team-specific caches for the year
  for (const key of teamInfoCache.keys()) {
    if (key.startsWith(`${year}-`)) {
      teamInfoCache.delete(key);
    }
  }
  
  for (const key of teamMatchesCache.keys()) {
    if (key.startsWith(`${year}-`)) {
      teamMatchesCache.delete(key);
    }
  }
  
  for (const key of teamNameCache.keys()) {
    if (key.startsWith(`${year}-`)) {
      teamNameCache.delete(key);
    }
  }
}

// ------------------- MULTI-YEAR UTILITIES -------------------
export async function getTeamHistoricalData(teamNumber: number, years: SupportedYear[] = [2019, 2020, 2021, 2022, 2023, 2024, 2025]): Promise<Map<SupportedYear, TeamInfo | null>> {
  const historicalData = new Map<SupportedYear, TeamInfo | null>();
  
  await Promise.all(
    years.map(async (year) => {
      try {
        const teamInfo = await getTeamInfo(teamNumber, year);
        historicalData.set(year, teamInfo);
      } catch (error) {
        console.warn(`No data found for team ${teamNumber} in year ${year}`);
        historicalData.set(year, null);
      }
    })
  );
  
  return historicalData;
}

export async function getAvailableYears(): Promise<SupportedYear[]> {
  // You could make this dynamic by querying your database for available tables
  // For now, returning all supported years
  return [2019, 2020, 2021, 2022, 2023, 2024, 2025];
}

// ------------------- USER MANAGEMENT (Year-agnostic) -------------------
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

export async function updateUserProfile({
  displayName,
  teamNumber,
  accountType,
}: {
  displayName: string
  teamNumber: number
  accountType: string
}) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    console.error("Failed to get current user:", userError?.message);
    throw new Error(userError?.message || "No user found");
  }
  const userId = userData.user.id;
  
  // 1. Update the displayName in auth.user_metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { displayName },
  })

  if (authError) {
    console.error("Failed to update auth user metadata:", authError.message)
    throw new Error(authError.message)
  }

  // 2. Update team/accountType in user_teams table
  const { error: teamError } = await supabase
    .from("user_teams")
    .update({
      currentTeam: teamNumber,
      accountType,
    })
    .eq("id", userId)

  if (teamError) {
    console.error("Failed to update user_teams:", teamError.message)
    throw new Error(teamError.message)
  }
}

export const getName = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const name = userData?.user?.user_metadata.displayName || userData?.user?.user_metadata.display_name;

    if (!name) {
      console.error('User not logged in');
      return;
    }

    return name;
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

export const deleteAccount = async () => {
  const session = await supabase.auth.getSession();
  const user = await supabase.auth.getUser();

  const res = await fetch('https://api.ares-bot.com/functions/v1/delete-user', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.data.session?.access_token}`,
    },
    body: JSON.stringify({ userId: user.data.user?.id })
  });

  const result = await res.json();

  if (res.ok) {
    await supabase.auth.signOut();
  } else {
    console.error('Delete error:', result.error);
  }
};