import { ApiClient } from "./utils/api-client";
import { BasicEventInfo, EventInfo, SupportedYear } from "./utils/types";

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
 * Get only upcoming and ongoing events (excludes completed events)
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
    return eventDate > today; // Changed from >= to > to exclude today's date
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