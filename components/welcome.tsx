import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Pressable, Linking, Image, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { Feather } from "@expo/vector-icons"
import { getAllTeams, getAverageOPRs, getTeamMatchCount } from "@/api/dashboardInfo"
import DataTable from "./graphs/teamTables"
import { TeamInfo } from "@/api/types"
import { useDarkMode } from "@/context/DarkModeContext"

export default function LandingPage({ darkMode = false }: { darkMode?: boolean }) {
  const [stats, setStats] = useState({
    totalTeams: 0,
    averageOPR: 0,
    matchesPlayed: 0,
    growth: {
      teams: 0,
      opr: 0,
      matches: 0,
    },
  })

  useEffect(() => {
    const fetchStats = async () => {
      const teams = await getAllTeams()
      const avg = await getAverageOPRs()
      const matches = await getTeamMatchCount()
      const fetchedStats = {
        totalTeams: teams ? teams.length : 0,
        averageOPR: avg.overallOPR.toFixed(2) || 0,
        matchesPlayed: matches,
        growth: {
          teams: 15,
          opr: 5,
          matches: 10,
        },
      }
      setStats(fetchedStats)
    }

    fetchStats()
  }, [])

  const getThemedStyles = (darkMode: boolean) => {
    const theme = {
      background: darkMode ? "rgba(42, 42, 42, 1)" : "#FFFFFF",
      backgroundSecondary: darkMode ? "#1E293B" : "#F9FAFB",
      backgroundTertiary: darkMode ? "#334155" : "#FFFFFF",

      textPrimary: darkMode ? "#F8FAFC" : "#111827",
      textSecondary: darkMode ? "#CBD5E1" : "#6B7280",
      textTertiary: darkMode ? "#94A3B8" : "#9CA3AF",

      border: darkMode ? "#334155" : "#E5E7EB",
      borderLight: darkMode ? "#475569" : "#F3F4F6",

      cardBackground: darkMode ? "#1E293B" : "#FFFFFF",
      cardBackgroundHover: darkMode ? "#334155" : "#F9FAFB",

      accent: "#3B82F6",
      accentHover: darkMode ? "#60A5FA" : "#2563EB",

      success: darkMode ? "#10B981" : "#059669",
      error: darkMode ? "#EF4444" : "#DC2626",

      statCards: {
        blue: {
          background: darkMode ? "#1E3A8A" : "#EBF4FF",
          border: darkMode ? "#3B82F6" : "#BFDBFE",
        },
        indigo: {
          background: darkMode ? "#312E81" : "#EEF2FF",
          border: darkMode ? "#6366F1" : "#C7D2FE",
        },
        green: {
          background: darkMode ? "#14532D" : "#ECFDF5",
          border: darkMode ? "#10B981" : "#BBF7D0",
        },
        purple: {
          background: darkMode ? "#581C87" : "#FAF5FF",
          border: darkMode ? "#A855F7" : "#DDD6FE",
        },
      },
    }
    return theme
  }

  const theme = getThemedStyles(darkMode)

  type StatCardProps = {
    title: string
    value: string | number
    change: number
    positive: boolean
    color: "blue" | "indigo" | "green" | "purple"
    icon: string
  }

  const StatCard = ({ title, value, change, positive, color, icon }: StatCardProps) => {
    const colorStyles = theme.statCards[color]

    return (
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: colorStyles.background,
            borderColor: colorStyles.border,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.statHeader}>
          <View style={styles.statTitleRow}>
            <Feather name={icon as any} size={18} color={theme.textSecondary} />
            <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
          </View>
        </View>
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Text>
      </View>
    )
  }

  const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
    <View
      style={[
        styles.featureCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        },
      ]}
    >
      <View
        style={[
          styles.featureIcon,
          {
            backgroundColor: darkMode ? "#1E3A8A" : "#DBEAFE",
          },
        ]}
      >
        <Feather name={icon as any} size={24} color={theme.accent} />
      </View>
      <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>{description}</Text>
    </View>
  )

  const openLink = (url: string) => {
    Linking.openURL(url)
  }
    
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode } = useDarkMode();

    useEffect(() => {
      const init = async () => {
        const result = await getAllTeams();
        setTeams(result ?? []);
        setLoading(false);
      };
      init();
    }, []);

  if (loading) {
    return (
        <View style={[
          styles.loadingOverlay,
          { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' },
        ]}>
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading...</Text>
        </View>
        </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Hero Section */}
      <View
        style={[
          styles.heroSection,
          {
            backgroundColor: darkMode
              ? "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)"
              : "linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)",
          },
        ]}
      >
        <View style={styles.heroContent}>
          <View style={styles.leftSection}>
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.logoContainer,
                  {
                    backgroundColor: darkMode ? "#14532D" : "#ECFDF5",
                  },
                ]}
              >
                <Image source={require("@/assets/images/ARES-Logo-Green.png")} style={styles.logo} />
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: darkMode ? "#334155" : "#F3F4F6",
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                  FTC Scouting Intelligence Platform
                </Text>
              </View>
            </View>

            <View style={styles.heroText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Welcome to <Text style={[styles.titleAccent, { color: theme.accent }]}>ARES</Text>
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Scouting Intelligence. Simplified. Transform your robotics competition strategy with powerful analytics
                and real-time insights.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: theme.accent,
                    shadowColor: theme.accent,
                  },
                ]}
                onPress={() => openLink("https://testflight.apple.com/join/FYFDhmcA")}
              >
                <Feather name="download" size={18} color="#FFFFFF" />
                <Text style={styles.primaryText}>Join TestFlight</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => openLink("https://discord.com/oauth2/authorize?client_id=1327489137238081566")}
              >
                <Text style={[styles.secondaryText, { color: theme.textPrimary }]}>Add to Discord</Text>
                <Feather name="external-link" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Statistics Section */}
      <View
        style={[
          styles.statsSection,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}
      >
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Platform Statistics</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Real-time insights from competitions worldwide. See how ARES is transforming robotics scouting.
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              title="Total Teams"
              value={stats.totalTeams}
              change={stats.growth.teams}
              positive={true}
              icon="users"
              color="blue"
            />
            <StatCard
              title="Average OPR"
              value={stats.averageOPR}
              change={stats.growth.opr}
              positive={true}
              icon="target"
              color="indigo"
            />
            <StatCard
              title="Matches Played"
              value={stats.matchesPlayed}
              change={stats.growth.matches}
              positive={true}
              icon="award"
              color="green"
            />
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="activity"
              title="Real-time Analytics"
              description="Live match data and performance metrics"
            />
            <FeatureCard
              icon="users"
              title="Team Collaboration"
              description="Share insights across your scouting team"
            />
            <FeatureCard icon="award" title="Competition Ready" description="Optimized for FTC competitions" />
            <FeatureCard
              icon="trending-up"
              title="Predictive Insights"
              description="AI-powered match outcome predictions"
            />
          </View>

          <Text style={[styles.teamSearch, { color: theme.textPrimary }]}>Team Search</Text>
          <DataTable teams={teams} data="overall" />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    gap: 60,
  },
  leftSection: {
    flex: 1,
    maxWidth: 600,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  heroText: {
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 56,
  },
  titleAccent: {
    // Color will be set dynamically
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "400",
  },
  loadingOverlay: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  buttonContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  primaryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryText: {
    fontWeight: "500",
    fontSize: 16,
  },
  socialProof: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarGroup: {
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  socialProofText: {
    fontSize: 14,
  },
  socialProofNumber: {
    fontWeight: "600",
  },
  rightSection: {
    flex: 1,
    alignItems: "center",
  },
  heroImageContainer: {
    position: "relative",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 8,
  },
  heroImage: {
    width: 400,
    height: 300,
    borderRadius: 16,
  },
  floatingCard: {
    position: "absolute",
    bottom: -12,
    left: -12,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  floatingCardText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statsSection: {
    borderTopWidth: 1,
    paddingTop: 50,
  },
  sectionContent: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  teamSearch: {
    fontSize: 36,
    fontWeight: "700",
    marginVertical: 30,
    textAlign: "center",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 18,
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 26,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 48,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 280,
    borderRadius: 16,
    padding: 24,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  featureCard: {
    flex: 1,
    minWidth: 250,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaSection: {
    paddingVertical: 80,
  },
  ctaContent: {
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: 20,
    color: "#BFDBFE",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 28,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 16,
  },
  ctaPrimaryBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaPrimaryText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 16,
  },
  ctaSecondaryBtn: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaSecondaryText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 16,
  },
})
