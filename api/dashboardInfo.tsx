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
      achievements
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
    website: data.website || '',
    sponsors: data.sponsors || '',
    achievements: data.achievements || '',
  } as TeamInfo;
}