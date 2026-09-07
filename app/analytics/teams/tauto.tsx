import TeamAnalyticsTemplate from '@/components/templates/TeamAnalyticsTemplate';

const TAuto = () => (
  <TeamAnalyticsTemplate
    pageTitle="Autonomous Rankings"
    dataType="auto"
    summary="Teams ranked by autonomous OPR — how many points they add during the 30-second auto period, isolated from teleop and endgame."
  />
);

export default TAuto;
