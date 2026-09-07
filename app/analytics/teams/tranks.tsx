import TeamAnalyticsTemplate from '@/components/templates/TeamAnalyticsTemplate';

const TRanks = () => (
  <TeamAnalyticsTemplate
    pageTitle="Overall Rankings"
    dataType="overall"
    summary="Every team in the season ordered by total OPR — their combined scoring contribution across auto, teleop and endgame. Sort or filter the table to find matchups."
  />
);

export default TRanks;
