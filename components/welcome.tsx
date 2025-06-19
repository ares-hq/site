import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Pressable, Linking, Image, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { Feather } from "@expo/vector-icons"

export default function LandingPage() {
  const router = useRouter()

  // Mock statistics data - replace with actual API calls
  const [stats, setStats] = useState({
    totalTeams: 1247,
    averageOPR: 85.3,
    matchesPlayed: 15420,
    growth: {
      teams: 12.5,
      opr: 3.2,
      matches: 18.7,
    },
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setLoading(false)
        }, 1000)
      } catch (err) {
        console.error("Error fetching stats", err)
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  type StatCardProps = {
    title: string
    value: string | number
    change: number
    positive: boolean
    color: "blue" | "indigo" | "green" | "purple"
    icon: string
  }

  const StatCard = ({ title, value, change, positive, color, icon }: StatCardProps) => {
    const colorStyles = {
      blue: { backgroundColor: "#EBF4FF", borderColor: "#BFDBFE" },
      indigo: { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" },
      green: { backgroundColor: "#ECFDF5", borderColor: "#BBF7D0" },
      purple: { backgroundColor: "#FAF5FF", borderColor: "#DDD6FE" },
    }

    const textColor = positive ? "#059669" : "#DC2626"

    return (
      <View style={[styles.statCard, colorStyles[color], { borderWidth: 1 }]}>
        <View style={styles.statHeader}>
          <View style={styles.statTitleRow}>
            <Feather name={icon as any} size={18} color="#6B7280" />
            <Text style={styles.statTitle}>{title}</Text>
          </View>
          <View style={[styles.changeBadge, { backgroundColor: positive ? "#DCFCE7" : "#FEE2E2" }]}>
            <Feather name={positive ? "trending-up" : "trending-down"} size={12} color={textColor} />
            <Text style={[styles.changeText, { color: textColor }]}>
              {positive ? "+" : ""}
              {change}%
            </Text>
          </View>
        </View>
        <Text style={styles.statValue}>{typeof value === "number" ? value.toLocaleString() : value}</Text>
      </View>
    )
  }

  const FeatureCard = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Feather name={icon as any} size={24} color="#3B82F6" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  )

  const openLink = (url: string) => {
    Linking.openURL(url)
  }

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.leftSection}>
            <View style={styles.brandRow}>
              <View style={styles.logoContainer}>
                <Image source={require("@/assets/images/ARES-Logo-Green.png")} style={styles.logo} />
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>FTC Scouting Intelligence Platform</Text>
              </View>
            </View>

            <View style={styles.heroText}>
              <Text style={styles.title}>
                Welcome to <Text style={styles.titleAccent}>ARES</Text>
              </Text>
              <Text style={styles.subtitle}>
                Scouting Intelligence. Simplified. Transform your robotics competition strategy with powerful analytics
                and real-time insights.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable style={styles.primaryBtn} onPress={() => router.push("/dashboards/intothedeep")}>
                <Feather name="download" size={18} color="#FFFFFF" />
                <Text style={styles.primaryText}>Join TestFlight</Text>
              </Pressable>

              <Pressable style={styles.secondaryBtn} onPress={() => openLink("https://discord.gg/YOUR_INVITE")}>
                <Text style={styles.secondaryText}>Add to Discord</Text>
                <Feather name="external-link" size={16} color="#374151" />
              </Pressable>
            </View>

            {/* <View style={styles.socialProof}>
              <View style={styles.avatarGroup}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.avatar, { marginLeft: i > 1 ? -8 : 0 }]} />
                ))}
              </View>
              <Text style={styles.socialProofText}>
                <Text style={styles.socialProofNumber}>1,200+</Text> teams already using ARES
              </Text>
            </View> */}
          </View>

          <View style={styles.rightSection}>
            <View style={styles.heroImageContainer}>
              <Image source={{ uri: "/placeholder.svg?height=400&width=500" }} style={styles.heroImage} />
              <View style={styles.floatingCard}>
                <View style={styles.liveIndicator} />
                <Text style={styles.floatingCardText}>Live Data Sync</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Statistics Section */}
      <View style={styles.statsSection}>
        <View style={styles.sectionContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Platform Statistics</Text>
            <Text style={styles.sectionSubtitle}>
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
            <FeatureCard icon="award" title="Competition Ready" description="Optimized for FTC and FRC competitions" />
            <FeatureCard
              icon="trending-up"
              title="Predictive Insights"
              description="AI-powered match outcome predictions"
            />
          </View>

          <Text style={styles.teamSearch}>Team Search</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 60,
    backgroundColor: "linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)",
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
    backgroundColor: "#ECFDF5",
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
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  heroText: {
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    lineHeight: 56,
  },
  titleAccent: {
    color: "#3B82F6",
  },
  subtitle: {
    fontSize: 20,
    color: "#6B7280",
    lineHeight: 28,
    fontWeight: "400",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#3B82F6",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryText: {
    color: "#374151",
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
    color: "#6B7280",
  },
  socialProofNumber: {
    fontWeight: "600",
    color: "#111827",
  },
  rightSection: {
    flex: 1,
    alignItems: "center",
  },
  heroImageContainer: {
    position: "relative",
    backgroundColor: "linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%)",
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
    backgroundColor: "#FFFFFF",
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
    color: "#111827",
  },
  statsSection: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 80,
  },
  sectionContent: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 20,
  },
  teamSearch: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111827",
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
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 18,
    color: "#6B7280",
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
    color: "#6B7280",
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
    color: "#111827",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  featureCard: {
    flex: 1,
    minWidth: 250,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
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
