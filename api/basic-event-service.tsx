import { ApiClient } from "./utils/api-client";
import { BasicEventInfo, EventInfo, SupportedYear } from "./utils/types";
// import { processMatches } from "./match-processor";
// import { calculateTeamOPR } from "./algorithms/calcOPR";
// import { formatOrdinal } from "./utils/utils";

// /**
//  * Merges match schedules with detailed score data.
//  */
// function mergeMatchData(schedule: any[], qualScores: any[], playoffScores: any[]) {
//   const matchMap = new Map();
//   const getMatchKey = (m: any) => {
//     const level = m.tournamentLevel || m.matchLevel || 'UNKNOWN';
//     const matchNum = m.matchNumber;
//     const series = m.series || 0;
//     return `${level}-${matchNum}-${series}`;
//   };

//   schedule.forEach(m => matchMap.set(getMatchKey(m), m));
//   [...qualScores, ...playoffScores].forEach(m => {
//     const key = getMatchKey(m);
//     if (matchMap.has(key)) {
//       const existing = matchMap.get(key);
//       matchMap.set(key, { ...existing, ...m });
//     }
//   });

//   return Array.from(matchMap.values());
// }

// /**
//  * Calculates win/loss/tie record and average scores for a specific team.
//  */
// function calculateTeamStats(matches: any[], team: number) {
//   let wins = 0, ties = 0, totalScore = 0;
//   const teamMatches = matches.filter(m => m.matchType !== 'PRACTICE');

//   teamMatches.forEach(m => {
//     const isRed = m.redAlliance.team_1?.teamNumber === team || m.redAlliance.team_2?.teamNumber === team;
//     const myScore = isRed ? m.redAlliance.totalPoints : m.blueAlliance.totalPoints;
//     const oppScore = isRed ? m.blueAlliance.totalPoints : m.redAlliance.totalPoints;

//     if (myScore > oppScore) wins++;
//     else if (myScore === oppScore) ties++;
//     totalScore += myScore;
//   });

//   const count = teamMatches.length;
//   return {
//     winRate: count ? Number(((wins / count) * 100).toFixed(1)) : 0,
//     averageScore: count ? Number((totalScore / count).toFixed(2)) : 0,
//     record: `${wins}-${count - wins - ties}-${ties}`
//   };
// }

// /**
//  * Check if an event is currently live/ongoing
//  */
// function isEventLive(event: any): boolean {
//   const now = new Date();
//   now.setHours(0, 0, 0, 0);
  
//   if (!event.dateStart || !event.dateEnd) return false;
  
//   const startDate = new Date(event.dateStart);
//   startDate.setHours(0, 0, 0, 0);
  
//   const endDate = new Date(event.dateEnd);
//   endDate.setHours(23, 59, 59, 999);
  
//   return now >= startDate && now <= endDate;
// }

/**
 * Fetch basic event information for fast loading
 * Minimal data, no team counts or detailed stats
 */
export async function getEventsBasic(
  season: SupportedYear,
  includeCompleted = false
): Promise<BasicEventInfo[]> {
  try {
    const apiClient = new ApiClient();
    const eventsRes = await apiClient.fetchEvents(season);

    if (!eventsRes.events?.length) {
      console.log("No events found for season");
      return [];
    }

    let filteredEvents = eventsRes.events;

    if (!includeCompleted) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filteredEvents = eventsRes.events.filter((event: any) => {
        if (!event.dateEnd && !event.dateStart) return false;
        const eventDate = new Date(event.dateEnd || event.dateStart);
        eventDate.setHours(23, 59, 59, 999);
        return eventDate >= today;
      });
    }

    const basicEvents: BasicEventInfo[] = filteredEvents.map((event: any) => ({
      name: event.name || "Unknown Event",
      eventCode: event.code || "UNKNOWN",
      location: event.venue || event.city || "TBD",
      date: event.dateStart
        ? new Date(event.dateStart).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "TBD",
      rawDate: event.dateStart || event.dateEnd || "",
      type: event.type,
    }));

    basicEvents.sort(
      (b, a) =>
        new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
    );

    return basicEvents;
  } catch (error) {
    console.error("Error fetching basic events:", error);
    return [];
  }
}

/**
 * Fetch upcoming events with optional team counts
 * More detailed than getEventsBasic but still lightweight
 */
export async function getUpcomingEvents(
  season: SupportedYear,
  team?: number,
  includeTeamCounts = true,
  includeCompleted = false
): Promise<EventInfo[]> {
  try {
    const apiClient = new ApiClient();
    const eventsRes = await apiClient.fetchEvents(season, undefined, team);

    if (!eventsRes.events?.length) {
      console.log("No events found");
      return [];
    }

    let filteredEvents = eventsRes.events;

    if (!includeCompleted) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filteredEvents = eventsRes.events.filter((event: any) => {
        if (!event.dateEnd && !event.dateStart) return false;
        const eventDate = new Date(event.dateEnd || event.dateStart);
        eventDate.setHours(23, 59, 59, 999);
        return eventDate > today;
      });
    }

    const eventPromises = filteredEvents.map(
      async (event: any): Promise<EventInfo> => {
        const apiClient = new ApiClient();
        let teamCount = 0;

        // Optionally fetch team count from FIRST API
        if (includeTeamCounts) {
          try {
            const teamsRes = await apiClient.fetchTeams(season, event.code);

            if (teamsRes.ok) {
              const teamsData = await teamsRes.json();
              teamCount =
                teamsData.teamCountTotal || teamsData.teams?.length || 0;
            }
          } catch (error) {
            console.error(
              `Error fetching team count for event ${event.code}:`,
              error
            );
          }
        }

        // // Check if event is currently live/ongoing
        // const eventIsLive = isEventLive(event);
        
        // // For live events with a specified team, fetch and process match data
        // if (eventIsLive && team) {
        //   try {
        //     const [rankR, awardR, qualR, playR, matchR, teamR] = await Promise.all([
        //       apiClient.fetchRankings(season, event.code, team),
        //       apiClient.fetchAwards(season, event.code, team),
        //       apiClient.fetchQualScores(season, event.code),
        //       apiClient.fetchPlayoffScores(season, event.code),
        //       apiClient.fetchMatches(season, event.code),
        //       apiClient.fetchTeams(season, event.code)
        //     ]);

        //     const allMatches = mergeMatchData(
        //       matchR.matches || [], 
        //       qualR.matchScores || [], 
        //       playR.matchScores || []
        //     );
            
        //     // Only process if matches exist
        //     if (allMatches.length > 0) {
        //       const teamNameMap = new Map<number, string>(
        //         teamR.teams?.map((t: any) => [t.teamNumber as number, t.nameShort as string])
        //       );
        //       const allProcessed = processMatches(allMatches, season, teamNameMap);
              
        //       // Filter matches involving the specific team
        //       const teamMatches = allProcessed.filter(m => 
        //         [m.redAlliance, m.blueAlliance].some(a => 
        //           a.team_1?.teamNumber === team || a.team_2?.teamNumber === team
        //         )
        //       );

        //       const stats = calculateTeamStats(teamMatches, team);
        //       const opr = calculateTeamOPR(
        //         allProcessed.filter(m => m.matchType === 'QUALIFICATION'), 
        //         team
        //       );
              
        //       return {
        //         ...stats,
        //         OPR: opr,
        //         name: event.name || "Unknown Event",
        //         eventCode: event.code || "UNKNOWN",
        //         location: event.venue || event.city || "TBD",
        //         date: new Date(event.dateStart).toDateString(),
        //         teamCount,
        //         place: formatOrdinal(rankR.rankings?.[0]?.rank),
        //         achievements: awardR.awards?.map((a: any) => a.name).join(' • ') || 'In Progress',
        //         matches: teamMatches,
        //         type: event.type,
        //       };
        //     }
        //   } catch (error) {
        //     console.error(`Error processing live event ${event.code}:`, error);
        //     // Fall through to return basic event info
        //   }
        // }

        // Default return for non-live or events without processed matches
        return {
          name: event.name || "Unknown Event",
          eventCode: event.code || "UNKNOWN",
          location: event.venue || event.city || "TBD",
          date: new Date(event.dateStart).toDateString(),
          teamCount,
          winRate: 0,
          OPR: 0,
          averageScore: 0,
          place: "TBD",
          record: "TBD",
          matches: [],
          achievements: "Event Not Started",
          // achievements: eventIsLive ? "Event In Progress" : "Event Not Started",
          type: event.type,
        };
      }
    );

    const eventsWithData = await Promise.all(eventPromises);

    eventsWithData.sort((b, a) => {
      const dateA = new Date(a.date || "");
      const dateB = new Date(b.date || "");
      return dateA.getTime() - dateB.getTime();
    });

    console.log(`Returning ${eventsWithData.length} upcoming events`);

    return eventsWithData;
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    return [];
  }
}

/**
 * Get only upcoming and ongoing/live events (excludes completed events)
 */
export async function getUpcomingEventsOnly(
  season: SupportedYear,
  team?: number
): Promise<EventInfo[]> {
  const allEvents = await getUpcomingEvents(season, team, true, false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return allEvents.filter((event) => {
    if (!event.date || event.date === "TBD") return true; // Include events with unknown dates
    const eventDate = new Date(event.date);
    return eventDate > today; // Include live events (events happening today or in the future)
  });
}

/**
 * Get past completed events
 */
export async function getPastEvents(
  season: SupportedYear,
  team?: number
): Promise<EventInfo[]> {
  try {
    const apiClient = new ApiClient();
    const eventsRes = await apiClient.fetchEvents(season, undefined, team);

    if (!eventsRes.events?.length) {
      console.log("No events found");
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastEvents = eventsRes.events.filter((event: any) => {
      if (!event.dateEnd && !event.dateStart) return false;
      const eventDate = new Date(event.dateEnd || event.dateStart);
      eventDate.setHours(23, 59, 59, 999);
      return eventDate < today;
    });

    const eventPromises = pastEvents.map(
      async (event: any): Promise<EventInfo> => ({
        name: event.name || "Unknown Event",
        eventCode: event.code || "UNKNOWN",
        location: event.venue || event.city || "TBD",
        date: event.dateStart
          ? new Date(event.dateStart).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "TBD",
        teamCount: 0,
        winRate: 0,
        OPR: 0,
        averageScore: 0,
        place: "TBD",
        record: "TBD",
        matches: [],
        achievements: "Event Completed",
        type: event.type,
      })
    );

    const eventsWithData = await Promise.all(eventPromises);

    eventsWithData.sort((b, a) => {
      const dateA = new Date(a.date || "");
      const dateB = new Date(b.date || "");
      return dateA.getTime() - dateB.getTime();
    });

    return eventsWithData;
  } catch (error) {
    console.error("Error fetching past events:", error);
    return [];
  }
}