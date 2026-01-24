import { SupportedYear } from "./types";
import { fetchWithRetry } from "./utils";

const getHeaders = () => ({
  apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
});

export class ApiClient {
  async fetchEvents(season: SupportedYear, eventCode?: string, teamNumber?: number) {
    const params = new URLSearchParams();
    if (eventCode) params.append('eventCode', eventCode);
    if (teamNumber) params.append('teamNumber', teamNumber.toString());
    
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/events${params.toString() ? '?' + params : ''}`;
    return fetchWithRetry(url, getHeaders());
  }

  async fetchRankings(season: SupportedYear, eventCode: string, teamNumber: number) {
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/rankings/${eventCode}?teamNumber=${teamNumber}`;
    return fetchWithRetry(url, getHeaders());
  }

  async fetchAwards(season: SupportedYear, eventCode: string, teamNumber: number) {
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/awards/${teamNumber}?eventCode=${eventCode}`;
    return fetchWithRetry(url, getHeaders());
  }

  async fetchMatches(season: SupportedYear, eventCode: string) {
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/matches/${eventCode}`;
    return fetchWithRetry(url, getHeaders()).catch(err => {
      console.error(`Matches fetch failed for ${eventCode}:`, err);
      return [];
    });
  }

  async fetchQualScores(season: SupportedYear, eventCode: string) {
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/scores/${eventCode}/qual`;
    return fetchWithRetry(url, getHeaders()).catch(err => {
      console.error(`Qual scores fetch failed for ${eventCode}:`, err);
      return { matchScores: [] };
    });
  }

  async fetchPlayoffScores(season: SupportedYear, eventCode: string) {
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/scores/${eventCode}/playoff`;
    return fetchWithRetry(url, getHeaders()).catch(err => {
      console.error(`Playoff scores fetch failed for ${eventCode}:`, err);
      return { matchScores: [] };
    });
  }

  async fetchTeamEvents(season: SupportedYear, teamNumber: number) {
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/teams/${teamNumber}/events`;
    return fetchWithRetry(url, getHeaders());
  }

  async fetchTeams(season: SupportedYear, eventCode: string) {
    const url = `https://api.ares-bot.com/functions/v1/first/${season}/teams?eventCode=${eventCode}`;
    return fetchWithRetry(url, getHeaders()).catch(err => {
      console.error(`Playoff scores fetch failed for ${eventCode}:`, err);
      return { teams: [] };
    });
  }

  async fetchMatchScores(season: SupportedYear, eventCode: string, tournamentLevel: "qual" | "playoff" | "practice", matchNumber?: number) {
    if (tournamentLevel === "practice") {
      const matchesResponse = await this.fetchMatches(season, eventCode);
      const matchesArray = matchesResponse?.matches || [];
      const practiceMatches = Array.isArray(matchesArray) ? matchesArray.filter((match: any) => match.tournamentLevel === 'PRACTICE') : [];

      // Filter by specific match number if provided
      const filteredMatches = matchNumber !== undefined 
        ? practiceMatches.filter((match: any) => match.matchNumber === matchNumber)
        : practiceMatches;

      const transformedMatches = filteredMatches.map((match: any) => ({
        ...match,
        alliances: [
          {
            // Blue alliance (index 0)
            totalPoints: match.scoreBlueFinal || 0,
            foulPointsCommitted: match.scoreBlueFoul || 0,
            alliance: 'blue'
          },
          {
            // Red alliance (index 1)  
            totalPoints: match.scoreRedFinal || 0,
            foulPointsCommitted: match.scoreRedFoul || 0,
            alliance: 'red'
          }
        ]
      }));
      
      return { matchScores: transformedMatches };
    }
    
    let url = `https://api.ares-bot.com/functions/v1/first/${season}/scores/${eventCode}/${tournamentLevel}`;
    if (matchNumber !== undefined) {
      const paramName = tournamentLevel === "playoff" ? "matchSeries" : "matchNumber";
      url += `?${paramName}=${matchNumber}`;
    }
    return fetchWithRetry(url, getHeaders());
  }
}
