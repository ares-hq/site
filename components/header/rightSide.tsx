import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDarkMode } from '@/context/DarkModeContext';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import Refresh from '../../assets/icons/arrow-clockwise.svg';
import House from '../../assets/icons/house.svg';
import Sun from '../../assets/icons/sun.svg';
import SearchDropdown from './search';

const HoverIcon = ({
  children,
  onPress,
  isDarkMode,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  isDarkMode: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={[
        styles.iconWrapper,
        hovered && (isDarkMode ? styles.iconHoveredDark : styles.iconHoveredLight),
      ]}
    >
      {children}
    </Pressable>
  );
};

const RightSide = () => {
  const { isDarkMode, setIsDarkMode } = useDarkMode();
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const teamnumber = params.teamnumber ? parseInt(params.teamnumber as string, 10) : NaN;

  // Determine current year based on the dashboard route
  const getCurrentYear = (): 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 => {
    if (pathname.includes('/rise')) return 2019;
    if (pathname.includes('/forward')) return 2020;
    if (pathname.includes('/gameChangers')) return 2021;
    if (pathname.includes('/energize')) return 2022;
    if (pathname.includes('/inShow')) return 2023;
    if (pathname.includes('/intothedeep')) return 2024;
    if (pathname.includes('/age')) return 2025;
    return 2025; // Default fallback
  };

  const currentYear = getCurrentYear();

  let fullPath = pathname;
  if (!isNaN(teamnumber)) {
    fullPath = `${pathname}?teamnumber=${teamnumber}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <SearchDropdown
          year={2025}
          zIndex={999999}
          onSelectTeam={(num) => {
            // router.push(`/teams/${num}?year=${currentYear}`);
            console.log('navigate to team', num, 'for year', currentYear);
          }}
          onSelectAux={(id) => {
            // map to your routes
            // if (id === 'analysts') router.push('/analysts');
            // if (id === 'favorites') router.push('/favorites');
            // if (id === 'watchlist') router.push('/watchlist');
            // if (id === 'stats') router.push('/stats');
            console.log('aux', id);
          }}
        />
      </View>

      <HoverIcon isDarkMode={isDarkMode} onPress={() => setIsDarkMode(!isDarkMode)}>
        <Sun width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
      </HoverIcon>

      <HoverIcon isDarkMode={isDarkMode} onPress={() => router.replace(fullPath as any)}>
        <Refresh width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
      </HoverIcon>

      {/* <HoverIcon isDarkMode={isDarkMode} onPress={() => router.replace('/')}>
        <House width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
      </HoverIcon> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 4.4,
    borderRadius: 7,
  },
  iconHoveredLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconHoveredDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  search: {
    paddingRight: 7,
    zIndex: 999999,  // Ensure search container has highest z-index
  },
});

export default RightSide;