import MatchAnalyticsTemplate from '@/components/templates/MatchAnalyticsTemplate';

export default function Finals() {
  return (
    <MatchAnalyticsTemplate
      pageTitle="Finals Match Rankings"
      filter="PLAYOFF"
      blurb="Elimination-bracket performances — playoff and finals matches only, ranked by alliance score."
    />
  );
}
