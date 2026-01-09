import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import House from '../../assets/icons/house.svg';

type HomeProps = {
  close?: () => void;
};

const Home = ({ close }: HomeProps) => {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  const backgroundColor = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff';
  const titleColor = isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const iconColor = isDarkMode ? '#fff' : '#000';

  return (
    <View style={[styles.sidebar, { backgroundColor }]}>
      <View style={[styles.topCard, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#e2e8f0' }]}>
        <Pressable
          onPress={() => router.push('/')}
          style={({ pressed, hovered }) => [
            styles.homePressable,
            hovered && { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f0f4ff' },
            pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
          ]}
        >
          <View style={styles.homeRow}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e0e7ff' }]}>
              <House width={18} height={18} fill={iconColor} />
            </View>

            <View style={styles.titleBlock}>
              <Text style={[styles.homeTitle, { color: isDarkMode ? '#fff' : '#0f172a' }]}>ARES</Text>
              <Text style={[styles.homeSubtitle, { color: titleColor }]}>Dashboard</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* <SidebarItem
        label="Home"
        icon={
          <View style={styles.teamIcons}>
            <House width={18} height={18} fill={iconColor} />
          </View>
        }
        onPress={() => {
          router.push('/');
        }}
        isDarkMode={isDarkMode}
      /> */}
    </View>
  );
};

const SidebarItem = ({
  label,
  icon,
  onPress,
  isDarkMode,
}: {
  label: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
  isDarkMode: boolean;
}) => {
  const [hovered, setHovered] = useState(false);

  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const textColor = isDarkMode ? '#fff' : '#000';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        hovered && { backgroundColor: hoverBg, borderRadius: 13 },
      ]}
    >
      <View style={styles.iconLabel}>
        {icon ? icon : <View style={{ width: 16, height: 16, paddingLeft: 60 }} />}
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    paddingHorizontal: 9,
    gap: 2.2,
    paddingVertical: 9,
    marginBottom: 9,
  },
  topCard: {
    borderRadius: 10,
    padding: 6,
    marginHorizontal: 6,
    marginBottom: 8,
  },
  homePressable: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  homeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flexDirection: 'column',
    flex: 1,
  },
  homeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  homeSubtitle: {
    fontSize: 10,
    marginTop: 1,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 9,
    paddingHorizontal: 13,
  },
  item: {
    paddingVertical: 9,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  label: {
    fontSize: 15,
  },
  teamIcons: {
    paddingLeft: 33,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4.4,
    position: 'relative',
  },
  arrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default Home;