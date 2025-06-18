import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import IdentificationBadge from '../../assets/icons/identification-badge.svg';
import CaretRight from '../../assets/icons/caret-right.svg';
import Controller from '../../assets/icons/game-controller.svg';
import { useRouter } from 'expo-router';

type AnalyticsProps = {
  close?: () => void;
};

const Analytics = ({ close }: AnalyticsProps) => {
  const router = useRouter();
  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const [matchesExpanded, setMatchesExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnimMatch = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: teamsExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [teamsExpanded]);

    useEffect(() => {
    Animated.timing(fadeAnimMatch, {
      toValue: matchesExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [matchesExpanded]);

  const rotate = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const rotateMatch = fadeAnimMatch.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const go = (path: string) => {
    router.push(path as any);
    // close?.();
  };


  return (
    <View style={styles.sidebar}>
      <Text style={styles.sectionTitle}>Analytics</Text>

      <SidebarItem
        label="Teams"
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotate }] }]}>
                <CaretRight fill='rgba(0,0,0,.2)' width={15} height={15} />
              </Animated.View>
            </View>
            <IdentificationBadge width={18} height={18} />
          </View>
        }
        onPress={() => setTeamsExpanded(!teamsExpanded)}
      />

      {teamsExpanded && (
        <>
          <SidebarItem label="Ranks" onPress={() => go('/analytics/teams/tranks')} />
          <SidebarItem label="Auto" onPress={() => go('/analytics/teams/tauto')} />
          <SidebarItem label="TeleOp" onPress={() => go('/analytics/teams/ttele')} />
          <SidebarItem label="Endgame" onPress={() => go('/analytics/teams/tendgame')} />
        </>
      )}

      <Text style={styles.sectionTitle}></Text>
      <SidebarItem
        label="Matches"
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotateMatch }] }]}>
                <CaretRight fill='rgba(0,0,0,.2)' width={15} height={15} />
              </Animated.View>
            </View>
            <Controller width={18} height={18}/>
          </View>
        }
        onPress={() => setMatchesExpanded(!matchesExpanded)}
      />

      {matchesExpanded && (
        <>
          <SidebarItem label="Ranks" onPress={() => go('/analytics/matches/mranks')} />
          <SidebarItem label="Qualifiers" onPress={() => go('/analytics/matches/qual')} />
          <SidebarItem label="Finals" onPress={() => go('/analytics/matches/finals')} />
          <SidebarItem label="Premier" onPress={() => go('/analytics/matches/premier')} />
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
}: {
  label: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        hovered && styles.hoveredItem,
      ]}
    >
      <View style={styles.iconLabel}>
        {icon ? (
          <View>{icon}</View>
        ) : (
          <View style={{ width: 16, height: 16, paddingLeft: 60 }} />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    paddingHorizontal: 9,
    gap: 2.2,
    backgroundColor: '#fff',    
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 9,
    color: 'rgba(0, 0, 0, 0.4)',
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
  hoveredItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 13,
  },
  label: {
    fontSize: 15,
    color: '#000',
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