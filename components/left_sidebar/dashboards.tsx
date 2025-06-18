import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Chart from '../../assets/icons/chart-pie-slice-fill.svg';
import Graph from '../../assets/icons/chart-line-fill.svg';
import { useRouter } from 'expo-router';

type DashboardsProps = {
  close?: () => void;
};

const Dashboards = ({ close }: DashboardsProps) => {
  const router = useRouter();

  return (
    <View style={styles.sidebar}>
      <Text style={styles.sectionTitle}>Dashboards</Text>

      <SidebarItem
        label="Into the Deep"
        icon={
          <View style={styles.teamIcons}>
            <Chart width={18} height={18} />
          </View>
        }
        onPress={() => 
          {router.push('/dashboards/intothedeep');
          close?.();
          }}
      />

    <SidebarItem
        label="Decode"
        icon={
          <View style={styles.teamIcons}>
            <Graph width={18} height={18} />
          </View>
        }
        onPress={() => {
          router.push('/dashboards/age')
          close?.();
        }}
      />
    </View>
  );
};

const SidebarItem = ({
  label,
  icon,
  isSelected = false,
  onPress,
}: {
  label: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.item,
        hovered && styles.hoveredItem,
      ]}
    >
      <View style={styles.iconLabel}>
        {icon ? (
          <View>{icon}</View>
        ) : (
          <View style={{ width: 16, height: 16, paddingLeft: 60 }} />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    paddingHorizontal: 9,
    gap: 2.2,
    paddingVertical: 9,
    backgroundColor: '#fff',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 9,
    color: 'rgba(0, 0, 0, 0.4)',
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
  hoveredItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 13,
  },
  label: {
    fontSize: 15,
    color: '#000',
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

export default Dashboards;