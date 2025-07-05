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
import { router } from 'expo-router';

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
  const headerColor = isDarkMode ? '#9CA3AF' : '#6B7280';


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
            <Text style={[styles.authSubhead, { color: headerColor }]}>FTC Analytics platform</Text>
            <Text style={[styles.authHeader, { color: textColor }]}>Get Started</Text>
            <View style={styles.authButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: '#3B82F6'
                  }
                ]}
                onPress={() => router.push('/auth/signin')}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
                    borderWidth: 1,
                    backgroundColor: 'transparent',
                  }
                ]}
                onPress={() => router.push('/auth/signup')}
              >
                <Text style={[styles.secondaryButtonText, { color: textColor }]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: isDarkMode ? '#rgba(71, 85, 105, 0.3)' : '#f3f4f6' }]} />

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
        <Text style={[styles.footerText, { color: footerColor }]}>ARES Dashboard</Text>
      </View>
    </View>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     width: 209,
//     height: '100%',
//     paddingTop: 13,
//     justifyContent: 'space-between',
//     borderRightWidth: 1,
//   },
//   profileSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 22,
//     marginBottom: 22,
//   },
//   avatar: {
//     width: 26,
//     height: 26,
//     borderRadius: 18,
//     marginRight: 13,
//   },
//   profileName: {
//     fontSize: 15,
//     fontWeight: '600',
//     fontFamily: 'InterRegular',
//   },
//   signInSection: {
//     paddingHorizontal: 22,
//     marginBottom: 22,
//     marginTop: 5,
//   },
//   authSubhead: {
//     fontSize: 10,
//     marginBottom: 6,
//   },
//   authHeader: {
//     fontSize: 14,
//     marginBottom: 14,
//   },
//   authButtonRow: {
//     flexDirection: 'row',
//     gap: 10,
//     alignContent: 'center',
//     justifyContent: 'center',
//   },
//   signUpButton: {
//     borderRadius: 9999,
//     paddingVertical: 6,
//     paddingHorizontal: 18,
//   },
//   signInButton: {
//     borderRadius: 9999,
//     paddingVertical: 6,
//     paddingHorizontal: 18,
//   },
//   authButtonText: {
//     fontSize: 12,
//   },
//   separator: {
//     height: 1,
//     marginHorizontal: 10,
//     marginBottom: 16,
//   },
//   footer: {
//     paddingVertical: 18,
//     alignItems: 'center',
//   },
//   footerText: {
//     fontSize: 13,
//   },
// });

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
    paddingHorizontal: 22,
    marginBottom: 22,
    marginTop: 5,
    alignItems: 'center',
  },
  brandContainer: {
    marginBottom: 12,
  },
  brandEmoji: {
    fontSize: 24,
  },
  authSubhead: {
    fontSize: 10,
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  authHeader: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  authDescription: {
    fontSize: 10,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 14,
  },
  authButtonContainer: {
    gap: 8,
    width: '100%',
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginHorizontal: 10,
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
});