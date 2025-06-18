import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Qual = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Qualifiers — Coming Soon</Text>
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

export default Qual;