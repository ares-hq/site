import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { router } from "expo-router"

type Props = {
  isDarkMode: boolean
}

export default function AuthCard({ isDarkMode }: Props) {
  const colors = {
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FA',
    headerColor: isDarkMode ? "#9CA3AF" : "#6B7280",
    textColor: isDarkMode ? "#fff" : "#000",
    accentColor: "#3B82F6",
  }

  return (
    <View style={[styles.signInCard, { backgroundColor: colors.cardBg }]}>
      <Text style={[styles.authSubhead, { color: colors.headerColor }]}>
        FTC Analytics Platform
      </Text>
      <Text style={[styles.authHeader, { color: colors.textColor }]}>
        Get Started
      </Text>
      <View style={styles.authButtonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.accentColor }]}
          onPress={() => router.push("/auth/signin")}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
              borderWidth: 1,
              backgroundColor: "transparent",
            },
          ]}
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textColor }]}>
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  signInCard: {
    marginHorizontal: 12,
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  authSubhead: {
    fontSize: 10,
    marginBottom: 6,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  authHeader: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
  },
  authButtonContainer: {
    gap: 10,
    width: "100%",
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
})