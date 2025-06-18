import { getAllTeams } from '@/api/dashboardInfo';
import DataTable from '@/components/graphs/teamTables';
import type { TeamInfo } from '@/api/types';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const TRanks = () => {
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Text style={styles.text}>Team Ranks</Text>
      <DataTable teams={teams} data='overall'/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    marginBottom: 10,
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

export default TRanks;