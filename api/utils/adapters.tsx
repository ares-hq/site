import { SupportedYear } from "./types";

interface ScoreAdapter {
  endgamePoints(match: any): [number, number];
  penalties(match: any): [number, number];
  teleopPoints(match: any): [number, number];
}

class DefaultModernAdapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    const red = (match.alliances?.[1]?.teleopParkPoints || 0) + (match.alliances?.[1]?.teleopAscentPoints || 0);
    const blue = (match.alliances?.[0]?.teleopParkPoints || 0) + (match.alliances?.[0]?.teleopAscentPoints || 0);
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.foulPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.foulPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Skystone2019Adapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    console.log('Match object for endgamePoints:', match);
    const redAlliance = match.alliances?.find((alliance: any) => alliance.alliance === 'Red') || {};
    const blueAlliance = match.alliances?.find((alliance: any) => alliance.alliance === 'Blue') || {};

    const red = (redAlliance.teleopParkPoints || 0) + (redAlliance.teleopAscentPoints || 0);
    const blue = (blueAlliance.teleopParkPoints || 0) + (blueAlliance.teleopAscentPoints || 0);

    console.log('Endgame points - Red:', red, 'Blue:', blue);
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPoints || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPoints || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class UltimateGoal2020Adapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPoints || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPoints || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class FreightFrenzy2021Adapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPoints || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPoints || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Powerplay2022Adapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Centerstage2023Adapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    const red = match.alliances?.[1]?.endgamePoints || 0;
    const blue = match.alliances?.[0]?.endgamePoints || 0;
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.penaltyPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.penaltyPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class IntoTheDeep2024Adapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    const red = (match.alliances?.[1]?.teleopParkPoints || 0) + (match.alliances?.[1]?.teleopAscentPoints || 0);
    const blue = (match.alliances?.[0]?.teleopParkPoints || 0) + (match.alliances?.[0]?.teleopAscentPoints || 0);
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.foulPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.foulPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.scoreRedFinal || 0;
    const blueTotal = match.scoreBlueFinal || 0;
    const redAuto = match.scoreRedAuto || 0;
    const blueAuto = match.scoreBlueAuto || 0;
    return [Math.max(0, redTotal - redAuto), Math.max(0, blueTotal - blueAuto)];
  }
}

class Decode2025Adapter implements ScoreAdapter {
  endgamePoints(match: any): [number, number] {
    const red = (match.alliances?.[1]?.teleopBasePoints || 0);
    const blue = (match.alliances?.[0]?.teleopBasePoints || 0);
    return [red, blue];
  }

  penalties(match: any): [number, number] {
    const red = match.alliances?.[1]?.foulPointsCommitted || match.scoreRedFoul || 0;
    const blue = match.alliances?.[0]?.foulPointsCommitted || match.scoreBlueFoul || 0;
    return [red, blue];
  }

  teleopPoints(match: any): [number, number] {
    const redTotal = match.alliances?.[1]?.teleopPoints || 0;
    const blueTotal = match.alliances?.[0]?.teleopPoints || 0;
    return [redTotal, blueTotal];
  }
}

const SCORE_ADAPTERS: Record<SupportedYear, ScoreAdapter> = {
  2019: new Skystone2019Adapter(),
  2020: new UltimateGoal2020Adapter(),
  2021: new FreightFrenzy2021Adapter(),
  2022: new Powerplay2022Adapter(),
  2023: new Centerstage2023Adapter(),
  2024: new IntoTheDeep2024Adapter(),
  2025: new Decode2025Adapter(),
};

const DEFAULT_SCORE_ADAPTER: ScoreAdapter = new DefaultModernAdapter();

export function getScoreAdapter(year: SupportedYear): ScoreAdapter {
  return SCORE_ADAPTERS[year] || DEFAULT_SCORE_ADAPTER;
}