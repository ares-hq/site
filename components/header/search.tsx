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
      <Feather name="search" size={14} color="#9ca3af" style={styles.icon} />
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
    paddingHorizontal: 11,
    paddingVertical: 4.4,
    borderRadius: 9,
    width: 176,
  },
  hovered: {
    backgroundColor: '#e5e7eb',
  },
  icon: {
    marginRight: 7,
  },
  input: {
    flex: 1,
    width: '100%',
    fontSize: 12,
    color: '#000',
    padding: 0,
    outlineWidth: 0,
    borderWidth: 0,
    outlineColor: 'transparent',
    outlineStyle: 'dashed',
  },
  keyHint: {
    backgroundColor: '#fff',
    paddingHorizontal: 7,
    paddingVertical: 2.2,
    borderRadius: 4.4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  keyText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '500',
  },
});

export default Search;