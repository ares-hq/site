import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Analytics from './left_sidebar/analytics';
import Dashboards from './left_sidebar/dashboards';
import UsedTabs from './left_sidebar/usedTabs';
import Platforms from './left_sidebar/platforms';
import Scouting from './left_sidebar/scouting';
import { useDarkMode } from '@/context/DarkModeContext';
import { useIsLoggedIn } from '@/api/auth';

type SidebarProps = {
  close?: () => void;
};

export default function Sidebar({ close }: SidebarProps) {
  const { isDarkMode } = useDarkMode();
  const isLoggedIn = useIsLoggedIn();

  const backgroundColor = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff';
  const borderColor = isDarkMode ? '#4B5563' : '#e5e7eb';
  const textColor = isDarkMode ? '#fff' : '#000';
  const footerColor = isDarkMode ? '#777' : '#aaa';

  const handleSignIn = () => {
    console.log('Sign in pressed');
  };

  return (
    <View style={[styles.container, { borderColor, backgroundColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile or Sign In */}
        {isLoggedIn ? (
          <View style={styles.profileSection}>
            <Image
              source={{ uri: 'https://avatars.githubusercontent.com/u/1?v=4' }}
              style={styles.avatar}
            />
            <Text style={[styles.profileName, { color: textColor }]}>Team 14584</Text>
          </View>
        ) : (
          <View style={styles.signInSection}>
            <View style={styles.authButtonRow}>
              <TouchableOpacity
                style={[
                  styles.signUpButton,
                  {
                    backgroundColor: isDarkMode ? '#4B5563' : '#f3f4f6',
                  }
                ]}
                onPress={() => console.log('Sign up')}
              >
                <Text style={[styles.authButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>Sign up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  {
                    backgroundColor: isDarkMode ? '#fff' : '#000',
                  }
                ]}
                onPress={handleSignIn}
              >
                <Text style={[styles.authButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Favorites & Recents */}
        {isLoggedIn && <UsedTabs close={close} />}

        {/* Dashboards */}
        {isLoggedIn && <Dashboards close={close} />}

        {/* Analytics */}
        <Analytics close={close} />

        {/* Platforms */}
        <Platforms close={close} />

        {/* Scouting */}
        <Scouting close={close} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: footerColor }]}>🤖 ARES Dashboard</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 209,
    height: '100%',
    paddingTop: 13,
    justifyContent: 'space-between',
    borderRightWidth: 1,
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
  signInSection: {
    alignContent: 'center',
    paddingHorizontal: 28,
    marginBottom: 22,
  },
  authButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  signUpButton: {
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  signInButton: {
    borderRadius: 9999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  authButtonText: {
    fontSize: 14,
  },
  footer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
});