import { SupportedYear } from './types';

/**
 * Single source of truth for the season <-> dashboard route mapping.
 *
 * The values MUST match the filenames in `app/dashboards/` exactly, because
 * GitHub Pages (and any case-sensitive host) will 404 on a mismatched case.
 * Previously this map was copy-pasted in ~5 places and they had drifted
 * (2020/2021 were swapped in one, `inShow` vs `inshow` in others).
 */
export const SEASON_ROUTE: Record<SupportedYear, string> = {
  2019: 'rise',
  2020: 'forward',
  2021: 'gameChangers',
  2022: 'energize',
  2023: 'inshow',
  2024: 'intothedeep',
  2025: 'age',
  2026: 'canopy',
};

export const SUPPORTED_YEARS: SupportedYear[] = [
  2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
];

export const DEFAULT_SEASON: SupportedYear = 2026;

const ROUTE_SEASON: Record<string, SupportedYear> = Object.entries(SEASON_ROUTE).reduce(
  (acc, [year, route]) => {
    acc[route.toLowerCase()] = Number(year) as SupportedYear;
    return acc;
  },
  {} as Record<string, SupportedYear>,
);

/** season year -> route segment (falls back to the current season) */
export function routeFromSeason(year: SupportedYear): string {
  return SEASON_ROUTE[year] ?? SEASON_ROUTE[DEFAULT_SEASON];
}

/** a route segment or full pathname (any case) -> season year, if one is present */
export function seasonFromRoute(routeOrPath: string | undefined | null): SupportedYear | undefined {
  if (!routeOrPath) return undefined;
  const segments = routeOrPath.toLowerCase().split(/[/?#]/).filter(Boolean);
  for (const seg of segments) {
    if (ROUTE_SEASON[seg]) return ROUTE_SEASON[seg];
  }
  return undefined;
}
