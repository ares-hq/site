import PlatformPage, { PlatformItem, PlatformStep } from '@/components/templates/PlatformPage';
import React from 'react';

const commands: PlatformItem[] = [
  { id: 'team', title: '/team', description: 'Full FIRST profile for any team — location, sponsors, season stats and event history.', usage: '/team <team_number>', icon: 'users' },
  { id: 'match', title: '/match', description: 'OPR-based prediction for a hypothetical matchup between two alliances.', usage: '/match <red1 red2> <blue1 blue2>', icon: 'play' },
  { id: 'favorite', title: '/favorite', description: 'Pin a team as your server favorite. Run it again on the same team to remove it.', usage: '/favorite <team_number>', icon: 'heart' },
  { id: 'event', title: '/event', description: 'Rankings, top OPRs and results for an event, posted right in your channel.', usage: '/event <event_code>', icon: 'calendar' },
];

const steps: PlatformStep[] = [
  { title: 'Add the bot to your server', description: 'Authorize ARES for the Discord server you scout from — takes a few seconds.', icon: 'plus-circle' },
  { title: 'Run a command anywhere', description: 'Type any slash command in a channel and ARES replies instantly with live FTC data.', icon: 'message-square' },
  { title: 'Pin the teams you care about', description: 'Use /favorite so your alliance and rivals are one command away all season.', icon: 'bookmark' },
];

export default function DiscordBotPage() {
  return (
    <PlatformPage
      pageKey="discord"
      badgeIcon="message-circle"
      title="ARES for Discord"
      description="Drop the ARES bot into your scouting server and pull team profiles, event rankings and OPR-based match predictions without leaving Discord."
      ctaLabel="Add to Discord"
      ctaHref="https://discord.com/oauth2/authorize?client_id=1327489137238081566"
      itemsTitle="Commands"
      items={commands}
      steps={steps}
      monoUsage
    />
  );
}
