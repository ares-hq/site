import { useDarkMode } from "@/context/DarkModeContext";
import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  const navigation = useNavigation();
  const { isDarkMode } = useDarkMode();

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }
    ]}>
      <Text style={[
        styles.title,
        { color: isDarkMode ? '#F9FAFB' : '#111827' }
      ]}>
        404
      </Text>
      <Text style={[
        styles.subtitle,
        { color: isDarkMode ? '#9CA3AF' : '#6b7280' }
      ]}>
        Page not found
      </Text>

      <Pressable 
        onPress={() => router.push('/')} 
        style={[
          styles.button,
          { backgroundColor: isDarkMode ? '#4B5563' : '#000' }
        ]}
      >
        <Text style={[
          styles.buttonText,
          { color: isDarkMode ? '#F3F4F6' : '#fff' }
        ]}>
          Go Home
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 72,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});