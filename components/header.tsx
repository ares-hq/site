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
    height: 40,
    padding: 20,
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
    marginLeft: 10,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 12,
  },
  divider: {
    color: '#9CA3AF',
    fontSize: 14,
    marginHorizontal: 6,
  },
  current: {
    fontSize: 14,
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
    paddingHorizontal: 10,
    borderRadius: 8,
    height: 36,
    marginRight: 16,
  },
  searchInput: {
    marginLeft: 6,
    fontSize: 14,
    width: 120,
    color: '#111',
  },
  iconButton: {
    marginHorizontal: 6,
    padding: 6,
  },
});