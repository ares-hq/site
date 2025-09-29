import { Ionicons } from "@expo/vector-icons"
import React from "react"
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"

type UserProfile = {
  team_number?: string
  display_name?: string
  profile_picture?: string
  team_name?: string
  team_role?: string
}

type Props = {
  userProfile: UserProfile | null
  loading: boolean
  isDarkMode: boolean
  onPress: () => void
}

const DEFAULT_AVATAR = "https://ares-bot.com/assets/assets/images/ARES-Logo-Green.4f918b11e90e27726dc08b76b147977f.png"

export default function ProfileCard({ userProfile, loading, isDarkMode, onPress }: Props) {
  const colors = {
    cardBg: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9F9FA',
    headerColor: isDarkMode ? "#9CA3AF" : "#6B7280",
    textColor: isDarkMode ? "#fff" : "#000",
  }

  const getDisplayText = () => {
    // Always prefer display name if available
    if (userProfile?.display_name) {
      return userProfile.display_name
    }
    // If no display name but has team number, show team number
    if (userProfile?.team_number) {
      return userProfile.team_number
    }
    // Only if no display name AND no team number, show Spectator
    return "Spectator"
  }

  const getProfilePicture = () => {
    return userProfile?.profile_picture || DEFAULT_AVATAR
  }

  return (
    <TouchableOpacity
      style={[styles.profileCard, { backgroundColor: colors.cardBg }]}
      onPress={() => {
        try {
          console.log('ProfileCard pressed', { userProfile, loading })
          onPress()
        } catch (error) {
          console.error('Error in ProfileCard onPress:', error)
          // Still call onPress even if there's an error to ensure settings access
          try {
            onPress()
          } catch (fallbackError) {
            console.error('Fallback onPress also failed:', fallbackError)
          }
        }
      }}
      activeOpacity={0.7}
      disabled={false} // Always keep the button enabled for settings access
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getProfilePicture() }} style={styles.avatar} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.teamLabel, { color: colors.headerColor }]}>
            {loading 
              ? "Loading..." 
              : (userProfile?.team_role?.toLocaleUpperCase() || 
                 (userProfile?.team_number ? "TEAM MEMBER" : "SPECTATOR"))
            }
          </Text>
          <Text 
            style={[styles.teamNumber, { color: colors.textColor }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {loading ? "Loading..." : getDisplayText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.headerColor} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  profileCard: {
    marginHorizontal: 12,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
    // Ensure touch events are handled
    pointerEvents: 'auto',
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileInfo: {
    flex: 1,
  },
  teamLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  teamNumber: {
    fontSize: 18,
  },
  chevron: {
    marginLeft: 8,
  },
})