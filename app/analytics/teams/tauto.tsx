import { getAllTeams } from '@/api/dashboardInfo';
import DataTable from '@/components/graphs/teamTables';
import type { TeamInfo } from '@/api/types';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';

const TAuto = () => {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useDarkMode();

  React.useEffect(() => {
    const fetchTeams = async () => {
      const result = await getAllTeams();
      setTeams(result ?? []);
      setLoading(false);
    };
    fetchTeams();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.loadingOverlay,
          { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text
            style={[
              styles.loadingText,
              { color: isDarkMode ? '#60A5FA' : '#3B82F6' },
            ]}
          >
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: isDarkMode ? '#fff' : '#000' }]}>
        Auto Ranks
      </Text>
      <DataTable teams={teams} data="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  text: {
    fontSize: 15,
    marginBottom: 10,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TAuto;