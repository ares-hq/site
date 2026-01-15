import { useDarkMode } from '@/context/DarkModeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import App from '../../assets/icons/app-store-logo.svg';
import Robot from '../../assets/icons/robot.svg';

type PlatformsProps = {
  close?: () => void;
  isMobile?: boolean;
};

const Platforms = ({ close, isMobile }: PlatformsProps) => {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  const backgroundColor = isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff';
  const titleColor = isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const iconColor = isDarkMode ? '#fff' : '#000';

  return (
    <View style={[styles.sidebar, { backgroundColor }]}>
      <Text style={[styles.sectionTitle, { color: titleColor }]}>Platforms</Text>

      <SidebarItem
        label="Discord Bot"
        icon={
          <View style={styles.teamIcons}>
            <Robot width={18} height={18} fill={iconColor} />
          </View>
        }
        onPress={() => {
          router.push('/platforms/discord');
          if (isMobile) close?.();
        }}
        isDarkMode={isDarkMode}
      />

      <SidebarItem
        label="Mobile App"
        icon={
          <View style={styles.teamIcons}>
            <App width={18} height={18} fill={iconColor} />
          </View>
        }
        onPress={() => {
          router.push('/platforms/app');
          if (isMobile) close?.();
        }}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const SidebarItem = ({
  label,
  icon,
  isSelected = false,
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

export default Platforms;