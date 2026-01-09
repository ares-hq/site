import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import House from '../../assets/icons/house.svg'; 

const Home = ({ close }: { close?: () => void }) => {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [hovered, setHovered] = useState(false);

  // MATCHING YOUR SIDEBAR THEME EXACTLY
  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const textColor = isDarkMode ? '#fff' : '#000';
  const subTextColor = isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';

  // ICON CIRCLE THEME
  const iconBg = isDarkMode ? "#1E2A4A" : "#EBF4FF";
  const iconBorder = isDarkMode ? "#3B5998" : "#BFDBFE";
  const iconFill = isDarkMode ? '#60A5FA' : '#1D4ED8';

  return (
    <View style={styles.sidebarWrapper}>
      <Pressable
        onPress={() => {
          router.push('/');
        }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[
          styles.item,
          hovered && { backgroundColor: hoverBg, borderRadius: 13 },
        ]}
      >
        <View style={styles.iconLabel}>
          <View style={[
            styles.iconCircle, 
            { backgroundColor: iconBg, borderColor: iconBorder, borderWidth: 1 }
          ]}>
            <House width={16} height={16} fill={iconFill} />
          </View>

          <View style={styles.textStack}>
            {/* Matches your Platforms label size and weight */}
            <Text style={[styles.label, { color: textColor }]}>ARES</Text>
            {/* Sub-label matches the opacity of your sectionTitle */}
            <Text style={[styles.subLabel, { color: subTextColor }]}>Home</Text>
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