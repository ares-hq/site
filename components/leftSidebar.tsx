import { useState } from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"

// Components
import Analytics from "./left_sidebar/analytics"
import Dashboards from "./left_sidebar/dashboards"
import UsedTabs from "./left_sidebar/usedTabs"
import Platforms from "./left_sidebar/platforms"
import Scouting from "./left_sidebar/scouting"
import ProfileCard from "./auth/profileCard"
import AuthCard from "./auth/authCard"
import ProfileSettingsModal from "./auth/accountInfo"

// Hooks
import { useUserProfile } from "./auth/useUserProfile"

// Context & API
import { useDarkMode } from "@/context/DarkModeContext"
import { useIsLoggedIn } from "@/api/auth"

// Types
type SidebarProps = {
  close?: () => void
}

export default function SettingsStyleSidebar({ close }: SidebarProps) {
  const { isDarkMode } = useDarkMode()
  const isLoggedIn = useIsLoggedIn()
  const { userProfile, loading, profileCache } = useUserProfile(isLoggedIn)

  // State
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Theme colors
  const colors = {
    backgroundColor: isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff",
    borderColor: isDarkMode ? "#4B5563" : "#e5e7eb",
    footerColor: isDarkMode ? "#777" : "#aaa",
  }

  const openModal = () => {
    setShowProfileModal(true)
  }

  const closeModal = () => {
    setShowProfileModal(false)
  }

  return (
    <View style={[styles.container, { borderColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile or Sign In */}
        {isLoggedIn ? (
          <ProfileCard
            userProfile={userProfile}
            loading={loading}
            isDarkMode={isDarkMode}
            onPress={openModal}
          />
        ) : (
          <AuthCard isDarkMode={isDarkMode} />
        )}

        {/* Sidebar Content */}
        {isLoggedIn && <UsedTabs close={close} />}
        {isLoggedIn && <Dashboards close={close} />}
        
        <View style={[styles.separator, { backgroundColor: isDarkMode ? "rgba(71, 85, 105, 0.3)" : "#f3f4f6" }]} />
        
        <Analytics close={close} />
        <Platforms close={close} />
        <Scouting close={close} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.footerColor }]}>
          ARES Dashboard
        </Text>
      </View>

      {/* Settings Modal */}
      <ProfileSettingsModal
        visible={showProfileModal}
        onClose={closeModal}
        userProfile={userProfile}
        isDarkMode={isDarkMode}
        profileCache={profileCache}
      />
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
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 18,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
  },
})