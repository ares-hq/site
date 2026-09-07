import { webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import House from '../../assets/icons/house.svg';

const Home = ({ close, isMobile }: { close?: () => void; isMobile?: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  const active = pathname === '/' || pathname === '/index';
  const iconBg = t.isDark ? '#1E2A4A' : '#EBF4FF';
  const iconBorder = t.isDark ? '#3B5998' : '#BFDBFE';
  const iconFill = t.isDark ? '#60A5FA' : '#1D4ED8';

  return (
    <View style={styles.sidebarWrapper}>
      <Pressable
        onPress={() => {
          router.push('/');
          if (isMobile) close?.();
        }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[
          styles.item,
          webTransition('background-color'),
          (hovered || active) && { backgroundColor: active ? t.c.accentSoft : t.c.rowHover },
        ]}
      >
        <View style={styles.iconLabel}>
          <View style={[styles.iconCircle, { backgroundColor: iconBg, borderColor: iconBorder, borderWidth: 1 }]}>
            <House width={16} height={16} fill={iconFill} />
          </View>

          <View style={styles.textStack}>
            <Text style={[styles.label, { color: active ? t.c.accentText : t.c.text }]}>ARES</Text>
            <Text style={[styles.subLabel, { color: t.c.textFaint }]}>Home</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  // Exact horizontal match to Platforms.tsx sidebar
  sidebarWrapper: {
    paddingHorizontal: 9, 
    marginBottom: 20,
  },
  // Exact vertical and horizontal match to SidebarItem
  item: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 13,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500', // Standard weight, matching "Discord Bot"
    lineHeight: 18,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    marginTop: -1, // Tighter spacing
  },
});

export default Home;