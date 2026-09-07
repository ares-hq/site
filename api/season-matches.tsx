import { supabase } from './dashboardInfo';
import { SupportedYear } from './utils/types';

/**
 * Season-wide match analytics, read straight from the `matches_<year>` table.
 * Each row is one alliance's result in a match, so a "performance" is one
 * alliance (its two teams + score) in one match.
 */

export type MatchType = 'QUALIFICATION' | 'PLAYOFF' | 'PRACTICE';

export interface AlliancePerformance {
  matchCode: string;
  /** event code the match belongs to, when the row carries one */
  eventCode?: string;
  date: string;
  matchType: MatchType;
  alliance: 'red' | 'blue';
  score: number;
  tele: number;
  penalty: number;
  win: boolean;
  team1?: { teamNumber: number; teamName: string };
  team2?: { teamNumber: number; teamName: string };
}

export interface SeasonMatchStats {
  /** total non-practice alliance results in the season */
  total: number;
  average: number;
  median: number;
  p90: number;
  max: number;
  /** win/decision margin — average absolute point gap between alliances */
  sampleSize: number;
}

const EMPTY_STATS: SeasonMatchStats = {
  total: 0,
  average: 0,
  median: 0,
  p90: 0,
  max: 0,
  sampleSize: 0,
};

const leaderCache = new Map<string, AlliancePerformance[]>();
const statsCache = new Map<string, SeasonMatchStats>();

function table(year: SupportedYear) {
  return `matches_${year}`;
}

/** `team_1`/`team_2` come back as an embedded row, a bare team-number, or null. */
function extractTeam(v: any): { teamNumber: number; teamName: string } | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') {
    return v > 0 ? { teamNumber: v, teamName: `Team ${v}` } : undefined;
  }
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? { teamNumber: n, teamName: `Team ${n}` } : undefined;
  }
  const num = v.teamNumber ?? v.teamnumber ?? v.number ?? v.team ?? v.id;
  if (!num) return undefined;
  const n = Number(num);
  return { teamNumber: n, teamName: v.teamName || v.nameShort || v.name || `Team ${n}` };
}

function mapRow(r: any): AlliancePerformance {
  const ev = r.eventcode ?? r.eventCode ?? r.event_code ?? r.event ?? undefined;
  return {
    matchCode: r.matchcode ?? r.matchCode ?? '',
    eventCode: ev ? String(ev) : undefined,
    date: r.date,
    matchType: r.matchType,
    alliance: r.alliance,
    score: r.totalPoints ?? 0,
    tele: r.tele ?? 0,
    penalty: r.penalty ?? 0,
    win: !!r.win,
    team1: extractTeam(r.team_1),
    team2: extractTeam(r.team_2),
  };
}

type LeaderOpts = {
  matchType?: 'QUALIFICATION' | 'PLAYOFF';
  limit?: number;
  offset?: number;
  orderBy?: 'score' | 'date';
  asc?: boolean;
};

function leaderQuery(year: SupportedYear, opts: LeaderOpts) {
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;
  // `*` so we pick up whatever the event column is called (eventcode / eventCode / event_code / event).
  let q = supabase
    .from(table(year))
    .select('*')
    .neq('matchType', 'PRACTICE')
    .order(opts.orderBy === 'date' ? 'date' : 'totalPoints', { ascending: !!opts.asc })
    .range(offset, offset + limit - 1);
  if (opts.matchType) q = q.eq('matchType', opts.matchType);
  return q;
}

/**
 * A page of alliance performances, ordered on the server so paging stays consistent
 * across the whole season without ever pulling every row at once.
 */
export async function getSeasonMatchLeaders(
  year: SupportedYear,
  opts: LeaderOpts = {},
): Promise<AlliancePerformance[]> {
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;
  const key = `${year}:${opts.matchType ?? 'ALL'}:${opts.orderBy ?? 'score'}:${opts.asc ? 'a' : 'd'}:${offset}:${limit}`;
  if (leaderCache.has(key)) return leaderCache.get(key)!;

  try {
    const res: any = await leaderQuery(year, opts);
    if (res.error || !res.data) {
      console.error('getSeasonMatchLeaders failed:', res.error?.message);
      return [];
    }
    const mapped = res.data.map(mapRow);
    leaderCache.set(key, mapped);
    return mapped;
  } catch (err) {
    console.error('getSeasonMatchLeaders error:', err);
    return [];
  }
}

/** Every non-practice alliance result a team appeared in this season (most recent first). */
export async function getTeamSeasonPerformances(
  year: SupportedYear,
  teamNumber: number,
): Promise<AlliancePerformance[]> {
  const key = `team:${year}:${teamNumber}`;
  if (leaderCache.has(key)) return leaderCache.get(key)!;
  try {
    const { data, error } = await supabase
      .from(table(year))
      .select('date, totalPoints, matchType, win, tele, penalty, alliance, team_1, team_2, matchcode')
      .or(`team_1.eq.${teamNumber},team_2.eq.${teamNumber}`)
      .neq('matchType', 'PRACTICE')
      .order('date', { ascending: false })
      .limit(400);
    if (error || !data) {
      console.error('getTeamSeasonPerformances failed:', error?.message);
      return [];
    }
    const mapped = data.map(mapRow);
    leaderCache.set(key, mapped);
    return mapped;
  } catch (err) {
    console.error('getTeamSeasonPerformances error:', err);
    return [];
  }
}

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/** Aggregate scoring stats for the season (sampled). */
export async function getSeasonMatchStats(
  year: SupportedYear,
  opts: { matchType?: 'QUALIFICATION' | 'PLAYOFF' } = {},
): Promise<SeasonMatchStats> {
  const key = `${year}:${opts.matchType ?? 'ALL'}`;
  if (statsCache.has(key)) return statsCache.get(key)!;

  try {
    let countQ = supabase
      .from(table(year))
      .select('*', { count: 'exact', head: true })
      .neq('matchType', 'PRACTICE');
    if (opts.matchType) countQ = countQ.eq('matchType', opts.matchType);

    let sampleQ = supabase
      .from(table(year))
      .select('totalPoints')
      .neq('matchType', 'PRACTICE')
      .order('date', { ascending: false })
      .limit(6000);
    if (opts.matchType) sampleQ = sampleQ.eq('matchType', opts.matchType);

    const [{ count }, { data }] = await Promise.all([countQ, sampleQ]);
    if (!data || data.length === 0) return EMPTY_STATS;

    const scores = data
      .map((r: any) => r.totalPoints ?? 0)
      .filter((n: number) => Number.isFinite(n))
      .sort((a: number, b: number) => a - b);

    const sum = scores.reduce((a: number, b: number) => a + b, 0);
    const stats: SeasonMatchStats = {
      total: count ?? scores.length,
      average: +(sum / scores.length).toFixed(1),
      median: percentile(scores, 50),
      p90: percentile(scores, 90),
      max: scores[scores.length - 1] ?? 0,
      sampleSize: scores.length,
    };
    statsCache.set(key, stats);
    return stats;
  } catch (err) {
    console.error('getSeasonMatchStats error:', err);
    return EMPTY_STATS;
  }
}
