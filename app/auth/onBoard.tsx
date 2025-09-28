import { handleContinueToSupabase } from "@/api/auth/login"
import { getAllTeams, supabase } from "@/api/dashboardInfo"
import type { TeamInfo } from "@/api/types"
import Eyes from "@/assets/icons/eyes.svg"
import Target from "@/assets/icons/target.svg"
import Users from "@/assets/icons/users.svg"
import AuthWrapper from "@/components/auth/authWrapper"
import { useDarkMode } from "@/context/DarkModeContext"
import { router, useLocalSearchParams } from "expo-router"
import { useEffect, useState } from "react"
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

interface UserOnboardProps {
  onContinue?: (data: OnboardingData) => void
  onPrevious?: () => void
}

interface OnboardingData {
  teamSize: string
  teamAccountNumber: string
  accountPlan: string
}

export default function UserOnboard({ onContinue, onPrevious }: UserOnboardProps) {
  const { isDarkMode } = useDarkMode()
  const textColor = isDarkMode ? "#F9FAFB" : "#111827"
  const mutedText = isDarkMode ? "#9CA3AF" : "rgba(0, 0, 0, 0.2)"
  const backgroundColor = isDarkMode ? "rgba(42, 42, 42, 1)" : "#FFFFFF"
  const inputBackground = isDarkMode ? "rgba(0, 0, 0, 0.1)" : "#fff"
  const accountInputBackground = isDarkMode ? "rgba(0, 0, 0, 0.1)" : "rgba(249, 249, 250, 1)"
  const accountInputBorder = isDarkMode ? "rgba(42, 42, 42, 1)" : "rgba(249, 249, 250, 1)"
  const inputTextColor = isDarkMode ? "#fff" : "#000"
  const dropdownBackground = isDarkMode ? "rgba(42, 42, 42, 1)" : "#fff"
  const dropdownBorder = isDarkMode ? "rgba(75, 85, 99, 1)" : "#e5e7eb"

  const [teamAccountNumber, setTeamAccountNumber] = useState<string>("")
  const [accountPlan, setAccountPlan] = useState<string>("Player")
  const [query, setQuery] = useState("")
  const [allTeams, setAllTeams] = useState<TeamInfo[]>([])
  const [filteredTeams, setFilteredTeams] = useState<TeamInfo[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamInfo | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [displayName, setDisplayName] = useState<string>("")

  const params = useLocalSearchParams()
  const email = params?.email as string
  const password = (params?.password as string) || null
  const isContinueDisabled = displayName.trim() === ""

  useEffect(() => {
    const fetchTeams = async () => {
      const teams = await getAllTeams(2025)
      if (teams) setAllTeams(teams)
    }
    fetchTeams()
  }, [])

  useEffect(() => {
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
  }, [query, allTeams, inputFocused])

  const accountPlans = [
    {
      id: "Player",
      title: "Team Member",
      description: "Join as a player to contribute and collaborate with your team.",
      icon: <Users fill={isDarkMode ? "#fff" : "#000"} />,
    },
    {
      id: "Spectator",
      title: "Spectator Account",
      description: "View team activity and updates without direct participation.",
      icon: <Eyes fill={isDarkMode ? "#fff" : "#000"} />,
    },
    {
      id: "Coach",
      title: "Team Coach",
      description: "Guide and support your team with coaching tools and insights.",
      icon: <Target fill={isDarkMode ? "#fff" : "#000"} />,
    },
  ]

  const handleContinue = async () => {
    if (!email) {
      console.error("No email found in params.");
      return;
    }

    if (!password) {
      // OAuth user — update profile only
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !sessionData?.user) {
        console.error("OAuth user not found in session");
        return;
      }

      const user = sessionData.user;

      const teamData = {
        id: user.id,
        currentTeam: selectedTeam?.teamNumber?.toString() || query,
        accountType: accountPlan,
      };

      const { error: insertError } = await supabase.from("user_teams").upsert(teamData);

      if (insertError) {
        console.error("Error saving onboarding info:", insertError);
        return;
      }

      // Optionally update user_metadata with displayName
      await supabase.auth.updateUser({
        data: {
          displayName: displayName.trim(),
        },
      });

      router.replace("/");
      return;
    }

    // If password exists (email sign-up flow)
    const result = await handleContinueToSupabase({
      email,
      password,
      selectedTeam: selectedTeam?.teamNumber?.toString() || query,
      accountPlan,
      displayName,
    });

    if (!result.success) {
      console.error(result.error);
      return;
    }

    router.push({
      pathname: "/auth/signin",
      params: {
        verify: "1",
      },
    });
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious()
    } else {
      router.back()
    }
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

  return (
    <AuthWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Account Info</Text>
          <Text style={[styles.subtitle, { color: mutedText }]}>
            If you need more info, please check out{" "}
            <TouchableOpacity onPress={() => router.push("/tac")}>
              <Text style={styles.link}>Help Page</Text>
            </TouchableOpacity>
            .
          </Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Display Name</Text>
            <TextInput
                placeholder="Enter display name"
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
            </View>

          <View style={[styles.section, { zIndex: showDropdown ? 1000 : 1 }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Affiliated Team Number</Text>
            <Text style={[styles.helperText, { color: mutedText }]}>Enter 'none' for no team affiliation.</Text>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Search team number or name"
                placeholderTextColor={mutedText}
                value={query}
                onChangeText={setQuery}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
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
                        <Text style={[styles.dropdownItemText, { color: inputTextColor }]}>
                          No Teams Found
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.section, { zIndex: 1 }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Select Account Plan</Text>
            <View style={styles.planContainer}>
              {accountPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planOption,
                    {
                      backgroundColor: accountInputBackground,
                      borderColor: accountPlan === plan.id ? textColor : accountInputBorder,
                    },
                  ]}
                  onPress={() => setAccountPlan(plan.id)}
                >
                  <View style={styles.planContent}>
                    <Text style={styles.planIcon}>{plan.icon}</Text>
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
              ))}
            </View>
          </View>

          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={[styles.previousButton, { backgroundColor: inputBackground, borderColor: "rgba(0, 0, 0, 0.2)" }]}
              onPress={handlePrevious}
            >
              <Text style={[styles.previousButtonText, { color: textColor }]}>← Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.continueButton,
                {
                  backgroundColor: "#000",
                  opacity: isContinueDisabled ? 0.5 : 1,
                },
              ]}
              onPress={handleContinue}
              disabled={isContinueDisabled}
            >
              <Text style={styles.continueButtonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AuthWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 550,
    minHeight: "100%",
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 24,
    padding: 80,
    paddingVertical: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
  },
  link: {
    color: "#3B82F6",
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
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: "italic",
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
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  previousButton: {
    flex: 1,
    borderWidth: 0.5,
    borderRadius: 16,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  previousButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  continueButton: {
    flex: 1,
    borderRadius: 16,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
})