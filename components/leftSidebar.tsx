import { ScrollView, StyleSheet, Text, View } from "react-native"
// Components
import Analytics from "./left_sidebar/analytics"
import Platforms from "./left_sidebar/platforms"
import Scouting from "./left_sidebar/scouting"
// Context & API
import { useDarkMode } from "@/context/DarkModeContext"
import Home from "./left_sidebar/home"

// Types
type SidebarProps = {
  close?: () => void
  isMobile?: boolean
}

export default function SettingsStyleSidebar({ close, isMobile }: SidebarProps) {
  const { isDarkMode } = useDarkMode()

  // Theme colors
  const colors = {
    backgroundColor: isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff",
    borderColor: isDarkMode ? "#4B5563" : "#e5e7eb",
    footerColor: isDarkMode ? "#777" : "#aaa",
  }

  // Don't show loading if we have userProfile data or if user is not logged in
  return (
    <View style={[styles.container, { borderColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Sidebar Content */}
        <Home close={close} isMobile={isMobile} />
        {/* <View style={[styles.separator, { backgroundColor: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "#f3f4f6" }]} /> */}
        <Analytics close={close} isMobile={isMobile} />
        <Platforms close={close} isMobile={isMobile} />
        <Scouting close={close} isMobile={isMobile} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.footerColor }]}>
          ARES Dashboard
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 209,
    height: "100%",
    paddingTop: 13,
    justifyContent: "space-between",
    borderRightWidth: 1,
  },
  separator: {
    height: 1,
    marginHorizontal: 10,
    marginBottom: 8,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 18,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
  },
})