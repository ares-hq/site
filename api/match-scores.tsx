import { ApiClient } from "./utils/api-client";
import { SupportedYear } from "./utils/types";

/**
 * Cache for match score details to avoid repeated API calls
 * Structure: "season-eventCode-tournamentLevel-matchNumber" -> scoreData
 */
const scoreDetailsCache = new Map<string, any>();

/**
 * Generate a cache key for match score details
 */
function getScoreCacheKey(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: string,
  matchNumber: number
): string {
  return `${season}-${eventCode}-${tournamentLevel}-${matchNumber}`;
}

/**
 * Clear the entire score cache (useful for testing or manual refresh)
 */
export function clearScoreCache(): void {
  scoreDetailsCache.clear();
  console.log("Score cache cleared");
}

/**
 * Clear a specific match from the cache
 */
export function clearCacheEntry(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: string,
  matchNumber: number
): void {
  const cacheKey = getScoreCacheKey(season, eventCode, tournamentLevel, matchNumber);
  scoreDetailsCache.delete(cacheKey);
  console.log(`Cleared cache for match: ${cacheKey}`);
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  size: number;
  entries: string[];
} {
  return {
    size: scoreDetailsCache.size,
    entries: Array.from(scoreDetailsCache.keys()),
  };
}

/**
 * Fetch detailed score breakdown for a specific match from the API
 * @param season - The season year (e.g., 2024)
 * @param eventCode - The event code (e.g., "USNYRO")
 * @param tournamentLevel - "qual" or "playoff"
 * @param matchNumber - Optional specific match number (for qual) or series number (for playoff)
 */
export async function getMatchScoreDetails(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: "qual" | "playoff" | "practice",
  matchNumber?: number
): Promise<any | null> {
  const apiClient = new ApiClient();

  try {
    const response = await apiClient.fetchMatchScores(season, eventCode, tournamentLevel, matchNumber);

    // If looking for a specific match, return just that match's scores
    if (matchNumber !== undefined && response.matchScores?.length > 0) {
      return response.matchScores[0];
    }

    return response.matchScores || null;
  } catch (error) {
    console.error("Error fetching match score details:", error);
    return null;
  }
}

/**
 * Get score details with caching
 * Checks cache first, fetches from API if not cached
 */
export async function getCachedMatchScoreDetails(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: "qual" | "playoff" | "practice",
  matchNumber: number
): Promise<any | null> {
  const cacheKey = getScoreCacheKey(
    season,
    eventCode,
    tournamentLevel,
    matchNumber
  );

  // Check cache first
  if (scoreDetailsCache.has(cacheKey)) {
    console.log(`Cache hit for: ${cacheKey}`);
    return scoreDetailsCache.get(cacheKey);
  }

  console.log(`Cache miss for: ${cacheKey}, fetching from API...`);

  // Fetch from API
  const scores = await getMatchScoreDetails(
    season,
    eventCode,
    tournamentLevel,
    matchNumber
  );

  // Cache the result (even if null, to avoid repeated failed requests)
  if (scores !== null) {
    scoreDetailsCache.set(cacheKey, scores);
    console.log(`Cached match scores: ${cacheKey}`);
  }

  return scores;
}

/**
 * Batch fetch multiple matches with caching
 * More efficient than calling getCachedMatchScoreDetails multiple times
 */
export async function getCachedMatchScoreDetailsBatch(
  season: SupportedYear,
  eventCode: string,
  tournamentLevel: "qual" | "playoff" | "practice",
  matchNumbers: number[]
): Promise<Map<number, any>> {
  const results = new Map<number, any>();
  const uncachedMatches: number[] = [];

  // Check cache for all matches
  for (const matchNum of matchNumbers) {
    const cacheKey = getScoreCacheKey(
      season,
      eventCode,
      tournamentLevel,
      matchNum
    );

    if (scoreDetailsCache.has(cacheKey)) {
      results.set(matchNum, scoreDetailsCache.get(cacheKey));
    } else {
      uncachedMatches.push(matchNum);
    }
  }

  // Fetch uncached matches
  if (uncachedMatches.length > 0) {
    console.log(
      `Fetching ${uncachedMatches.length} uncached matches from API`
    );

    const fetchPromises = uncachedMatches.map(async (matchNum) => {
      const scores = await getMatchScoreDetails(
        season,
        eventCode,
        tournamentLevel,
        matchNum
      );

      if (scores !== null) {
        const cacheKey = getScoreCacheKey(
          season,
          eventCode,
          tournamentLevel,
          matchNum
        );
        scoreDetailsCache.set(cacheKey, scores);
        results.set(matchNum, scores);
      }

      return { matchNum, scores };
    });

    await Promise.all(fetchPromises);
  }

  console.log(
    `Cache summary: ${matchNumbers.length - uncachedMatches.length} cached, ${uncachedMatches.length} fetched`
  );

  return results;
}

/**
 * Fetch all match scores for an event (qual and playoff)
 */
export async function getAllEventMatchScores(
  season: SupportedYear,
  eventCode: string
): Promise<{ qual: any[] | null; playoff: any[] | null }> {
  try {
    const apiClient = new ApiClient();

    const [qualRes, playoffRes] = await Promise.all([
      apiClient.fetchQualScores(season, eventCode),
      apiClient.fetchPlayoffScores(season, eventCode),
    ]);

    return {
      qual: qualRes.matchScores || null,
      playoff: playoffRes.matchScores || null,
    };
  } catch (error) {
    console.error(`Error fetching all match scores for ${eventCode}:`, error);
    return { qual: null, playoff: null };
  }
}