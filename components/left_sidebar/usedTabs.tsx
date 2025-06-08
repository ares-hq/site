import React, { useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Animated } from 'react-native';

const favorites = ['Overview', 'Projects'];
const recently = ['Dashboard', 'Tasks'];

type UsedTabsProps = {
  navigateToPage: (page: string) => void;
};

const UsedTabs = ({ navigateToPage }: UsedTabsProps) => {
  const [selectedTab, setSelectedTab] = useState<'Favorites' | 'Recently'>('Favorites');

  const items = selectedTab === 'Favorites' ? favorites : recently;
  const [hoveredF, setHoveredF] = useState(false);
  const [hoveredR, setHoveredR] = useState(false);

    const UsedTabsItem = ({ item }: { item: string }) => {
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

    return (
        <Pressable
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPress={() => console.log(`Pressed ${item}`)}
        style={styles.itemRow}
        >
        <View style={styles.dot} />
        <Animated.Text
            style={[
            styles.itemText,
            { transform: [{ translateX: translateAnim }] },
            ]}
        >
            {item}
        </Animated.Text>
        </Pressable>
    );
    };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable 
            onPress={() => setSelectedTab('Favorites')}
            onHoverIn={() => setHoveredF(true)}
            onHoverOut={() => setHoveredF(false)}
            style={[
                hoveredF && styles.hoveredItem,
            ]}
            >
          <Text style={[styles.tab, selectedTab === 'Favorites' && styles.activeTab]}>
            Favorites
          </Text>
        </Pressable>
        <Pressable 
            onPress={() => setSelectedTab('Recently')}
            onHoverIn={() => setHoveredR(true)}
            onHoverOut={() => setHoveredR(false)}
            style={[
                hoveredR && styles.hoveredItem,
            ]}
            >
          <Text style={[styles.tab, selectedTab === 'Recently' && styles.activeTab]}>
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
    backgroundColor: '#fff',
    paddingHorizontal: 14, 
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  tab: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.2)',
    padding: 6,
    paddingVertical: 4,
  },
  activeTab: {
    color: 'rgba(0, 0, 0, 0.4)',
  },
  hoveredItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dot: {
    marginLeft: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginRight: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#000',
  },
});

export default UsedTabs;