import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Search from './search';

import Bell from '../../assets/icons/bell-ringing.svg';
import House from '../../assets/icons/house.svg';
import Refresh from '../../assets/icons/arrow-clockwise.svg';
import Sun from '../../assets/icons/sun.svg';
import { usePathname, useRouter, useGlobalSearchParams } from 'expo-router';

const HoverIcon = ({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={[styles.iconWrapper, hovered && styles.iconHovered]}
    >
      {children}
    </Pressable>
  );
};


const RightSide = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const teamnumber = params.teamnumber ? parseInt(params.teamnumber as string, 10) : NaN;

  let fullPath = pathname;
  if (!isNaN(teamnumber ?? NaN)) {
    fullPath = `${pathname}?teamnumber=${teamnumber}`;
  }
  return (
    <View style={styles.container}>
        <View style={styles.search}>
            <Search />
        </View>

      <Pressable>
        <HoverIcon>
            <Sun width={15} height={15} />
        </HoverIcon>
      </Pressable>

      {/* Refresh button to reload the screen not the entire page*/}
        <HoverIcon onPress={() => router.replace(fullPath as any)}>
            <Refresh width={15} height={15} />
        </HoverIcon>

        <HoverIcon onPress={() => router.replace('/')}>
            <House width={15} height={15} />
            {/* <Bell width={15} height={15} /> */}
        </HoverIcon>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 4.4,
    borderRadius: 7,
  },
  iconHovered: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  search: {
    paddingRight: 7,
  }
});

export default RightSide;