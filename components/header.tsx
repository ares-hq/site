import React, { useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';
import LeftSide from './header/leftSide';
import RightSide from './header/rightSide';

type HeaderBarProps = {
  toggleSidebar: () => void;
  currentPage?: string;
  onLayout?: (width: number) => void;
};

const TopNavbar = ({ toggleSidebar, currentPage, onLayout }: HeaderBarProps) => {
  const [showRoute, setShowRoute] = useState(true);
  const { isDarkMode } = useDarkMode();

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (onLayout) {
      onLayout(width);
    }
    setShowRoute(width >= 550);
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
          borderColor: isDarkMode ? '#4B5563' : '#e5e7eb',
        },
      ]}
      onLayout={handleLayout}
    >
      <View style={styles.container}>
        <View style={styles.leftSide}>
          <LeftSide toggleSidebar={toggleSidebar} pageTitle={currentPage ?? ''} showRoute={showRoute} />
        </View>
        <View style={styles.rightSide}>
          <RightSide />
        </View>
      </View>
    </View>
  );
};

export default TopNavbar;

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSide: {
    flexShrink: 1,
    minWidth: 150,
    flexGrow: 1,
    // marginBottom: 6,
  },
  rightSide: {
    flexShrink: 1,
    minWidth: 150,
    flexGrow: 1,
    alignItems: 'flex-end',
    // marginBottom: 6,
  },
});