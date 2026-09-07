import MatchAnalyticsTemplate from '@/components/templates/MatchAnalyticsTemplate';

export default function MRanks() {
  return (
    <MatchAnalyticsTemplate
      pageTitle="All Match Rankings"
      filter="all"
      blurb="Every alliance result of the season, ranked by score. Scroll for the record book; the tiles above summarise the whole field."
    />
  );
}
