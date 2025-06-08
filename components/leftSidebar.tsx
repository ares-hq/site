import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Analytics from './left_sidebar/analytics';
import Dashboards from './left_sidebar/dashboards';
import UsedTabs from './left_sidebar/usedTabs';

type SidebarProps = {
  navigateToPage: (page: string) => void;
};

export default function Sidebar({ navigateToPage }: SidebarProps) {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: 'https://avatars.githubusercontent.com/u/1?v=4' }}
            style={styles.avatar}
          />
          <Text style={styles.profileName}>Team 14584</Text>
        </View>

        {/* Favorites & Recents */}
        <UsedTabs navigateToPage={navigateToPage}/>

        {/* Dashboards */}
        <Dashboards navigateToPage={navigateToPage}/>

        {/* Analytics */}
        <Analytics navigateToPage={navigateToPage}/>
        
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>🤖 ARES Dashboard</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 190,
    height: '100%',
    paddingTop: 12,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 16,
    marginRight: 12,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'InterRegular',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#aaa',
  },
});