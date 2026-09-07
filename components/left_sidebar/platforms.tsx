import { webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { usePathname, useRouter } from 'expo-router';
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
  const pathname = usePathname();
  const t = useTheme();
  const iconColor = t.c.text;

  const nav = (path: string) => {
    router.push(path as any);
    if (isMobile) close?.();
  };

  return (
    <View style={[styles.sidebar, { backgroundColor: t.c.bg }]}>
      <Text style={[styles.sectionTitle, { color: t.c.textFaint }]}>Platforms</Text>

      <SidebarItem
        label="Discord Bot"
        icon={<View style={styles.teamIcons}><Robot width={18} height={18} fill={pathname === '/platforms/discord' ? t.c.accent : iconColor} /></View>}
        active={pathname === '/platforms/discord'}
        onPress={() => nav('/platforms/discord')}
      />

      <SidebarItem
        label="Mobile App"
        icon={<View style={styles.teamIcons}><App width={18} height={18} fill={pathname === '/platforms/app' ? t.c.accent : iconColor} /></View>}
        active={pathname === '/platforms/app'}
        onPress={() => nav('/platforms/app')}
      />
    </View>
  );
};

const SidebarItem = ({
  label,
  icon,
  active = false,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
}) => {
  const t = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        webTransition('background-color'),
        (hovered || active) && { backgroundColor: active ? t.c.accentSoft : t.c.rowHover },
      ]}
    >
      <View style={styles.iconLabel}>
        {icon ? icon : <View style={{ width: 16, height: 16, paddingLeft: 60 }} />}
        <Text style={[styles.label, { color: active ? t.c.accentText : t.c.text, fontWeight: active ? '600' : '400' }]}>{label}</Text>
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
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 9,
    paddingHorizontal: 13,
  },
  item: {
    paddingVertical: 9,
    borderRadius: 13,
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