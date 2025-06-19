import React, { useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Dimensions } from 'react-native';
import LeftSide from './header/leftSide';
import RightSide from './header/rightSide';

type HeaderBarProps = {
  toggleSidebar: () => void;
  currentPage?: string;
  onLayout?: (width: number) => void;
};

const TopNavbar = ({ toggleSidebar, currentPage, onLayout }: HeaderBarProps) => {
  const [showRoute, setShowRoute] = useState(true);
  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    if (onLayout) {
      onLayout(width);
    }
    setShowRoute(width >= 550);
  };
  
  return (
    <View style={styles.wrapper} onLayout={handleLayout}>
      <View style={styles.container}>
        <View style={styles.leftSide}>
          <LeftSide toggleSidebar={toggleSidebar} pageTitle={currentPage ?? ''} showRoute={showRoute}/>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    flexDirection: 'row',
    // flexWrap: 'wrap', // this is key to wrapping when needed
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSide: {
    flexShrink: 1,
    minWidth: 150,
    flexGrow: 1,
    marginBottom: 6, // spacing when stacked
  },
  rightSide: {
    flexShrink: 1,
    minWidth: 150,
    flexGrow: 1,
    alignItems: 'flex-end',
    marginBottom: 6,
  },
});