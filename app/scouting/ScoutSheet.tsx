import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScoutSheet = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Scouting — Coming Soon</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: '#9ca3af',
  },
});

export default ScoutSheet;
