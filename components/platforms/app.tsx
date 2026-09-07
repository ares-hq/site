import PlatformPage, { PlatformItem, PlatformStep } from '@/components/templates/PlatformPage';
import React from 'react';

const features: PlatformItem[] = [
  { id: 'searchTeams', title: 'Search Teams', description: 'Look up any FTC team for their profile, season summaries and event history.', usage: 'Home → search bar → team number or name', icon: 'search' },
  { id: 'teamAnalysts', title: 'Team Analysts', description: 'OPR / eOPR trends, consistency, schedule strength and scouting notes.', usage: 'Team page → “Analysts” tab', icon: 'trending-up' },
  { id: 'favorites', title: 'Favorite Teams', description: 'Pin your team(s) for one-tap access from anywhere in the app.', usage: 'Tap the heart on any team profile', icon: 'heart' },
  { id: 'watchlist', title: 'Teams to Watch', description: 'Build a watchlist of opponents or partners to track through the season.', usage: 'Team or search result → “Watch”', icon: 'eye' },
  { id: 'stats', title: 'General Statistics', description: 'Global and regional leaderboards, averages and distribution snapshots.', usage: 'Home → “Stats” → filter by season / region', icon: 'bar-chart-2' },
  { id: 'scout', title: 'Live ScoutSheet', description: 'At an ongoing event, rank the best available alliance partners in real time.', usage: 'Scouting → ScoutSheet → enter event code', icon: 'clipboard' },
];

const steps: PlatformStep[] = [
  { title: 'Connect your team', description: 'Enter your team number once to personalize dashboards and quick links.', icon: 'link-2' },
  { title: 'Search & filter', description: 'Use search and region/season filters to find the teams and stats you need.', icon: 'filter' },
  { title: 'Pin favorites', description: 'Heart your teams so they surface on Home and in the quick picker.', icon: 'bookmark' },
  { title: 'Monitor your watchlist', description: 'Add opponents or partners to “Teams to Watch” to track them at a glance.', icon: 'list' },
];

export default function MobileAppPage() {
  return (
    <PlatformPage
      pageKey="app"
      badgeIcon="smartphone"
      title="ARES for iOS"
      description="The ARES mobile app puts team profiles, analyst breakdowns, live event data and the ScoutSheet on your phone — built for the pit and the stands."
      ctaLabel="Join the TestFlight"
      ctaHref="https://testflight.apple.com/join/FYFDhmcA"
      itemsTitle="Features"
      items={features}
      steps={steps}
    />
  );
}
