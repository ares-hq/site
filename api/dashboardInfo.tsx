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
      overallOPR
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