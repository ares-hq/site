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
import Binoculars from '../../assets/icons/binoculars.svg';

type ScoutingProps = {
  close?: () => void;
  isMobile?: boolean;
};

const Scouting = ({ close, isMobile }: ScoutingProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTheme();
  const active = pathname === '/scouting/ScoutSheet';

  const handleNavigate = () => {
    router.push('/scouting/ScoutSheet');
    if (isMobile) close?.();
  };

  return (
    <View style={[styles.sidebar, { backgroundColor: t.c.bg }]}>
      <Text style={[styles.sectionTitle, { color: t.c.textFaint }]}>Scouting</Text>

      <SidebarItem
        label="ScoutSheet"
        icon={<View style={styles.teamIcons}><Binoculars width={18} height={18} fill={active ? t.c.accent : t.c.text} /></View>}
        active={active}
        onPress={handleNavigate}
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
        {icon ? <View>{icon}</View> : <View style={{ width: 16, height: 16, paddingLeft: 60 }} />}
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
    marginBottom: 18,
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

export default Scouting;