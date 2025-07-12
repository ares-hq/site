import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native"
import { router } from "expo-router"

// Icons
import Users from "@/assets/icons/users.svg"
import Eyes from "@/assets/icons/eyes.svg"
import Cancel from "@/assets/icons/x-circle.svg"
import Target from "@/assets/icons/target.svg"
import Warning from "@/assets/icons/warning.svg"

// API
import { getAllTeams, supabase, updateUserProfile } from "@/api/dashboardInfo"
import { TeamInfo } from "@/api/types"

// Types
import { UserProfile } from "./useUserProfile"

type Props = {
  visible: boolean
  onClose: () => void
  userProfile: UserProfile | null
  isDarkMode: boolean
  profileCache: { userProfile: UserProfile | null }
  userId?: string // Add userId since it's not in UserProfile
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

export default function ProfileSettingsModal({ visible, onClose, userProfile, isDarkMode, profileCache, userId }: Props) {
  const [modalAnimation] = useState(new Animated.Value(0))
  const [accountPlan, setAccountPlan] = useState<string>("Player")
  const [query, setQuery] = useState("")
  const [allTeams, setAllTeams] = useState<TeamInfo[]>([])
  const [filteredTeams, setFilteredTeams] = useState<TeamInfo[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [confirmDeactivation, setConfirmDeactivation] = useState(false)
  const [displayName, setDisplayName] = useState(userProfile?.display_name || "")
  const [initialDisplayName, setInitialDisplayName] = useState("")
  const [initialTeamNumber, setInitialTeamNumber] = useState<number | null>(null)
  const [initialAccountPlan, setInitialAccountPlan] = useState("")

  // Theme colors
  const colors = {
    mutedText: isDarkMode ? "#9CA3AF" : "rgba(0, 0, 0, 0.2)",
    // accountInputBackground: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "rgba(249, 249, 250, 1)",
    accountInputBackground: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "#fff",
    accountInputBorder: isDarkMode ? "rgba(42, 42, 42, 1)" : "rgba(249, 249, 250, 1)",
    inputTextColor: isDarkMode ? "#fff" : "#000",
    dropdownBackground: isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff",
    dropdownBorder: isDarkMode ? "rgba(75, 85, 99, 1)" : "#e5e7eb",
    backgroundColor: isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff",
    textColor: isDarkMode ? "#fff" : "#000",
    headerColor: isDarkMode ? "#9CA3AF" : "#6B7280",
    inputBackground: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "#F9FAFB",
    sectionBackground: isDarkMode ? "rgba(55, 65, 81, 0.5)" : "rgba(249, 249, 250, 1)",
  }

    useEffect(() => {
    if (visible) {
        fetchTeams()
        const initialName = userProfile?.display_name || ""
        const initialPlan = userProfile?.team_role || "Player"
        const initialTeam = userProfile?.team_number
        ? parseInt(userProfile.team_number.replace('#', ''))
        : null

        setAccountPlan(initialPlan)
        setInitialDisplayName(initialName)
        setInitialAccountPlan(initialPlan)
        setInitialTeamNumber(initialTeam)

        if (initialTeam !== null) {
        setSelectedTeam({
            teamNumber: initialTeam,
            teamName: userProfile?.team_name || "",
        })
        } else {
        setSelectedTeam(null)
        }

        setQuery("")
        setConfirmDeactivation(false)

        Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        }).start()
    }
    }, [visible, userProfile])


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

  const hasChanges =
  displayName.trim() !== initialDisplayName.trim() ||
  accountPlan !== initialAccountPlan ||
  (selectedTeam?.teamNumber || 0) !== (initialTeamNumber || 0)

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

  const closeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose()
    })
  }

  const handleSave = async () => {
    // if (!userId) {
    //   console.error("No user ID available")
    //   Alert.alert("Error", "User ID not available")
    //   return
    // }
    
    // Basic validation
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty")
      return
    }

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        teamNumber: selectedTeam?.teamNumber || 0,
        accountType: accountPlan,
      })
      
      // Update cache with correct property names
      profileCache.userProfile = {
        ...userProfile,
        display_name: displayName.trim(),
        team_number: selectedTeam?.teamNumber ? `#${selectedTeam.teamNumber}` : undefined,
        team_name: selectedTeam?.teamName || undefined,
        team_role: accountPlan,
      }
      
      closeModal()
    } catch (e) {
      Alert.alert("Failed to update profile", (e as Error).message)
    }
  }

    const handleLogOut = async () => {
    // const confirm = window.confirm("Are you sure you want to log out?")
    // if (!confirm) return

    try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        profileCache.userProfile = null
        router.replace("/auth/signin")
    } catch (error) {
        console.error("Error logging out:", error)
    }
    }

  const handleDeleteAccount = async () => {
    if (!confirmDeactivation) {
      Alert.alert("Error", "Please confirm account deactivation first")
      return
    }

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

  const handleTeamSelect = (team: TeamInfo) => {
    if (team.teamNumber === 0) {
      setQuery("none")
      setSelectedTeam({ teamNumber: 0, teamName: "None" } as TeamInfo)
    } else {
      setQuery(team.teamNumber?.toString() || "")
      setSelectedTeam(team)
    }
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

  const renderTeamDropdown = () => (
    <View style={[styles.section, { zIndex: showDropdown ? 1000 : 1 }]}>
      <Text style={[styles.fieldLabel, { color: colors.headerColor }]}>
        Affiliated Team Number
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Search team number or name"
          placeholderTextColor={colors.mutedText}
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
            //   backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
            backgroundColor: isDarkMode ? "#1F2937" : '#fff',
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
            <Text style={[styles.title, { color: colors.textColor }]}>
                Account Settings
            </Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handleLogOut} style={styles.cancelButton}>
                    <Text style={[styles.cancelButtonText, { color: colors.textColor }]}>
                        Log Out
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeModal}>
                <Cancel width={20} height={20} fill={colors.textColor} />
                </TouchableOpacity>
            </View>
            </View>

            {/* Profile Details Section */}
            <View style={[styles.modalSection, { backgroundColor: colors.sectionBackground }]}>
            <View style={styles.modalSectionHeader}>
                <Text style={[styles.modalSectionTitle, { color: colors.textColor }]}>
                    Profile Details
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {/* <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                    <Text style={[styles.cancelButtonText, { color: colors.textColor }]}>
                        Cancel
                    </Text>
                </TouchableOpacity> */}
                <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveButton, { opacity: hasChanges ? 1 : 0.5 }]}
                disabled={!hasChanges}
                >
                <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
                </View>
            </View>

              <View style={[styles.fieldGroup, { marginBottom: 30 }]}>
                <Text style={[styles.fieldLabel, { color: colors.headerColor }]}>
                  Display Name
                </Text>
                    <TextInput
                    placeholder="Enter Display Name"
                    placeholderTextColor={colors.mutedText}
                    value={displayName}
                    onChangeText={setDisplayName}
                    style={[styles.input, {
                        backgroundColor: colors.inputBackground,
                        color: colors.inputTextColor,
                        borderColor: "rgba(0, 0, 0, 0.2)",
                    }]}
                    />
                    <View style={styles.selectedTeamContainer}>
                        <Text style={[styles.selectedTeamText, { color: colors.textColor }]}>
                            {selectedTeam && selectedTeam.teamNumber !== 0
                            ? `Name: ${userProfile?.display_name}`
                            : "No Name Entered"}
                        </Text>
                    </View>
              </View>
              
              {renderTeamDropdown()}

              <View style={[styles.fieldGroup, { zIndex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.headerColor }]}>
                  Role
                </Text>
                <View style={styles.planContainer}>
                  {renderAccountPlans()}
                </View>
              </View>
            </View>

            {/* Delete Account Section */}
            <View style={[styles.dangerSection, { backgroundColor: colors.sectionBackground }]}>
            <View style={styles.dangerHeader}>
                <Text style={[styles.dangerTitle, { color: colors.textColor }]}>
                Deactivate account
                </Text>
                <TouchableOpacity
                style={[
                    styles.deactivateButton, 
                    { 
                    backgroundColor: confirmDeactivation ? "#EF4444" : '#fff',
                    // opacity: confirmDeactivation ? 1 : 0.5
                    }
                ]}
                onPress={handleDeleteAccount}
                disabled={!confirmDeactivation}
                >
                <Text style={[
                    styles.deactivateButtonText, 
                    { color: confirmDeactivation ? "#fff" : colors.headerColor }
                ]}>
                    Deactivate Account
                </Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.warningContainer}>
                <View style={styles.warningIcon}>
                <Warning width={24} height={24} fill={colors.headerColor} />
                </View>
                <View style={styles.warningTextContainer}>
                <Text style={[styles.warningTitle, { color: colors.textColor }]}>
                    You Are Deactivating Your Account
                </Text>
                <Text style={[styles.warningDescription, { color: colors.headerColor }]}>
                    Please note that deactivating your account will remove your access to all features and data associated with this account.
                    {/* <Text style={styles.learnMoreLink}>Learn more</Text> */}
                </Text>
                </View>
            </View>
            
            <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setConfirmDeactivation(!confirmDeactivation)}
            >
                <View style={[
                styles.checkbox, 
                { 
                    borderColor: colors.headerColor,
                    // backgroundColor: confirmDeactivation ? "#3B82F6" : "transparent"
                    backgroundColor: confirmDeactivation ? colors.headerColor : "transparent",
                }
                ]}>
                {confirmDeactivation && (
                    <Text style={styles.checkmark}>✓</Text>
                )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textColor }]}>
                I confirm my account deactivation
                </Text>
            </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

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
    alignItems: "center",
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
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  cancelButtonText: {
    fontSize: 12,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 25,
    backgroundColor: "#000",
  },
  saveButtonText: {
    fontSize: 12,
    color: "#fff",
  },
  dangerSection: {
  marginHorizontal: 16,
  marginBottom: 24,
  borderRadius: 12,
  padding: 20,
  borderWidth: 0, // Remove the red border
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
},
deactivateButtonText: {
  fontSize: 12,
},
warningContainer: {
  flexDirection: "row",
  backgroundColor: "#fff",
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