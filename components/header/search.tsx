import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

const Search = () => {
  const [hovered, setHovered] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[styles.container, hovered && styles.hovered]}
    >
      <Feather name="search" size={13} color="#9ca3af" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search"
        placeholderTextColor="#9ca3af"
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.keyHint}>
        <Text style={styles.keyText}>/</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    width: 160,
  },
  hovered: {
    backgroundColor: '#e5e7eb', // slightly darker gray
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    width: '100%',
    fontSize: 11,
    color: '#000',
    padding: 0,
    outlineWidth: 0,
    borderWidth: 0,
    outlineColor: 'transparent',
    outlineStyle: 'dashed',
  },
  keyHint: {
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  keyText: {
    color: '#9ca3af',
    fontSize: 9,
    fontWeight: '500',
  },
});

export default Search;