import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';

const Footer = () => {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, {
      backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
      borderColor: isDarkMode ? '#4B5563' : '#e5e7eb',
    }]}>
      <View style={styles.linkRow}>
        <Pressable onPress={() => router.push('/privacy')}>
          <Text style={[styles.link, { color: isDarkMode ? '#60A5FA' : '#3b82f6' }]}>Privacy Policy</Text>
        </Pressable>

        <Text style={[styles.separator, { color: isDarkMode ? '#9CA3AF' : '#9ca3af' }]}>|</Text>

        <Pressable onPress={() => router.push('/tac')}>
          <Text style={[styles.link, { color: isDarkMode ? '#60A5FA' : '#3b82f6' }]}>Terms & Conditions</Text>
        </Pressable>

        <Text style={[styles.separator, { color: isDarkMode ? '#9CA3AF' : '#9ca3af' }]}>|</Text>

        <Pressable onPress={() => router.push('/systemstatus')}>
          <Text style={[styles.link, { color: isDarkMode ? '#60A5FA' : '#3b82f6' }]}>Systems Status</Text>
        </Pressable>
      </View>

      <Text style={[styles.copyright, { color: isDarkMode ? '#9CA3AF' : '#6b7280' }]}>
        © {new Date().getFullYear()} Henry Bonomolo. All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 4,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  link: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  separator: {
    fontSize: 12,
  },
  copyright: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default Footer;