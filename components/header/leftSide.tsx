import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import Sidebar from '../../assets/icons/sidebar-simple.svg';
import Star from '../../assets/icons/star.svg';
import StarFill from '../../assets/icons/star-fill.svg';
import { useDarkMode } from '@/context/DarkModeContext';
import { usePathname } from 'expo-router';
import { supabase } from '@/api/dashboardInfo';
import { getFavoritesForUser, toggleFavorite } from '@/api/auth';

type LeftSideProps = {
  toggleSidebar: () => void;
  pageTitle: string;
  showRoute: boolean;
};

const disallowedPages = ['index', 'tac', 'privacy', 'systemstatus'];

const HoverIcon = ({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const { isDarkMode } = useDarkMode();

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={[
        styles.iconWrapper,
        hovered && {
          backgroundColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.05)',
        },
      ]}
    >
      {children}
    </Pressable>
  );
};

const LeftSide = ({ toggleSidebar, pageTitle, showRoute }: LeftSideProps) => {
  const { isDarkMode } = useDarkMode();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const pathname = usePathname();

  const normalizedTitle = pageTitle.toLowerCase();
  const isFavoritable = !disallowedPages.includes(pathname);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (user) {
        setUserId(user.id);
        setIsLoggedIn(true);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId || !isFavoritable) return;

    const favoriteItem = `${pageTitle}:${pathname}`;

    const checkFavoriteStatus = async () => {
      const { data } = await getFavoritesForUser(userId);
      setIsFavorite(data?.includes(favoriteItem));
    };

    checkFavoriteStatus();
    const interval = setInterval(checkFavoriteStatus, 2000);
    return () => clearInterval(interval);
  }, [userId, pageTitle, pathname, isFavoritable]);

  const handleToggleFavorite = async () => {
    if (!userId || !isFavoritable) return;
    const favoriteItem = `${pageTitle}:${pathname}`;
    const { action, error } = await toggleFavorite(userId, favoriteItem);
    if (!error) setIsFavorite(action === 'added');
  };

  let routeLabel: string | null = null;
  if (pageTitle === 'AGE' || pageTitle === 'DIVE') {
    routeLabel = 'Dashboards';
  } else if (pageTitle === 'Discord' || pageTitle === 'App') {
    routeLabel = 'Platforms';
  } else if (pageTitle === 'ScoutSheet') {
    routeLabel = 'Scouting';
  } else if (
    ['Teams', 'Auto', 'TeleOp', 'Endgame', 'Matches', 'Qualifiers', 'Finals', 'Premier'].includes(pageTitle)
  ) {
    routeLabel = 'Analytics';
  }

  return (
    <View style={styles.container}>
      <View style={styles.icons}>
        <HoverIcon onPress={toggleSidebar}>
          <Sidebar width={15} height={15} fill={isDarkMode ? '#fff' : '#000'} />
        </HoverIcon>

        {isLoggedIn && showRoute && pageTitle !== '' && (
          <HoverIcon onPress={handleToggleFavorite}>
            {isFavorite ? (
              <StarFill width={15} height={15} fill={isDarkMode ? '#FACC15' : '#F59E0B'} />
            ) : (
              <Star width={15} height={15} fill={isDarkMode ? '#fff' : '#000'} />
            )}
          </HoverIcon>
        )}
      </View>

      {showRoute && pageTitle !== '' && (
        <>
          <Text style={[styles.faded, { color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>
            {routeLabel}
          </Text>
          <Text style={[styles.separator, { color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }]}>
            /
          </Text>
          <Text style={[styles.active, { color: isDarkMode ? '#fff' : '#000' }]}>
            {pageTitle}
          </Text>
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
  faded: {
    fontSize: 13,
  },
  separator: {
    marginHorizontal: 5,
    fontSize: 13,
  },
  active: {
    fontSize: 13,
  },
});

export default LeftSide;