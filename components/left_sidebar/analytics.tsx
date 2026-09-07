import { webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Calendar from '../../assets/icons/calendar.svg';
import CaretRight from '../../assets/icons/caret-right.svg';
import Controller from '../../assets/icons/game-controller.svg';
import IdentificationBadge from '../../assets/icons/identification-badge.svg';

type AnalyticsProps = {
  close?: () => void;
  isMobile?: boolean;
};

const Analytics = ({ close, isMobile }: AnalyticsProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTheme();

  const [teamsExpanded, setTeamsExpanded] = useState(() => pathname.includes('/analytics/teams'));
  const [matchesExpanded, setMatchesExpanded] = useState(() => pathname.includes('/analytics/matches'));
  const [eventsExpanded, setEventsExpanded] = useState(() => pathname.includes('/analytics/events'));

  const fadeAnim = useRef(new Animated.Value(teamsExpanded ? 1 : 0)).current;
  const fadeAnimMatch = useRef(new Animated.Value(matchesExpanded ? 1 : 0)).current;
  const fadeAnimEvents = useRef(new Animated.Value(eventsExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: teamsExpanded ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [teamsExpanded, fadeAnim]);
  useEffect(() => {
    Animated.timing(fadeAnimMatch, { toValue: matchesExpanded ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [matchesExpanded, fadeAnimMatch]);
  useEffect(() => {
    Animated.timing(fadeAnimEvents, { toValue: eventsExpanded ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [eventsExpanded, fadeAnimEvents]);

  const rotate = fadeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const rotateMatch = fadeAnimMatch.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  const rotateEvents = fadeAnimEvents.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  const go = (path: string) => {
    router.push(path as any);
    if (isMobile) close?.();
  };

  const arrowFill = t.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const groupActive = (seg: string) => pathname.includes(`/analytics/${seg}`);

  return (
    <View style={[styles.sidebar, { backgroundColor: t.c.bg }]}>
      <Text style={[styles.sectionTitle, { color: t.c.textFaint }]}>Analytics</Text>

      <SidebarItem
        label="Teams"
        parentActive={groupActive('teams')}
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate }] }]}>
                <CaretRight fill={arrowFill} width={15} height={15} />
              </Animated.View>
            </View>
            <IdentificationBadge width={18} height={18} fill={groupActive('teams') ? t.c.accent : t.c.text} />
          </View>
        }
        onPress={() => setTeamsExpanded((v) => !v)}
      />

      {teamsExpanded && (
        <>
          <SidebarItem label="Ranks" active={pathname === '/analytics/teams/tranks'} onPress={() => go('/analytics/teams/tranks')} />
          <SidebarItem label="Auto" active={pathname === '/analytics/teams/tauto'} onPress={() => go('/analytics/teams/tauto')} />
          <SidebarItem label="TeleOp" active={pathname === '/analytics/teams/ttele'} onPress={() => go('/analytics/teams/ttele')} />
          <SidebarItem label="Endgame" active={pathname === '/analytics/teams/tendgame'} onPress={() => go('/analytics/teams/tendgame')} />
        </>
      )}

      <View style={styles.groupGap} />

      <SidebarItem
        label="Matches"
        parentActive={groupActive('matches')}
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotateMatch }] }]}>
                <CaretRight fill={arrowFill} width={15} height={15} />
              </Animated.View>
            </View>
            <Controller width={18} height={18} fill={groupActive('matches') ? t.c.accent : t.c.text} />
          </View>
        }
        onPress={() => setMatchesExpanded((v) => !v)}
      />

      {matchesExpanded && (
        <>
          <SidebarItem label="Ranks" active={pathname === '/analytics/matches/mranks'} onPress={() => go('/analytics/matches/mranks')} />
          <SidebarItem label="Qualifiers" active={pathname === '/analytics/matches/qual'} onPress={() => go('/analytics/matches/qual')} />
          <SidebarItem label="Finals" active={pathname === '/analytics/matches/finals'} onPress={() => go('/analytics/matches/finals')} />
          <SidebarItem label="Premier" active={pathname === '/analytics/matches/premier'} onPress={() => go('/analytics/matches/premier')} />
        </>
      )}

      <View style={styles.groupGap} />

      <SidebarItem
        label="Events"
        parentActive={groupActive('events')}
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotateEvents }] }]}>
                <CaretRight fill={arrowFill} width={15} height={15} />
              </Animated.View>
            </View>
            <Calendar width={18} height={18} fill={groupActive('events') ? t.c.accent : t.c.text} />
          </View>
        }
        onPress={() => setEventsExpanded((v) => !v)}
      />

      {eventsExpanded && (
        <>
          <SidebarItem label="All Events" active={pathname === '/analytics/events/allevents'} onPress={() => go('/analytics/events/allevents')} />
          <SidebarItem label="Premier" active={pathname === '/analytics/events/premier'} onPress={() => go('/analytics/events/premier')} />
          <SidebarItem label="Championship" active={pathname === '/analytics/events/championships'} onPress={() => go('/analytics/events/championships')} />
        </>
      )}
    </View>
  );
};

const SidebarItem = ({
  label,
  icon,
  active = false,
  parentActive = false,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  parentActive?: boolean;
  onPress?: () => void;
}) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);
  const highlighted = active;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        webTransition('background-color'),
        (hovered || highlighted) && { backgroundColor: highlighted ? t.c.accentSoft : t.c.rowHover },
      ]}
    >
      <View style={styles.iconLabel}>
        {icon ? <View>{icon}</View> : <View style={{ width: 16, height: 16, paddingLeft: 60 }} />}
        <Text
          style={[
            styles.label,
            {
              color: active ? t.c.accentText : parentActive ? t.c.text : t.c.text,
              fontWeight: active || parentActive ? '600' : '400',
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    paddingHorizontal: 9,
    gap: 2.2,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
    paddingHorizontal: 13,
  },
  groupGap: { height: 10 },
  item: {
    paddingVertical: 9,
    borderRadius: 13,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  label: {
    fontSize: 15,
  },
  teamIcons: {
    paddingLeft: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4.4,
    position: 'relative',
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Analytics;
