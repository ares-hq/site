import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import Sidebar from '../../assets/icons/sidebar-simple.svg';
import Star from '../../assets/icons/star.svg';

type LeftSideProps = {
  toggleSidebar: () => void;
  pageTitle: string;
  showRoute: boolean;
};

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

const LeftSide = ({ toggleSidebar, pageTitle, showRoute }: LeftSideProps) => {
  let routeLabel: string | null = null;

  if (pageTitle === 'AGE' || pageTitle === 'DIVE') {
    routeLabel = 'Dashboards';
  } else if (pageTitle === 'Discord' || pageTitle === 'App') {
    routeLabel = 'Platforms';
  } else if (pageTitle === 'ScoutSheet') {
    routeLabel = 'Scouting';
  } else if (
    pageTitle === 'Teams' || pageTitle === 'Auto' || pageTitle === 'TeleOp' || pageTitle === 'Endgame' ||
    pageTitle === 'Matches' || pageTitle === 'Qualifiers' || pageTitle === 'Finals' || pageTitle === 'Premier'
  ) {
    routeLabel = 'Analytics';
  } else {
    routeLabel = null;
  }
  return (
    <View style={styles.container}>
      {/* Icons */}
      <View style={styles.icons}>
        <HoverIcon onPress={toggleSidebar}>
          <Sidebar width={15} height={15} />
        </HoverIcon>

        <HoverIcon>
          <Star width={15} height={15} />
        </HoverIcon>
      </View>

      {/* Labels */}
      {showRoute && pageTitle !== '' && (
        <>
          <Text style={styles.faded}>
          {pageTitle === 'AGE' || pageTitle === 'DIVE' ? 'Dashboards' : pageTitle === 'Discord' || pageTitle === 'App' ? 'Platforms' : pageTitle === 'ScoutSheet' ? 'Scouting' : 'Analytics'}
          </Text>
          <Text style={styles.separator}> / </Text>
          <Text style={styles.active}>{pageTitle}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 9,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 22,
  },
  icons: {
    gap: 9,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 4.4,
    borderRadius: 7,
  },
  iconHovered: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  faded: {
    color: 'rgba(0, 0, 0, .4)',
    fontSize: 13,
  },
  separator: {
    marginHorizontal: 2.2,
    color: 'rgba(0, 0, 0, .2)',
    fontSize: 13,
  },
  active: {
    color: '#000',
    fontSize: 13,
  },
});

export default LeftSide;