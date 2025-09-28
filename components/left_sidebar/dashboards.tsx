import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import Chart from '../../assets/icons/chart-pie-slice-fill.svg';
import IdentificationBadge from '../../assets/icons/identification-badge.svg';
import CaretRight from '../../assets/icons/caret-right.svg';
import Controller from '../../assets/icons/game-controller.svg';
import Graph from '../../assets/icons/chart-line-fill.svg';
import { useRouter } from 'expo-router';
import { useDarkMode } from '@/context/DarkModeContext';
import { addRecentItem } from './usedTabs';

type DashboardsProps = {
  close?: () => void;
};

const Dashboards = ({ close }: DashboardsProps) => {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textColor = isDarkMode ? '#fff' : '#000';
  const mutedColor = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const bgColor = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff';
  const arrowFill = isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: teamsExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [teamsExpanded]);

  const rotate = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const go = (path: string, label: string) => {
    addRecentItem(label, path); // Save human-friendly name
    router.push(path as any);
    // close?.();
  };

  return (
    <View style={[styles.sidebar, { backgroundColor: bgColor }]}>
      <Text style={[styles.sectionTitle, { color: mutedColor }]}>Dashboards</Text>
      <SidebarItem
        label="Decode"
        icon={<View style={styles.teamIcons}><Graph width={18} height={18} fill={isDarkMode ? '#fff' : '#000'}/></View>}
        onPress={() => {
          addRecentItem('Decode', '/dashboards/age');
          router.push('/dashboards/age');
          // close?.();
        }}
        isDarkMode={isDarkMode}
      />

      <SidebarItem
        label="Previous Years"
        icon={
          <View style={styles.teamIcons2}>
            <View style={styles.arrowContainer}>
              <Animated.View style={[styles.arrow, { transform: [{ rotate: rotate }] }]}>
                <CaretRight fill={arrowFill} width={15} height={15} />
              </Animated.View>
            </View>
            <Chart width={18} height={18} fill={isDarkMode ? '#fff' : '#000'}/>
          </View>
        }
        onPress={() => setTeamsExpanded(!teamsExpanded)}
        isDarkMode={isDarkMode}
      />

      {teamsExpanded && (
        <>
          <SidebarItem
            label="Into the Deep"
            onPress={() => {
              addRecentItem('Into the Deep', '/dashboards/intothedeep');
              router.push('/dashboards/intothedeep');
              // close?.();
            }}
            isDarkMode={isDarkMode}
          />

          <SidebarItem
            label="Centerstage"
            onPress={() => {
              addRecentItem('In Show', '/dashboards/inShow');
              router.push('/dashboards/inShow');
              // close?.();
            }}
            isDarkMode={isDarkMode}
          />

          <SidebarItem
            label="Power Play"
            onPress={() => {
              addRecentItem('Energize', '/dashboards/energize');
              router.push('/dashboards/energize');
              // close?.();
            }}
            isDarkMode={isDarkMode}
          />

          <SidebarItem
            label="Freight Frenzy"
            onPress={() => {
              addRecentItem('Forward', '/dashboards/forward');
              router.push('/dashboards/forward');
              // close?.();
            }}
            isDarkMode={isDarkMode}
          />

          <SidebarItem
            label="Ultimate Goal"
            onPress={() => {
              addRecentItem('Game Changers', '/dashboards/gameChangers');
              router.push('/dashboards/gameChangers');
              // close?.();
            }}
            isDarkMode={isDarkMode}
          />

          <SidebarItem
            label="Skystone"
            onPress={() => {
              addRecentItem('Rise', '/dashboards/rise');
              router.push('/dashboards/rise');
              // close?.();
            }}
            isDarkMode={isDarkMode}
          />
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

  const textColor = isDarkMode ? '#fff' : '#000';
  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        hovered && { backgroundColor: hoverBg, borderRadius: 13 },
      ]}
    >
      <View style={styles.iconLabel}>
        {icon ? icon : <View style={{ width: 16, height: 16, paddingLeft: 60 }} />}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    paddingHorizontal: 8,
    gap: 2.2,
    paddingVertical: 9,
    marginBottom: 10,
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
    paddingLeft: 33,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIcons2: {
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

export default Dashboards;