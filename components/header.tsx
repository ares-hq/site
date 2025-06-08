import React from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import LeftSide from './header/leftSide';
import RightSide from './header/rightSide';

type HeaderBarProps = {
  toggleSidebar: () => void;
  currentPage?: string;
};

const TopNavbar = ({ toggleSidebar, currentPage }: HeaderBarProps) => {
  return (
    <View style={styles.container}>
      {/* Left side */}
      <LeftSide toggleSidebar={toggleSidebar} pageTitle={currentPage ?? ''}/>

      {/* Right side */}
      <RightSide />
    </View>
  );
};

export default TopNavbar;

const styles = StyleSheet.create({
  container: {
    height: 44,
    padding: 22,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSpacing: {
    marginLeft: 11,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 15,
    marginLeft: 13,
  },
  divider: {
    color: '#9CA3AF',
    fontSize: 15,
    marginHorizontal: 7,
  },
  current: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 11,
    borderRadius: 9,
    height: 40,
    marginRight: 18,
  },
  searchInput: {
    marginLeft: 7,
    fontSize: 15,
    width: 132,
    color: '#111',
  },
  iconButton: {
    marginHorizontal: 7,
    padding: 7,
  },
});