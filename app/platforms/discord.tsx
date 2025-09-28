import DiscordBotApp from '@/components/platforms/discord';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Discord = () => (
  <DiscordBotApp />
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

export default Discord;