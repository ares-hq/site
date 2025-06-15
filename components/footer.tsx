import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const Footer = () => {
  const router = useRouter();

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.linkRow}>
        <Pressable onPress={() => handleLinkPress('https://ares-bot.com/privacy')}>
          <Text style={styles.link}>Privacy Policy</Text>
        </Pressable>

        <Text style={styles.separator}>|</Text>

        <Pressable onPress={() => handleLinkPress('https://ares-bot.com/tac')}>
          <Text style={styles.link}>Terms & Conditions</Text>
        </Pressable>

        <Text style={styles.separator}>|</Text>

        <Pressable onPress={() => router.push('/status')}>
          <Text style={styles.link}>Systems Status</Text>
        </Pressable>
      </View>

      <Text style={styles.copyright}>
        © {new Date().getFullYear()} Henry Bonomolo. All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  link: {
    fontSize: 12,
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
  separator: {
    fontSize: 12,
    color: '#9ca3af',
  },
  copyright: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
});

export default Footer;