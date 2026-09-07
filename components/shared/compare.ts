// Shared palette for "compare team" overlays (radar, bar charts).
// Distinct, restrained hues — deliberately NOT blue (blue = the blue alliance) and
// not the accent (that's always "this team").
export const MAX_COMPARE = 5;

export const CMP_COLORS = {
  light: ['#D97706', '#7C3AED', '#0D9488', '#DB2777', '#4D7C0F'],
  dark: ['#FBBF24', '#A78BFA', '#2DD4BF', '#F472B6', '#A3E635'],
} as const;
