import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDarkMode } from '@/context/DarkModeContext';
import { webTransition } from '@/components/shared/motion';
import { DEFAULT_SEASON, seasonFromRoute } from '@/api/utils/seasons';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import Refresh from '../../assets/icons/arrow-clockwise.svg';
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
        webTransition('background-color, transform'),
        hovered && (isDarkMode ? styles.iconHoveredDark : styles.iconHoveredLight),
        hovered && { transform: [{ scale: 1.08 }] },
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

  // Season currently being viewed (from the dashboard route), defaulting to the latest.
  const currentYear = seasonFromRoute(pathname) ?? DEFAULT_SEASON;

  let fullPath = pathname;
  if (!isNaN(teamnumber)) {
    fullPath = `${pathname}?teamnumber=${teamnumber}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <SearchDropdown
          year={currentYear}
          zIndex={999999}
        />
      </View>

      <HoverIcon isDarkMode={isDarkMode} onPress={() => setIsDarkMode(!isDarkMode)}>
        <Sun width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
      </HoverIcon>

      <HoverIcon isDarkMode={isDarkMode} onPress={() => router.replace(fullPath as any)}>
        <Refresh width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
      </HoverIcon>
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