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
import Platforms from './left_sidebar/platforms';

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

        {/* Platforms */}
        <Platforms navigateToPage={navigateToPage}/>
        
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
    width: 209,
    height: '100%',
    paddingTop: 13,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 18,
    marginRight: 13,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'InterRegular',
  },
  footer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#aaa',
  },
});