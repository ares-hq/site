import { TeamInfo } from "../utils/types";

export const filterTeams = (teams: TeamInfo[] | null, query: string): TeamInfo[] => {
  if (!teams) return [];
  if (!query.trim()) return teams.slice(0, 50);

  const lowerQuery = query.toLowerCase();

  const scored = teams.map((team) => {
    const name = team.teamName && team.teamName.toLowerCase() || "";
    const number = team.teamNumber && team.teamNumber.toString() || "";

    let score = 0;

    if (number === lowerQuery) score += 100;
    else if (number.startsWith(lowerQuery)) score += 50;
    else if (number.includes(lowerQuery)) score += 25;

    if (name.startsWith(lowerQuery)) score += 40;
    else if (name.includes(lowerQuery)) score += 15;

    return { team, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map(({ team }) => team);
};