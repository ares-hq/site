import { useDarkMode } from '@/context/DarkModeContext';
import { webTransition } from '@/components/shared/motion';
import React, { useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import LeftSide from './header/leftSide';
import RightSide from './header/rightSide';

const isWeb = Platform.OS === 'web';

const webChrome = isWeb
  ? ({
      position: 'sticky',
      top: 0,
      backdropFilter: 'saturate(180%) blur(12px)',
      WebkitBackdropFilter: 'saturate(180%) blur(12px)',
    } as any)
  : null;

type HeaderBarProps = {
  toggleSidebar: () => void;
  currentPage?: string;
  onLayout?: (width: number) => void;
  /** true once the page content has been scrolled away from the top */
  scrolled?: boolean;
};

const TopNavbar = ({ toggleSidebar, currentPage, onLayout, scrolled = false }: HeaderBarProps) => {
  const [showRoute, setShowRoute] = useState(true);
  const { isDarkMode } = useDarkMode();

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (onLayout) {
      onLayout(width);
    }
    setShowRoute(width >= 550);
  };

  const solidBg = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff';
  const glassBg = isDarkMode ? 'rgba(38, 38, 38, 0.82)' : 'rgba(255, 255, 255, 0.82)';

  return (
    <View
      style={[
        styles.wrapper,
        webChrome,
        webTransition('box-shadow, border-color, background-color', 180),
        {
          backgroundColor: isWeb ? glassBg : solidBg,
          borderColor: scrolled
            ? (isDarkMode ? '#4B5563' : '#e5e7eb')
            : 'transparent',
        },
        scrolled && isWeb && styles.wrapperScrolled,
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
    zIndex: 100000, // Ensure header is above main content
    position: 'relative',
  },
  wrapperScrolled: {
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.05), 0px 8px 24px rgba(15, 23, 42, 0.06)' } as any)
      : {}),
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
  },
  rightSide: {
    flexShrink: 1,
    minWidth: 150,
    flexGrow: 1,
    alignItems: 'flex-end',
  },
});
