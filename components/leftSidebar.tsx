"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  TextInput,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"

// Components
import Analytics from "./left_sidebar/analytics"
import Dashboards from "./left_sidebar/dashboards"
import UsedTabs from "./left_sidebar/usedTabs"
import Platforms from "./left_sidebar/platforms"
import Scouting from "./left_sidebar/scouting"

// Icons
import Users from "@/assets/icons/users.svg"
import Eyes from "@/assets/icons/eyes.svg"
import Target from "@/assets/icons/target.svg"

// Context & API
import { useDarkMode } from "@/context/DarkModeContext"
import { useIsLoggedIn } from "@/api/auth"
import {
  fetchTeamName,
  getAllTeams,
  getCurrentUserRole,
  getCurrentUserTeam,
  getImage,
  supabase,
} from "@/api/dashboardInfo"
import { TeamInfo } from "@/api/types"

// Types
type SidebarProps = {
  close?: () => void
}

type UserProfile = {
  team_number?: string
  display_name?: string
  profile_picture?: string
  team_name?: string
  team_role?: string
}

// Cache
const profileCache = { userProfile: null as UserProfile | null }

// Constants
const DEFAULT_AVATAR = "https://ares-bot.com/assets/assets/images/ARES-Logo-Green.4f918b11e90e27726dc08b76b147977f.png"

const ACCOUNT_PLANS = [
  {
    id: "Player",
    title: "Team Member",
    description: "Join as a player to contribute and collaborate with your team.",
    icon: Users,
  },
  {
    id: "Spectator",
    title: "Spectator Account",
    description: "View team activity and updates without direct participation.",
    icon: Eyes,
  },
  {
    id: "Coach",
    title: "Team Coach",
    description: "Guide and support your team with coaching tools and insights.",
    icon: Target,
  },
]

export default function SettingsStyleSidebar({ close }: SidebarProps) {
  const { isDarkMode } = useDarkMode()
  const isLoggedIn = useIsLoggedIn()

  // State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [modalAnimation] = useState(new Animated.Value(0))
  const [accountPlan, setAccountPlan] = useState<string>("Player")
  const [teamAccountNumber, setTeamAccountNumber] = useState<string>("")
  const [displayName, setDisplayName] = useState("")
  const [query, setQuery] = useState("")
  const [allTeams, setAllTeams] = useState<TeamInfo[]>([])
  const [filteredTeams, setFilteredTeams] = useState<TeamInfo[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  // Theme colors
  const colors = {
    mutedText: isDarkMode ? "#9CA3AF" : "rgba(0, 0, 0, 0.2)",
    accountInputBackground: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "rgba(249, 249, 250, 1)",
    accountInputBorder: isDarkMode ? "rgba(42, 42, 42, 1)" : "rgba(249, 249, 250, 1)",
    inputTextColor: isDarkMode ? "#fff" : "#000",
    dropdownBackground: isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff",
    dropdownBorder: isDarkMode ? "rgba(75, 85, 99, 1)" : "#e5e7eb",
    backgroundColor: isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff",
    borderColor: isDarkMode ? "#4B5563" : "#e5e7eb",
    textColor: isDarkMode ? "#fff" : "#000",
    footerColor: isDarkMode ? "#777" : "#aaa",
    headerColor: isDarkMode ? "#9CA3AF" : "#6B7280",
    cardBg: isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(229, 231, 235, 0.8)",
    accentColor: "#3B82F6",
    inputBackground: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "#F9FAFB",
    sectionBackground: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "#FFFFFF",
  }

  // Effects
  useEffect(() => {
    fetchUserProfile()
  }, [isLoggedIn])

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    filterTeams()
  }, [query, allTeams, inputFocused])

  // Functions
  const fetchUserProfile = async () => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    if (profileCache.userProfile) {
      setUserProfile(profileCache.userProfile)
      setDisplayName(profileCache.userProfile.display_name || "")
      setLoading(false)
      return
    }

    try {
      const teamNumber = await getCurrentUserTeam()
      const teamAccountRole = await getCurrentUserRole()
      const image = await getImage(teamNumber || -1)
      
      let profile: UserProfile

      if (teamNumber) {
        const teamName = await fetchTeamName(teamNumber)
        profile = {
          team_number: "#" + teamNumber.toString(),
          team_name: teamName,
          team_role: teamAccountRole ?? undefined,
          profile_picture: image ?? undefined,
        }
      } else {
        profile = {
          display_name: teamAccountRole?.toLocaleUpperCase() ?? undefined,
          team_role: "Select Team",
          profile_picture: image ?? undefined,
        }
      }

      profileCache.userProfile = profile
      setUserProfile(profile)
      setDisplayName(profile.display_name || profile.team_number || "")
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    const teams = await getAllTeams()
    if (teams) setAllTeams(teams)
  }

  const filterTeams = () => {
    if (!query.trim()) {
      setFilteredTeams(allTeams.slice(0, 10))
      setShowDropdown(inputFocused)
      return
    }

    if (query.toLowerCase() === "none") {
      setFilteredTeams([{ teamNumber: 0, teamName: "None" } as TeamInfo])
      setShowDropdown(true)
      return
    }

    const matches = allTeams.filter(
      (team) =>
        (team.teamNumber !== undefined && team.teamNumber.toString().includes(query)) ||
        (team.teamName && team.teamName.toLowerCase().includes(query.toLowerCase()))
    )

    setFilteredTeams(matches.slice(0, 10))
    setShowDropdown(true)
  }

  const openModal = () => {
    setShowProfileModal(true)
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const closeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowProfileModal(false)
    })
  }

  const handleSaveChanges = async () => {
    Alert.alert("Success", "Your changes have been saved.")
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              await supabase.auth.signOut()
              profileCache.userProfile = null
              closeModal()
              router.replace("/auth/signin")
            } catch (error) {
              console.error("Error deleting account:", error)
            }
          },
        },
      ]
    )
  }

  const handleInputFocus = () => {
    setInputFocused(true)
    setShowDropdown(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      setInputFocused(false)
      setShowDropdown(false)
    }, 200)
  }

  const handleTeamSelect = (team: TeamInfo) => {
    if (team.teamNumber === 0) {
      setQuery("none")
      setSelectedTeam({ teamNumber: 0, teamName: "None" } as TeamInfo)
    } else {
      setQuery(team.teamNumber?.toString() || "")
      setSelectedTeam(team)
      setTeamAccountNumber(team.teamNumber?.toString() || "")
    }
    setShowDropdown(false)
    setInputFocused(false)
  }

  const getDisplayText = () => {
    if (userProfile?.team_number) {
      return userProfile.team_number
    }
    return userProfile?.display_name || "Loading"
  }

  const getSubtitleText = () => {
    if (userProfile?.team_number && userProfile?.team_name) {
      return userProfile.team_name
    }
    return null
  }

  const getProfilePicture = () => {
    return userProfile?.profile_picture || DEFAULT_AVATAR
  }

  const renderAccountPlans = () => {
    return ACCOUNT_PLANS.map((plan) => {
      const IconComponent = plan.icon
      return (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planOption,
            {
              backgroundColor: colors.accountInputBackground,
              borderColor: accountPlan === plan.id ? colors.textColor : colors.accountInputBorder,
            },
          ]}
          onPress={() => setAccountPlan(plan.id)}
        >
          <View style={styles.planContent}>
            <View style={styles.planIcon}>
              <IconComponent fill={isDarkMode ? "#fff" : "#000"} />
            </View>
            <View style={styles.planTextContainer}>
              <Text style={[styles.planTitle, { color: colors.textColor }]}>
                {plan.title}
              </Text>
              <Text style={[styles.planDescription, { color: colors.mutedText }]}>
                {plan.description}
              </Text>
            </View>
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioButton,
                  {
                    borderColor: accountPlan === plan.id ? colors.textColor : "transparent",
                    backgroundColor: accountPlan === plan.id ? colors.textColor : "transparent",
                  },
                ]}
              >
                {accountPlan === plan.id && (
                  <View style={[styles.radioButtonInner, { backgroundColor: colors.backgroundColor }]} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )
    })
  }

  const renderProfileCard = () => (
    <TouchableOpacity
      style={[styles.profileCard, { backgroundColor: colors.cardBg }]}
      onPress={openModal}
      activeOpacity={0.7}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getProfilePicture() }} style={styles.avatar} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.teamLabel, { color: colors.headerColor }]}>
            {loading ? "Loading..." : userProfile?.team_role?.toLocaleUpperCase()}
          </Text>
          <Text style={[styles.teamNumber, { color: colors.textColor }]}>
            {loading ? "Loading..." : getDisplayText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.headerColor} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  )

  const renderSignInCard = () => (
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

  const renderTeamDropdown = () => (
    <View style={[styles.section, { zIndex: showDropdown ? 1000 : 1 }]}>
      <Text style={[styles.sectionTitle, { color: colors.textColor }]}>
        Affiliated Team Number
      </Text>
      <Text style={[styles.helperText, { color: colors.mutedText }]}>
        Enter 'none' for no team affiliation.
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Search team number or name"
          placeholderTextColor={colors.mutedText}
          value={query}
          onChangeText={setQuery}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.inputTextColor,
              borderColor: "rgba(0, 0, 0, 0.2)",
            },
          ]}
        />
        <View style={styles.selectedTeamContainer}>
          <Text style={[styles.selectedTeamText, { color: colors.textColor }]}>
            {selectedTeam && selectedTeam.teamNumber !== 0
              ? `Selected: Team ${selectedTeam.teamNumber} - ${selectedTeam.teamName}`
              : "No Team Selected"}
          </Text>
        </View>
        {showDropdown && (
          <View
            style={[
              styles.inlineDropdown,
              {
                backgroundColor: colors.dropdownBackground,
                borderColor: colors.dropdownBorder,
              },
            ]}
          >
            <ScrollView
              style={styles.dropdownList}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: colors.dropdownBorder }]}
                onPress={() => handleTeamSelect({ teamNumber: 0, teamName: "None" } as TeamInfo)}
              >
                <Text style={[styles.dropdownItemText, { color: colors.inputTextColor }]}>
                  No team affiliation
                </Text>
              </TouchableOpacity>
              {filteredTeams
                .filter((team) => team.teamNumber !== 0)
                .map((team) => (
                  <TouchableOpacity
                    key={team.teamNumber}
                    onPress={() => handleTeamSelect(team)}
                    style={[styles.dropdownItem, { borderBottomColor: colors.dropdownBorder }]}
                  >
                    <Text style={[styles.dropdownItemText, { color: colors.inputTextColor }]}>
                      {team.teamNumber} — {team.teamName}
                    </Text>
                  </TouchableOpacity>
                ))}
              {filteredTeams.length === 0 && 
               query.trim() !== "" && 
               query.toLowerCase() !== "none" && (
                <View style={[styles.dropdownItem, { borderBottomColor: "transparent" }]}>
                  <Text style={[styles.dropdownItemText, { color: colors.inputTextColor }]}>
                    No Teams Found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { borderColor: colors.borderColor, backgroundColor: colors.backgroundColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile or Sign In */}
        {isLoggedIn ? renderProfileCard() : renderSignInCard()}

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
      <Modal visible={showProfileModal} transparent animationType="none" onRequestClose={closeModal}>
        <Animated.View
          style={[
            modalStyles.backdrop,
            {
              opacity: modalAnimation,
            },
          ]}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />
          <Animated.View
            style={[
              modalStyles.modalContent,
              {
                backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
                transform: [
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={modalStyles.header}>
                <Text style={[modalStyles.title, { color: colors.textColor }]}>
                  Account Settings
                </Text>
                <TouchableOpacity onPress={closeModal} style={modalStyles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.headerColor} />
                </TouchableOpacity>
              </View>

              {/* Profile Details Section */}
              <View style={[modalStyles.section, { backgroundColor: colors.sectionBackground }]}>
                <Text style={[modalStyles.sectionTitle, { color: colors.textColor }]}>
                  Profile Details
                </Text>
                
                {renderTeamDropdown()}

                <View style={[modalStyles.fieldGroup, { zIndex: 1 }]}>
                  <Text style={[modalStyles.fieldLabel, { color: colors.headerColor }]}>
                    Role
                  </Text>
                  <View style={styles.planContainer}>
                    {renderAccountPlans()}
                  </View>
                </View>

                <View style={modalStyles.fieldGroup}>
                  <Text style={[modalStyles.fieldLabel, { color: colors.headerColor }]}>
                    Team
                  </Text>
                  <View style={[modalStyles.input, modalStyles.readOnlyInput, { backgroundColor: colors.inputBackground }]}>
                    <Text style={[modalStyles.readOnlyText, { color: colors.headerColor }]}>
                      {getSubtitleText() || "No team"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Delete Account Section */}
              <View style={[modalStyles.dangerSection, { backgroundColor: colors.sectionBackground }]}>
                <Text style={[modalStyles.dangerTitle, { color: "#EF4444" }]}>
                  Danger Zone
                </Text>
                <Text style={[modalStyles.dangerDescription, { color: colors.headerColor }]}>
                  Once you delete your account, there is no going back. Please be certain.
                </Text>
                <TouchableOpacity
                  style={[modalStyles.deleteButton, { borderColor: "#EF4444" }]}
                  onPress={handleDeleteAccount}
                >
                  <Text style={[modalStyles.deleteButtonText, { color: "#EF4444" }]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
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
  profileCard: {
    marginHorizontal: 12,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 10,
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
  planContainer: {
    gap: 16,
  },
  planOption: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 16,
  },
  planContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  planIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: "center",
  },
  planTextContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioContainer: {
    marginLeft: 16,
  },
  selectedTeamContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  selectedTeamText: {
    fontSize: 12,
    fontWeight: "500",
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    position: "relative",
  },
  input: {
    borderWidth: 0.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  inlineDropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderWidth: 1,
    borderRadius: 10,
    maxHeight: 200,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownList: {
    flex: 1,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14,
  },
})

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 25,
    elevation: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  readOnlyInput: {
    justifyContent: "center",
  },
  readOnlyText: {
    fontSize: 16,
  },
  dangerSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
})