import AppShowcasePage from '@/components/platforms/app';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const App = () => (
  <AppShowcasePage />
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

export default App;