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
  matchNumberStr: string
): string {
  // Parse match number and series from string format like "P-6-1", "Q-21", "PR-1"
  const parts = matchNumberStr.split('-');
  const rawSeries = parts[1] || '0';      // For "P-6-1", series = "6"
  const matchNumber = parts[2] || '0';    // For "P-6-1", matchNumber = "1"
  
  // For finals matches, series is always 0
  const isFinalMatch = parts[0]?.toUpperCase() === 'F';
  const series = isFinalMatch ? '0' : rawSeries;
  
  return `${season}-${eventCode}-${tournamentLevel}-${series}-${matchNumber}`;
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
  matchNumberStr: string
): void {
  const cacheKey = getScoreCacheKey(season, eventCode, tournamentLevel, matchNumberStr);
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
  series?: number,
  matchNumber?: number
): Promise<any | null> {
  const apiClient = new ApiClient();

  try {
    const response = await apiClient.fetchMatchScores(season, eventCode, tournamentLevel, series);
    
    // If looking for a specific match in playoffs, find by both series and match number
    if (tournamentLevel === 'playoff' && series !== undefined && matchNumber !== undefined && response.matchScores?.length > 0) {
      const specificMatch = response.matchScores.find((match: any) => {
        // Handle different match level names (PLAYOFF, Semifinal, Final, etc.)
        const matchLevelUpper = (match.matchLevel || '').toUpperCase();
        const isPlayoffMatch = ['PLAYOFF', 'SEMIFINAL', 'FINAL', 'QUARTERFINAL'].includes(matchLevelUpper);
        
        if (!isPlayoffMatch) return false;
        
        // For finals, the series is always 0
        const expectedSeries = matchLevelUpper === 'FINAL' ? 0 : series;
        
        return match.matchSeries === expectedSeries && match.matchNumber === matchNumber;
      });
      return specificMatch || null;
    }
    
    // For qualification matches, find by match number
    if (tournamentLevel === 'qual' && matchNumber !== undefined && response.matchScores?.length > 0) {
      const specificMatch = response.matchScores.find((match: any) => 
        match.matchNumber === matchNumber
      );
      return specificMatch || null;
    }
    
    // If no specific match criteria, return first match or all matches
    if (response.matchScores?.length > 0) {
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
  matchNumberStr: string
): Promise<any | null> {
  const cacheKey = getScoreCacheKey(
    season,
    eventCode,
    tournamentLevel,
    matchNumberStr
  );

  // Parse series and match number from string for API call
  const parts = matchNumberStr.split('-');
  const series = parseInt(parts[1] || '0') || 0;      // For "P-6-1", series = 6
  const matchNumber = parseInt(parts[2] || '0') || 0;  // For "P-6-1", matchNumber = 1
  
  // For qualification matches, use the series as the match number ("Q-21" -> matchNumber = 21)
  // For finals matches, series is always 0
  const isFinalMatch = parts[0]?.toUpperCase() === 'F';
  const actualSeries = tournamentLevel === 'qual' ? undefined : (isFinalMatch ? 0 : series);
  const actualMatchNumber = tournamentLevel === 'qual' ? series : matchNumber;
  
  // Check cache first
  if (scoreDetailsCache.has(cacheKey)) {
    return scoreDetailsCache.get(cacheKey);
  }

  // Fetch from API
  const scores = await getMatchScoreDetails(
    season,
    eventCode,
    tournamentLevel,
    actualSeries,
    actualMatchNumber
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
  matchNumbers: string[]
): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  const uncachedMatches: string[] = [];

  // Check cache for all matches
  for (const matchNumStr of matchNumbers) {
    const cacheKey = getScoreCacheKey(
      season,
      eventCode,
      tournamentLevel,
      matchNumStr
    );
    if (scoreDetailsCache.has(cacheKey)) {
      results.set(matchNumStr, scoreDetailsCache.get(cacheKey));
    } else {
      uncachedMatches.push(matchNumStr);
    }
  }

  // Fetch uncached matches
  if (uncachedMatches.length > 0) {
    console.log(
      `Fetching ${uncachedMatches.length} uncached matches from API`
    );

    const fetchPromises = uncachedMatches.map(async (matchNumStr) => {
      // Parse series and match number from string for API call
      const parts = matchNumStr.split('-');
      const series = parseInt(parts[1] || '0') || 0;      // For "P-6-1", series = 6
      const matchNumber = parseInt(parts[2] || '0') || 0;  // For "P-6-1", matchNumber = 1
      
      // For qualification matches, use the series as the match number
      // For finals matches, series is always 0
      const isFinalMatch = parts[0]?.toUpperCase() === 'F';
      const actualSeries = tournamentLevel === 'qual' ? undefined : (isFinalMatch ? 0 : series);
      const actualMatchNumber = tournamentLevel === 'qual' ? series : matchNumber;
      
      const scores = await getMatchScoreDetails(
        season,
        eventCode,
        tournamentLevel,
        actualSeries,
        actualMatchNumber
      );

      if (scores !== null) {
        const cacheKey = getScoreCacheKey(
          season,
          eventCode,
          tournamentLevel,
          matchNumStr
        );
        scoreDetailsCache.set(cacheKey, scores);
        results.set(matchNumStr, scores);
      }

      return { matchNumStr, scores };
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