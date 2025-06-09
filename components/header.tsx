import React from 'react';
import { View, StyleSheet } from 'react-native';
import LeftSide from './header/leftSide';
import RightSide from './header/rightSide';

type HeaderBarProps = {
  toggleSidebar: () => void;
  currentPage?: string;
};

const TopNavbar = ({ toggleSidebar, currentPage }: HeaderBarProps) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.leftSide}>
          <LeftSide toggleSidebar={toggleSidebar} pageTitle={currentPage ?? ''} />
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
    flexWrap: 'wrap', // this is key to wrapping when needed
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