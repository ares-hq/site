import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Search from './search';

import Bell from '../../assets/icons/bell-ringing.svg';
import House from '../../assets/icons/house.svg';
import Refresh from '../../assets/icons/arrow-clockwise.svg';
import Sun from '../../assets/icons/sun.svg';
import { usePathname, useRouter, useGlobalSearchParams } from 'expo-router';
import { useDarkMode } from '@/context/DarkModeContext';

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

  let fullPath = pathname;
  if (!isNaN(teamnumber)) {
    fullPath = `${pathname}?teamnumber=${teamnumber}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Search />
      </View>

      <HoverIcon isDarkMode={isDarkMode} onPress={() => setIsDarkMode(!isDarkMode)}>
        <Sun width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
      </HoverIcon>

      <HoverIcon isDarkMode={isDarkMode} onPress={() => router.replace(fullPath as any)}>
        <Refresh width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
      </HoverIcon>

      <HoverIcon isDarkMode={isDarkMode} onPress={() => router.replace('/')}>
        <House width={15} height={15} fill={isDarkMode ? '#fff' : '#000'}/>
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
  },
});

export default RightSide;