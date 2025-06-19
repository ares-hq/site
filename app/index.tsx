import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import LandingPage from '@/components/welcome';
import DataTable from '@/components/graphs/teamTables';
import { getAllTeams } from '@/api/dashboardInfo';
import { TeamInfo } from '@/api/types';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const init = async () => {
      const result = await getAllTeams();
      setTeams(result ?? []);
      setLoading(false);
      await SplashScreen.hideAsync();
    };
    init();

    // Auto-dismiss landing after 2.5s
    const timeout = setTimeout(() => {
      setShowLanding(false);
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LandingPage />
      <DataTable teams={teams} data="overall" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});