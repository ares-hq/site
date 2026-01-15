export interface TeamInfo {
  teamName?: string;
  teamNumber?: number;
  location?: string;
  founded?: string;
  highestScore?: string;
  website?: string;
  eventsAttended?: number;
  averagePlace?: number;
  sponsors?: string;
  achievements?: string;
  overallRank?: number;
  teleRank?: number;
  autoRank?: number;
  endgameRank?: number;
  teleOPR?: number;
  autoOPR?: number;
  endgameOPR?: number;
  overallOPR?: number;
  penalties?: string;
  penaltyRank: number;
  events?: string[];
}

export interface TeamInfoSimple {
  teamName: string;
  teamNumber: number;
}

export interface AllianceInfo {
  date: string;
  totalPoints: number;
  win: boolean;
  tele: number;
  penalty: number;
  alliance: 'red' | 'blue';
  matchType: 'QUALIFICATION' | 'PLAYOFF' | 'PRACTICE';
  team_1?: TeamInfoSimple;
  team_2?: TeamInfoSimple;
  matchNumber?: string;
  // Average comparison data
  averagePoints?: number;
  averageTele?: number;
  averagePenalty?: number;
  // Detailed score fields (year-specific)
  [key: string]: any; // Allow any additional fields for year-specific scoring
}

export interface MatchInfo {
  matchType: 'QUALIFICATION' | 'PLAYOFF' | 'PRACTICE';
  matchNumber: string;
  date: string;
  redAlliance: AllianceInfo;
  blueAlliance: AllianceInfo;
}

export interface EventInfo {
  date: string;
  location: string;
  name: string;
  eventCode: string;
  teamCount: number;
  winRate: number;
  OPR: number;
  averageScore: number;
  place: string;
  record: string;
  matches: MatchInfo[];
  achievements: string;
  type?: string; // Event type (Premier, Championship, etc.)
}

export interface MatchTypeAverages {
  qual: number;
  finals: number;
}

export interface OPRResult {
  team: string;
  totalOPR: number;
  teleOPR: number;
  autoOPR?: number;
  endgameOPR?: number;
  penaltyOPR?: number;
}