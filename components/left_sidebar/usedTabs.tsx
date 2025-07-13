import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';
import { getFavoritesForUser } from '@/api/auth';
import { supabase } from '@/api/dashboardInfo';

type UsedTabsProps = {
  close?: () => void;
};

type RecentEntry = { label: string; path: string };

export function addRecentItem(label: string, path: string) {
  const stored = localStorage.getItem('ARES_RECENTS');
  let items: RecentEntry[] = stored ? JSON.parse(stored) : [];

  items = items.filter((i) => i.label !== label);
  items = [{ label, path }, ...items].slice(0, 2);

  localStorage.setItem('ARES_RECENTS', JSON.stringify(items));
}

const UsedTabsItem = ({ item }: { item: RecentEntry }) => {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const { isDarkMode } = useDarkMode();

  const handleHoverIn = () => {
    Animated.timing(translateAnim, {
      toValue: 4,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handleHoverOut = () => {
    Animated.timing(translateAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handlePress = () => {
    if (item.path) router.push(item.path as any);
  };

  return (
    <Pressable
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPress={handlePress}
      style={styles.itemRow}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: isDarkMode
              ? 'rgba(255,255,255,0.2)'
              : 'rgba(0,0,0,0.2)',
          },
        ]}
      />
      <Animated.Text
        style={[
          styles.itemText,
          { color: isDarkMode ? '#fff' : '#000' },
          { transform: [{ translateX: translateAnim }] },
        ]}
      >
        {item.label}
      </Animated.Text>
    </Pressable>
  );
};

const UsedTabs = ({ close }: UsedTabsProps) => {
  const [selectedTab, setSelectedTab] = useState<'Favorites' | 'Recently'>('Favorites');
  const [recently, setRecently] = useState<RecentEntry[]>([]);
  const [favorites, setFavorites] = useState<RecentEntry[]>([]);
  const [hoveredF, setHoveredF] = useState(false);
  const [hoveredR, setHoveredR] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const { isDarkMode } = useDarkMode();

  // Poll for updated favorites every 3s
  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavorites([]);
        setLoadingFavorites(false);
        return;
      }

      const { data } = await getFavoritesForUser(user.id);
      if (!data) {
        setFavorites([]);
        setLoadingFavorites(false);
        return;
      }

      const parsed: RecentEntry[] = data.map((entry: string) => {
        const [label, path] = entry.split(':');
        return { label: label.trim(), path: path.trim() };
      });

      setFavorites(parsed);
      setLoadingFavorites(false);
    };

    fetchFavorites(); // initial load
    const interval = setInterval(fetchFavorites, 3000); // poll every 3s
    return () => clearInterval(interval);
  }, []);

  // Poll recently viewed every 500ms only when tab is selected
  useEffect(() => {
    if (selectedTab !== 'Recently') return;

    const fetchRecents = () => {
      const stored = localStorage.getItem('ARES_RECENTS');
      const parsed = stored ? (JSON.parse(stored) as RecentEntry[]) : [];
      setRecently(parsed);
      setLoadingRecent(false);
    };

    fetchRecents(); // initial
    const interval = setInterval(fetchRecents, 500);
    return () => clearInterval(interval);
  }, [selectedTab]);

  const renderContent = () => {
    if (selectedTab === 'Favorites') {
      if (loadingFavorites) return <ActivityIndicator style={{ marginTop: 10 }} />;
      if (favorites.length === 0)
        return <Text style={[styles.noText, { color: isDarkMode ? '#aaa' : '#666' }]}>No favorites</Text>;
      return (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.path}
          renderItem={({ item }) => <UsedTabsItem item={item} />}
        />
      );
    } else {
      if (loadingRecent) return <ActivityIndicator style={{ marginTop: 10 }} />;
      if (recently.length === 0)
        return <Text style={[styles.noText, { color: isDarkMode ? '#aaa' : '#666' }]}>No recent items</Text>;
      return (
        <FlatList
          data={recently}
          keyExtractor={(item) => item.path}
          renderItem={({ item }) => <UsedTabsItem item={item} />}
        />
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff' },
      ]}
    >
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setSelectedTab('Favorites')}
          onHoverIn={() => setHoveredF(true)}
          onHoverOut={() => setHoveredF(false)}
          style={
            hoveredF && {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
              borderRadius: 7,
            }
          }
        >
          <Text
            style={[
              styles.tab,
              {
                color:
                  selectedTab === 'Favorites'
                    ? isDarkMode
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.4)'
                    : isDarkMode
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.2)',
              },
            ]}
          >
            Favorites
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedTab('Recently')}
          onHoverIn={() => setHoveredR(true)}
          onHoverOut={() => setHoveredR(false)}
          style={
            hoveredR && {
              backgroundColor: isDarkMode
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
              borderRadius: 7,
            }
          }
        >
          <Text
            style={[
              styles.tab,
              {
                color:
                  selectedTab === 'Recently'
                    ? isDarkMode
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.4)'
                    : isDarkMode
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.2)',
              },
            ]}
          >
            Recent
          </Text>
        </Pressable>
      </View>

      {/* List or Message */}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    marginBottom: 18,
  },
  tabs: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 4.4,
  },
  tab: {
    fontSize: 15,
    padding: 6.6,
    paddingVertical: 4.4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6.6,
  },
  dot: {
    marginLeft: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 11,
  },
  itemText: {
    fontSize: 15,
  },
  noText: {
    textAlign: 'center',
    paddingTop: 14,
    fontSize: 15,
  },
});

export default UsedTabs;