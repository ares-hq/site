import { SupportedYear } from "./utils/types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  const { createClient } = require("@supabase/supabase-js");
  supabase = createClient(supabaseUrl, supabaseKey);
}

export async function fetchTeamName(teamNum: number, year: SupportedYear): Promise<string> {
  try {
    if (!supabase) {
      console.warn("Supabase not configured, using fallback team names");
      return `Team ${teamNum}`;
    }

    const { data } = await supabase
      .from('teams')
      .select('teamName')
      .eq('teamNumber', teamNum)
      .single();
    
    if (data?.teamName) {
      return data.teamName;
    }
  } catch (error) {
    console.warn(`Could not fetch team name for team ${teamNum}:`, error);
  }
  
  return `Team ${teamNum}`;
}

export async function batchFetchTeamNames(teamNumbers: number[], year: SupportedYear): Promise<Map<number, string>> {
  const uniqueTeams = [...new Set(teamNumbers)];
  const teamNamePromises = uniqueTeams.map(async (teamNum) => {
    try {
      const name = await fetchTeamName(teamNum, year);
      return [teamNum, name || `Team ${teamNum}`] as const;
    } catch {
      return [teamNum, `Team ${teamNum}`] as const;
    }
  });
  
  const results = await Promise.all(teamNamePromises);
  return new Map(results);
}