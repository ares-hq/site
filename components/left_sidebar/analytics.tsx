import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
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
};

const Analytics = ({ close }: AnalyticsProps) => {
  const router = useRouter();
  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const [matchesExpanded, setMatchesExpanded] = useState(false);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnimMatch = useRef(new Animated.Value(0)).current;
  const fadeAnimEvents = useRef(new Animated.Value(0)).current;
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: teamsExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [teamsExpanded]);

  useEffect(() => {
    Animated.timing(fadeAnimMatch, {
      toValue: matchesExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [matchesExpanded]);

  useEffect(() => {
    Animated.timing(fadeAnimEvents, {
      toValue: eventsExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [eventsExpanded]);

  const rotate = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const rotateMatch = fadeAnimMatch.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const rotateEvents = fadeAnimEvents.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const go = (path: string, label: string) => {
    router.push(path as any);
    close?.();
  };

  const textColor = isDarkMode ? '#fff' : '#000';
  const mutedColor = isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const hoverColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const arrowFill = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const bgColor = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff';

  return (
    <View style={[styles.sidebar, { backgroundColor: bgColor }]}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>Analytics</Text>

      <SidebarItem
        label="Teams"
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotate }] }]}>
                <CaretRight fill={arrowFill} width={15} height={15} />
              </Animated.View>
            </View>
            <IdentificationBadge width={18} height={18} fill={isDarkMode ? '#fff' : '#000'}/>
          </View>
        }
        onPress={() => setTeamsExpanded(!teamsExpanded)}
        isDarkMode={isDarkMode}
      />

      {teamsExpanded && (
        <>
          <SidebarItem label="Ranks" onPress={() => go('/analytics/teams/tranks', 'Teams')} isDarkMode={isDarkMode} />
          <SidebarItem label="Auto" onPress={() => go('/analytics/teams/tauto', 'Auto')} isDarkMode={isDarkMode} />
          <SidebarItem label="TeleOp" onPress={() => go('/analytics/teams/ttele', 'TeleOp')} isDarkMode={isDarkMode} />
          <SidebarItem label="Endgame" onPress={() => go('/analytics/teams/tendgame', 'Endgame')} isDarkMode={isDarkMode} />
        </>
      )}

      <Text style={[styles.sectionTitle, { color: mutedColor }]}></Text>

      <SidebarItem
        label="Matches"
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotateMatch }] }]}>
                <CaretRight fill={arrowFill} width={15} height={15} />
              </Animated.View>
            </View>
            <Controller width={18} height={18} fill={isDarkMode ? '#fff' : '#000'}/>
          </View>
        }
        onPress={() => setMatchesExpanded(!matchesExpanded)}
        isDarkMode={isDarkMode}
      />

      {matchesExpanded && (
        <>
          <SidebarItem label="Ranks" onPress={() => go('/analytics/matches/mranks', 'Matches')} isDarkMode={isDarkMode} />
          <SidebarItem label="Qualifiers" onPress={() => go('/analytics/matches/qual', 'Qualifiers')} isDarkMode={isDarkMode} />
          <SidebarItem label="Finals" onPress={() => go('/analytics/matches/finals', 'Finals')} isDarkMode={isDarkMode} />
          <SidebarItem label="Premier" onPress={() => go('/analytics/matches/premier', 'Premier')} isDarkMode={isDarkMode} />
        </>
      )}

      <Text style={[styles.sectionTitle, { color: mutedColor }]}></Text>

      <SidebarItem
        label="Events"
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotateEvents }] }]}>
                <CaretRight fill={arrowFill} width={15} height={15} />
              </Animated.View>
            </View>
            <Calendar width={18} height={18} fill={isDarkMode ? '#fff' : '#000'}/>
          </View>
        }
        onPress={() => setEventsExpanded(!eventsExpanded)}
        isDarkMode={isDarkMode}
      />

      {eventsExpanded && (
        <>
          <SidebarItem label="All Events" onPress={() => go('/analytics/events', 'Events')} isDarkMode={isDarkMode} />
        </>
      )}
    </View>
  );
};

const SidebarItem = ({
  label,
  icon,
  isSelected = false,
  onPress,
  isDarkMode,
}: {
  label: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
  isDarkMode: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        hovered && {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderRadius: 13,
        },
      ]}
    >
      <View style={styles.iconLabel}>
        {icon ? (
          <View>{icon}</View>
        ) : (
          <View style={{ width: 16, height: 16, paddingLeft: 60 }} />
        )}
        <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>{label}</Text>
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
    fontSize: 15,
    marginBottom: 9,
    paddingHorizontal: 13,
  },
  item: {
    paddingVertical: 9,
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
  arrowAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default Analytics;