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
  matchType: 'QUALIFICATION' | 'PLAYOFF';
  team_1?: TeamInfoSimple;
  team_2?: TeamInfoSimple;
  matchNumber?: string;
}

export interface MatchInfo {
  matchType: 'QUALIFICATION' | 'PLAYOFF';
  matchNumber: string;
  date: string;
  redAlliance: AllianceInfo;
  blueAlliance: AllianceInfo;
}

export interface EventInfo {
  date: string;
  location: string;
  name: string;
  teamCount: number;
  winRate: number;
  OPR: number;
  averageScore: number;
  place: string;
  record: string;
  matches: MatchInfo[];
  achievements: string;
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