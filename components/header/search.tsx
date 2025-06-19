import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useDarkMode } from '@/context/DarkModeContext'; // Adjust path as needed

const Search = () => {
  const [hovered, setHovered] = useState(false);
  const [query, setQuery] = useState('');
  const { isDarkMode } = useDarkMode();

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
        hovered && (isDarkMode ? styles.hoveredDark : styles.hoveredLight),
      ]}
    >
      <Feather
        name="search"
        size={14}
        color={isDarkMode ? '#d1d5db' : '#9ca3af'}
        style={styles.icon}
      />
      <TextInput
        style={[
          styles.input,
          { color: isDarkMode ? '#f9fafb' : '#000' },
        ]}
        placeholder="Search"
        placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
        value={query}
        onChangeText={setQuery}
      />
      <View
        style={[
          styles.keyHint,
          {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#fff',
            borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
          },
        ]}
      >
        <Text style={[styles.keyText, { color: isDarkMode ? '#9ca3af' : '#9ca3af' }]}>/</Text>
      </View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4.4,
    borderRadius: 9,
    width: 176,
  },
  containerLight: {
    backgroundColor: '#f3f4f6',
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  hoveredLight: {
    backgroundColor: '#e5e7eb',
  },
  hoveredDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  icon: {
    marginRight: 7,
  },
  input: {
    flex: 1,
    width: '100%',
    fontSize: 12,
    padding: 0,
    outlineWidth: 0,
    borderWidth: 0,
    outlineColor: 'transparent',
    outlineStyle: 'dashed',
  },
  keyHint: {
    paddingHorizontal: 7,
    paddingVertical: 2.2,
    borderRadius: 4.4,
    borderWidth: 1,
  },
  keyText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default Search;