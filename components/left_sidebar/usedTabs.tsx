import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Animated } from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';

const favorites = ['Overview', 'Projects'];
const recently = ['Dashboard', 'Tasks'];

type UsedTabsProps = {
  close?: () => void;
};

const UsedTabs = ({ close }: UsedTabsProps) => {
  const [selectedTab, setSelectedTab] = useState<'Favorites' | 'Recently'>('Favorites');
  const items = selectedTab === 'Favorites' ? favorites : recently;

  const [hoveredF, setHoveredF] = useState(false);
  const [hoveredR, setHoveredR] = useState(false);

  const { isDarkMode } = useDarkMode();

  const UsedTabsItem = ({ item }: { item: (typeof items)[number] }) => {
    const translateAnim = useRef(new Animated.Value(0)).current;

    const handleHoverIn = () => {
      Animated.timing(translateAnim, {
        toValue: 4,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    const handleHoverOut = () => {
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      router.push(item as any);
      // close?.();
    };

    return (
      <Pressable
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPress={handlePress}
        style={styles.itemRow}
      >
        <View style={[
          styles.dot,
          { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }
        ]} />
        <Animated.Text
          style={[
            styles.itemText,
            { color: isDarkMode ? '#fff' : '#000' },
            { transform: [{ translateX: translateAnim }] }
          ]}
        >
          {item}
        </Animated.Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, {
      backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#fff',
    }]}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setSelectedTab('Favorites')}
          onHoverIn={() => setHoveredF(true)}
          onHoverOut={() => setHoveredF(false)}
          style={[hoveredF && {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderRadius: 7,
          }]}
        >
          <Text style={[
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
          ]}>
            Favorites
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedTab('Recently')}
          onHoverIn={() => setHoveredR(true)}
          onHoverOut={() => setHoveredR(false)}
          style={[hoveredR && {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            borderRadius: 7,
          }]}
        >
          <Text style={[
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
          ]}>
            Recent
          </Text>
        </Pressable>
      </View>

      {/* List Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <UsedTabsItem item={item} />}
      />
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
});

export default UsedTabs;