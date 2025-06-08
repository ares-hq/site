import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Search from './search';

import Bell from '../../assets/icons/bell-ringing.svg';
import Refresh from '../../assets/icons/arrow-clockwise.svg';
import Sun from '../../assets/icons/sun.svg';

import { Linking } from 'react-native';

const HoverIcon = ({ children }: { children: React.ReactNode }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.iconWrapper, hovered && styles.iconHovered]}
    >
      {children}
    </Pressable>
  );
};


const RightSide = () => {
  return (
    <View style={styles.container}>
        <View style={styles.search}>
            <Search />
        </View>

      <Pressable>
        <HoverIcon>
            <Sun width={14} height={14} />
        </HoverIcon>
      </Pressable>

      {/* Refresh button to reload the screen not the entire page*/}
      <Pressable onPress={() => Linking.openURL(window.location.href)}>
        <HoverIcon>
            <Refresh width={14} height={14} />
        </HoverIcon>
      </Pressable>

      <Pressable>
        <HoverIcon>
            <Bell width={14} height={14} />
        </HoverIcon>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 4,
    borderRadius: 6,
  },
  iconHovered: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  search: {
    paddingRight: 6,
  }
});

export default RightSide;