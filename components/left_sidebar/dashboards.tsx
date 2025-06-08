import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Chart from '../../assets/icons/chart-pie-slice-fill.svg';
import Graph from '../../assets/icons/chart-line-fill.svg';

type DashboardProps = {
  navigateToPage: (page: string) => void;
};

const Dashboards = ({ navigateToPage }: DashboardProps) => {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.sectionTitle}>Dashboards</Text>

      <SidebarItem
        label="Into the Deep"
        icon={
          <View style={styles.teamIcons}>
            <Chart width={16} height={16} />
          </View>
        }
        onPress={() => navigateToPage('DIVE')}
      />

    <SidebarItem
        label="Decode"
        icon={
          <View style={styles.teamIcons}>
            <Graph width={16} height={16} />
          </View>
        }
        onPress={() => navigateToPage('AGE')}
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
    paddingHorizontal: 8,
    gap: 2,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
  },
  item: {
    paddingVertical: 8,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hoveredItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#000',
  },
  teamIcons: {
    paddingLeft: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowContainer: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
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