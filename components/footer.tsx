import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';
import { webTransition } from '@/components/shared/motion';

const FooterLink = ({
  label,
  onPress,
  color,
  hoverColor,
}: {
  label: string;
  onPress: () => void;
  color: string;
  hoverColor: string;
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      <Text
        style={[
          styles.link,
          webTransition('color'),
          { color: hovered ? hoverColor : color, textDecorationLine: hovered ? 'underline' : 'none' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const Footer = () => {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  const linkColor = isDarkMode ? '#94A3B8' : '#6b7280';
  const linkHover = isDarkMode ? '#60A5FA' : '#3b82f6';
  const sepColor = isDarkMode ? '#4B5563' : '#d1d5db';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
          borderColor: isDarkMode ? '#4B5563' : '#e5e7eb',
        },
      ]}
    >
      <Text style={[styles.brand, { color: isDarkMode ? '#E5E7EB' : '#111827' }]}>ARES</Text>

      <View style={styles.linkRow}>
        <FooterLink label="Privacy Policy" onPress={() => router.push('/privacy')} color={linkColor} hoverColor={linkHover} />
        <Text style={[styles.separator, { color: sepColor }]}>·</Text>
        <FooterLink label="Terms & Conditions" onPress={() => router.push('/tac')} color={linkColor} hoverColor={linkHover} />
        <Text style={[styles.separator, { color: sepColor }]}>·</Text>
        <FooterLink label="Systems Status" onPress={() => router.push('/systemstatus')} color={linkColor} hoverColor={linkHover} />
      </View>

      <Text style={[styles.copyright, { color: isDarkMode ? '#6B7280' : '#9ca3af' }]}>
        © {new Date().getFullYear()} Henry Bonomolo. All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 8,
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  link: {
    fontSize: 12,
    fontWeight: '500',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  separator: {
    fontSize: 12,
  },
  copyright: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default Footer;
