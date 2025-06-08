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

type AnalyticsProps = {
  navigateToPage: (page: string) => void;
};

const Analytics = ({ navigateToPage }: AnalyticsProps) => {
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

  return (
    <View style={styles.sidebar}>
      <Text style={styles.sectionTitle}>Analytics</Text>

      <SidebarItem
        label="Teams"
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotate }] }]}>
                <CaretRight fill='rgba(0,0,0,.2)' width={14} height={14} />
              </Animated.View>
            </View>
            <IdentificationBadge width={16} height={16} />
          </View>
        }
        onPress={() => setTeamsExpanded(!teamsExpanded)}
      />

      {teamsExpanded && (
        <>
          <SidebarItem label="Ranks" onPress={() => navigateToPage('Teams')}/>
          <SidebarItem label="Auto" onPress={() => navigateToPage('Auto')}/>
          <SidebarItem label="TeleOp" onPress={() => navigateToPage('TeleOp')}/>
          <SidebarItem label="Endgame" onPress={() => navigateToPage('Endgame')}/>
        </>
      )}

      <Text style={styles.sectionTitle}></Text>
      <SidebarItem
        label="Matches"
        icon={
          <View style={styles.teamIcons}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotateMatch }] }]}>
                <CaretRight fill='rgba(0,0,0,.2)' width={14} height={14} />
              </Animated.View>
            </View>
            <Controller width={16} height={16}/>
          </View>
        }
        onPress={() => setMatchesExpanded(!matchesExpanded)}
      />

      {matchesExpanded && (
        <>
          <SidebarItem label="Ranks" onPress={() => navigateToPage('Matches')}/>
          <SidebarItem label="Qualifiers" onPress={() => navigateToPage('Qualifiers')}/>
          <SidebarItem label="Finals" onPress={() => navigateToPage('Finals')} />
          <SidebarItem label="Premier" onPress={() => navigateToPage('Premier')}/>
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
    paddingHorizontal: 8,
    gap: 2,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
  },
  item: {
    paddingVertical: 8,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hoveredItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#000',
  },
  teamIcons: {
    paddingLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
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