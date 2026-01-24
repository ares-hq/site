import { Matrix, SingularValueDecomposition, pseudoInverse } from 'ml-matrix';
import { MatchInfo } from '../utils/types';

export class MatrixBuilder {
  private matches: MatchInfo[] = [];
  private teams: string[] = [];
  private numMatches: number = 0;
  private numTeams: number = 0;

  private binaryMatrix: number[][] = [];
  private teamIndices: Record<string, number> = {};

  private scoreMatrix: number[] = [];

  constructor(matches: MatchInfo[]) {
    this.matches = matches;
    this.numMatches = matches.length;
  }

  private createTeamMatrices(): void {
    for (const match of this.matches) {
      const teams = [
        match.redAlliance.team_1,
        match.redAlliance.team_2,
        match.blueAlliance.team_1,
        match.blueAlliance.team_2,
      ];

      for (const team of teams) {
        const teamNumber = team?.teamNumber?.toString();
        if (teamNumber && !this.teams.includes(teamNumber)) {
          this.teams.push(teamNumber);
        }
      }
    }

    this.teams.sort();

    this.teamIndices = {};
    this.teams.forEach((team, idx) => {
      this.teamIndices[team] = idx;
    });

    this.numTeams = this.teams.length;

    this.binaryMatrix = Array(this.numMatches * 2)
      .fill(null)
      .map(() => Array(this.numTeams).fill(0));
  }

  public createBinaryAndScoreMatrices(): void {
    this.createTeamMatrices();

    this.scoreMatrix = new Array(this.numMatches * 2).fill(0);

    for (let matchIdx = 0; matchIdx < this.matches.length; matchIdx++) {
      const match = this.matches[matchIdx];
      const alliances = [
        { teams: [match.redAlliance.team_1, match.redAlliance.team_2], score: match.redAlliance.totalPoints, row: 2 * matchIdx, penalty: match.blueAlliance.penalty },
        { teams: [match.blueAlliance.team_1, match.blueAlliance.team_2], score: match.blueAlliance.totalPoints, row: 2 * matchIdx + 1, penalty: match.redAlliance.penalty }
      ];

      for (const alliance of alliances) {
        this.scoreMatrix[alliance.row] = alliance.score - alliance.penalty;

        for (const team of alliance.teams) {
          const teamNumber = team?.teamNumber?.toString();
          const teamIdx = teamNumber ? this.teamIndices[teamNumber] : -1;

          if (
            team &&
            teamIdx !== -1
          ) {
            this.binaryMatrix[alliance.row][teamIdx] = 1;
          }
        }
      }
    }
  }

  public getBinaryMatrix() {
    return this.binaryMatrix;
  }

  public getScoreMatrix() {
    return this.scoreMatrix;
  }

  public getTeams() {
    return this.teams;
  }
}

export class MatrixMath {
  static LSE(A: number[][], B: number[][]): number[][] {
    const A_matrix = new Matrix(A);
    const B_matrix = new Matrix(B);
    const A_pinv = pseudoInverse(A_matrix);
    return A_pinv.mmul(B_matrix).to2DArray();
  }

  static SVD(A: number[][]) {
    const svd = new SingularValueDecomposition(new Matrix(A));
    return {
      U: svd.leftSingularVectors.to2DArray(),
      S: svd.diagonal,
      Vt: svd.rightSingularVectors.transpose().to2DArray(),
    };
  }
}

/**
 * Calculates OPR (Offensive Power Rating) for a specific team from an array of matches.
 * @param matches - Array of MatchInfo objects
 * @param teamNumber - Team number to compute OPR for
 * @returns OPR value (number)
 */
export function calculateTeamOPR(matches: MatchInfo[], teamNumber: number): number {
  const builder = new MatrixBuilder(matches);
  builder.createBinaryAndScoreMatrices();

  const A = builder.getBinaryMatrix(); // [matchCount x teamCount] matrix
  const b = builder.getScoreMatrix().map(v => [v]); // column vector shape

  const teamList = builder.getTeams();
  const teamIndex = teamList.indexOf(teamNumber.toString());
  if (teamIndex === -1) return 0;

  try {
    const x = MatrixMath.LSE(A, b); // Solve Ax = b
    return Number(x[teamIndex][0].toFixed(2));
  } catch (err) {
    console.error('OPR calculation failed:', err);
    return 0;
  }
}