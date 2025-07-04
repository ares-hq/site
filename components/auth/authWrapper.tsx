import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';
import Footer from '../footer';
import { router } from 'expo-router';

type Props = {
  children: React.ReactNode;
};

export default function AuthWrapper({ children }: Props) {
  const { isDarkMode } = useDarkMode();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  const navRoutes: Record<string, string> = {
    Home: '/',
    Teams: 'analytics/teams/tranks',
    Matches: 'analytics/matches/mranks',
    App: 'platforms/app',
    Discord: 'platforms/discord',
 };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  // Hide nav items when screen is too small (less than 768px)
  const shouldShowNav = screenWidth >= 768;

  return (
    <SafeAreaView style={[styles.wrapper, { backgroundColor: isDarkMode ? '#1F1F1F' : '#F9FAFB' }]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.logo, { color: isDarkMode ? '#fff' : '#000' }]}>ARES Dashboard</Text>
        
        {/* Navigation - hidden on small screens */}
        {shouldShowNav && (
        <View style={styles.navContainer}>
            {['Home', 'Teams', 'Matches', 'App', 'Discord'].map((item) => (
            <TouchableOpacity
                key={item}
                style={styles.navButton}
                onPress={() => router.push(navRoutes[item] as any)}
            >
                <Text style={[styles.navText, { color: isDarkMode ? '#ccc' : '#444' }]}>
                {item}
                </Text>
            </TouchableOpacity>
            ))}
        </View>
        )}
        
        {/* Spacer when nav is hidden to center the logo */}
        {!shouldShowNav && <View style={styles.spacer} />}
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.outlineBtn, { backgroundColor: isDarkMode ? '#2E2E2E' : '#f3f4f6' }]}
            onPress={() => router.push('/auth/signup')}>
            <Text style={[styles.outlineText, { color: isDarkMode ? '#fff' : '#374151' }]}>Sign up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fillBtn}
          onPress={() => router.push('/auth/signin')}>
            <Text style={styles.fillText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.centeredContent}>{children}</View>
        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    height: 60,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    backgroundColor: '#fff',
  },
  darkHeader: {
    backgroundColor: '#1A1A1A',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  logo: {
    fontWeight: '700',
    fontSize: 18,
    width: 200,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  spacer: {
    flex: 1,
  },
  navButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  navText: {
    fontSize: 13,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    width: 200,
  },
  outlineBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  outlineText: {
    fontSize: 13,
  },
  fillBtn: {
    backgroundColor: '#3B82F6', // Blue-400
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  fillText: {
    color: '#fff',
    fontSize: 13,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
});