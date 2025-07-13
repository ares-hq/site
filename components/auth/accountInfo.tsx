"use client"

import { useState, useEffect } from "react"
import { View, Text, Modal, Animated, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from "react-native"
import { router } from "expo-router"

// Icons
import Users from "@/assets/icons/users.svg"
import Eyes from "@/assets/icons/eyes.svg"
import Cancel from "@/assets/icons/x-circle.svg"
import Target from "@/assets/icons/target.svg"
import Warning from "@/assets/icons/warning.svg"

// API
import { deleteAccount, getAllTeams, getName, supabase, updateUserProfile } from "@/api/dashboardInfo"
import type { TeamInfo } from "@/api/types"

// Types
import { useUserProfile, type UserProfile } from "./useUserProfile"
import { useIsLoggedIn } from "@/api/auth"

type Props = {
  visible: boolean
  onClose: () => void
  isDarkMode: boolean
}

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

export default function ProfileSettingsModal({
  visible,
  onClose,
  isDarkMode,
}: Props) {
  const [modalAnimation] = useState(new Animated.Value(0))
  
  // Form state
  const [displayName, setDisplayName] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null)
  const [accountPlan, setAccountPlan] = useState<string>("Player")
  
  // Team search state
  const [query, setQuery] = useState("")
  const [allTeams, setAllTeams] = useState<TeamInfo[]>([])
  const [filteredTeams, setFilteredTeams] = useState<TeamInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  
  // Other state
  const [confirmDeactivation, setConfirmDeactivation] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFormInitialized, setIsFormInitialized] = useState(false)
  
  // Original values for comparison
  const [originalValues, setOriginalValues] = useState({
    displayName: "",
    teamNumber: null as number | null,
    accountPlan: "Player"
  })

  const isLoggedIn = useIsLoggedIn()
  const { userProfile, refetchProfile, clearCache } = useUserProfile(isLoggedIn)

  // Exact color scheme from original
  const headerColor = isDarkMode ? "#9CA3AF" : "#6B7280"
  const textColor = isDarkMode ? "#F9FAFB" : "#111827"
  const mutedText = isDarkMode ? "#9CA3AF" : "rgba(0, 0, 0, 0.2)"
  const backgroundColor = isDarkMode ? "rgba(42, 42, 42, 1)" : "#FFFFFF"
  const inputBackground = isDarkMode ? "rgba(0, 0, 0, 0.1)" : "#fff"
  const accountInputBackground = isDarkMode ? "rgba(0, 0, 0, 0.1)" : "rgba(249, 249, 250, 1)"
  const accountInputBorder = isDarkMode ? "rgba(42, 42, 42, 1)" : "rgba(249, 249, 250, 1)"
  const inputTextColor = isDarkMode ? "#fff" : "#000"
  const saveChanges = isDarkMode ? "#fff" : "#000"
  const saveChangesText = isDarkMode ? "#000" : "#fff"
  const dropdownBackground = isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff"
  const dropdownBorder = isDarkMode ? "rgba(75, 85, 99, 1)" : "#e5e7eb"

  // Load teams when modal opens
  useEffect(() => {
    if (visible) {
      fetchTeams()
    }
  }, [visible])

  // Initialize form with user profile data ONLY when modal first opens or after save
  useEffect(() => {
    if (userProfile && visible && !isFormInitialized) {
      const teamNumber = userProfile.team_number 
        ? Number.parseInt(userProfile.team_number.replace("#", "")) 
        : null

      // Set form values
      setAccountPlan(userProfile.team_role || "Player")
      
      // Set selected team
      if (teamNumber && teamNumber > 0) {
        setSelectedTeam({
          teamNumber,
          teamName: userProfile.team_name || "",
        })
      } else {
        setSelectedTeam(null)
      }

      // Store original values for comparison
      setOriginalValues({
        displayName: userProfile.display_name || "",
        teamNumber,
        accountPlan: userProfile.team_role || "Player"
      })

      // Reset other state
      setQuery("")
      setConfirmDeactivation(false)
      setIsFormInitialized(true)

      // Animate modal
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start()
    }
  }, [userProfile, visible, isFormInitialized])

  // Reset form initialization when modal closes
  useEffect(() => {
    if (!visible) {
      setIsFormInitialized(false)
    }
  }, [visible])

  // Filter teams based on search query
  useEffect(() => {
    filterTeams()
  }, [query, allTeams, inputFocused])

  const fetchTeams = async () => {
    try {
      const teams = await getAllTeams()
      if (teams) setAllTeams(teams)
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
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
        (team.teamName && team.teamName.toLowerCase().includes(query.toLowerCase())),
    )

    setFilteredTeams(matches.slice(0, 10))
    setShowDropdown(true)
  }

  const hasChanges = () => {
    return (
      displayName.trim() !== originalValues.displayName ||
      (selectedTeam?.teamNumber || null) !== originalValues.teamNumber ||
      accountPlan !== originalValues.accountPlan
    )
  }

  const closeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onClose()
    })
  }

  const handleSave = async () => {
    if (isSaving || !hasChanges()) return
    
    setIsSaving(true)
    
    try {
      const trimmedName = displayName.trim()
      
      // Update Supabase Auth metadata for display name
      if (trimmedName !== originalValues.displayName) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { display_name: trimmedName },
        })
        if (metadataError) throw metadataError
      }

      // Update profile in database
      const updateData = {
        displayName: trimmedName,
        teamNumber: selectedTeam?.teamNumber || 0,
        accountType: accountPlan,
      }
      
      await updateUserProfile(updateData)

      // Force refresh profile data
      await refetchProfile()

      // Reset form initialization so it updates with new data
      setIsFormInitialized(false)

      Alert.alert("Success", "Profile updated successfully!")
      closeModal()
    } catch (error) {
      console.error("Save error:", error)
      Alert.alert("Error", `Failed to update profile: ${(error as Error).message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      clearCache()
      router.replace("/auth/signin")
    } catch (error) {
      console.error("Error logging out:", error)
      Alert.alert("Error", "Failed to log out. Please try again.")
    }
  }

  const handleDeleteAccount = async () => {
    try {
        deleteAccount()
        clearCache()
        closeModal()
        router.replace("/auth/signin")
        } catch (error) {
        console.error("Error deleting account:", error)
    }
  }

  const handleTeamSelect = (team: TeamInfo) => {
    if (team.teamNumber === 0) {
      setSelectedTeam(null)
    } else {
      setSelectedTeam(team)
    }
    setQuery("")
    setShowDropdown(false)
    setInputFocused(false)
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
              backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "#fff",
              borderColor: accountPlan === plan.id ? textColor : accountInputBorder,
            },
          ]}
          onPress={() => setAccountPlan(plan.id)}
        >
          <View style={styles.planContent}>
            <View style={styles.planIcon}>
              <IconComponent fill={isDarkMode ? "#fff" : "#000"} />
            </View>
            <View style={styles.planTextContainer}>
              <Text style={[styles.planTitle, { color: textColor }]}>{plan.title}</Text>
              <Text style={[styles.planDescription, { color: mutedText }]}>{plan.description}</Text>
            </View>
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radioButton,
                  {
                    borderColor: accountPlan === plan.id ? textColor : "transparent",
                    backgroundColor: accountPlan === plan.id ? textColor : "transparent",
                  },
                ]}
              >
                {accountPlan === plan.id && (
                  <View style={[styles.radioButtonInner, { backgroundColor: backgroundColor }]} />
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )
    })
  }

  const renderTeamDropdown = () => (
    <View style={[styles.section, { zIndex: showDropdown ? 1000 : 1 }]}>
      <Text style={[styles.fieldLabel, { color: headerColor }]}>Affiliated Team Number</Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Search team number or name"
          placeholderTextColor={mutedText}
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            setInputFocused(true)
            setShowDropdown(true)
          }}
          onBlur={() => {
            setTimeout(() => {
              setInputFocused(false)
              setShowDropdown(false)
            }, 200)
          }}
          style={[
            styles.input,
            {
              backgroundColor: inputBackground,
              color: inputTextColor,
              borderColor: "rgba(0, 0, 0, 0.2)",
            },
          ]}
        />
        <View style={styles.selectedTeamContainer}>
          <Text style={[styles.selectedTeamText, { color: textColor }]}>
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
                backgroundColor: dropdownBackground,
                borderColor: dropdownBorder,
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
                style={[styles.dropdownItem, { borderBottomColor: dropdownBorder }]}
                onPress={() => handleTeamSelect({ teamNumber: 0, teamName: "None" } as TeamInfo)}
              >
                <Text style={[styles.dropdownItemText, { color: inputTextColor }]}>No team affiliation</Text>
              </TouchableOpacity>
              {filteredTeams
                .filter((team) => team.teamNumber !== 0)
                .map((team) => (
                  <TouchableOpacity
                    key={team.teamNumber}
                    onPress={() => handleTeamSelect(team)}
                    style={[styles.dropdownItem, { borderBottomColor: dropdownBorder }]}
                  >
                    <Text style={[styles.dropdownItemText, { color: inputTextColor }]}>
                      {team.teamNumber} — {team.teamName}
                    </Text>
                  </TouchableOpacity>
                ))}
              {filteredTeams.length === 0 && query.trim() !== "" && query.toLowerCase() !== "none" && (
                <View style={[styles.dropdownItem, { borderBottomColor: "transparent" }]}>
                  <Text style={[styles.dropdownItemText, { color: inputTextColor }]}>No Teams Found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeModal}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: modalAnimation,
          },
        ]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: backgroundColor,
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
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>Account Settings</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleLogOut}
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: inputBackground,
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                  ]}
                >
                  <Text style={[styles.cancelButtonText, { color: textColor }]}>Log Out</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeModal}>
                  <Cancel width={20} height={20} fill={textColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Profile Details Section */}
            <View style={[styles.modalSection, { backgroundColor: accountInputBackground }]}>
              <View style={styles.modalSectionHeader}>
                <Text style={[styles.modalSectionTitle, { color: textColor }]}>Profile Details</Text>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[
                    styles.saveButton,
                    {
                      opacity: hasChanges() ? 1 : 0.5,
                      backgroundColor: saveChanges,
                    },
                  ]}
                  disabled={!hasChanges() || isSaving}
                >
                  <Text style={[styles.saveButtonText, { color: saveChangesText }]}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.fieldGroup, { marginBottom: 30 }]}>
                <Text style={[styles.fieldLabel, { color: headerColor }]}>Display Name</Text>
                <TextInput
                  placeholder="Enter Display Name"
                  placeholderTextColor={mutedText}
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBackground,
                      color: inputTextColor,
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                  ]}
                />
                <View style={styles.selectedTeamContainer}>
                  <Text style={[styles.selectedTeamText, { color: textColor }]}>
                    Current: {userProfile?.display_name || "No name set"}
                  </Text>
                </View>
              </View>

              {renderTeamDropdown()}

              <View style={[styles.fieldGroup, { zIndex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: headerColor }]}>Role</Text>
                <View style={styles.planContainer}>{renderAccountPlans()}</View>
              </View>
            </View>

            {/* Delete Account Section */}
            <View style={[styles.dangerSection, { backgroundColor: accountInputBackground }]}>
              <View style={styles.dangerHeader}>
                <Text style={[styles.dangerTitle, { color: textColor }]}>Deactivate account</Text>
                <TouchableOpacity
                  style={[
                    styles.deactivateButton,
                    {
                      backgroundColor: confirmDeactivation ? "#EF4444" : inputBackground,
                      borderColor: "rgba(0, 0, 0, 0.2)",
                    },
                  ]}
                  onPress={handleDeleteAccount}
                  disabled={!confirmDeactivation}
                >
                  <Text style={[styles.deactivateButtonText, { color: confirmDeactivation ? "#fff" : textColor }]}>
                    Deactivate Account
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.warningContainer, { backgroundColor: inputBackground }]}>
                <View style={styles.warningIcon}>
                  <Warning width={24} height={24} fill={mutedText} />
                </View>
                <View style={styles.warningTextContainer}>
                  <Text style={[styles.warningTitle, { color: textColor }]}>You Are Deactivating Your Account</Text>
                  <Text style={[styles.warningDescription, { color: mutedText }]}>
                    Please note that deactivating your account will remove your access to all features and data
                    associated with this account.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setConfirmDeactivation(!confirmDeactivation)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: mutedText,
                      backgroundColor: confirmDeactivation ? mutedText : "transparent",
                    },
                  ]}
                >
                  {confirmDeactivation && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, { color: textColor }]}>I confirm my account deactivation</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

// Keeping the same styles as original
const styles = StyleSheet.create({
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
  closeButton: {
    padding: 4,
  },
  modalSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
  },
  modalSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12, 
    marginBottom: 8,
  },
  modalInput: {
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 25,
    borderWidth: 0.5,
  },
  cancelButtonText: {
    fontSize: 12,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 25,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dangerSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 20,
    borderWidth: 0,
  },
  dangerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  deactivateButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 0.5,
  },
  deactivateButtonText: {
    fontSize: 12,
  },
  warningContainer: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningIconText: {
    fontSize: 16,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  warningDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  learnMoreLink: {
    color: "#3B82F6",
    textDecorationLine: "underline",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 3,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
  },
})