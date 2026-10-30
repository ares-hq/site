import { getAllTeams, getAverageOPRs, getTeamMatchCount } from "@/api/dashboardInfo"
import { DEFAULT_SEASON } from "@/api/utils/seasons"
import { TeamInfo } from "@/api/utils/types"
import { Reveal, webTransition } from "@/components/shared/motion"
import { StatCard } from "@/components/shared/StatCard"
import { Feather } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import DataTable from "./graphs/teamTables"

const boxShadowStyle = {
  boxShadow: Platform.OS === "web" ? "0px 4px 12px rgba(0, 0, 0, 0.1)" : undefined,
  elevation: Platform.OS !== "web" ? 4 : 0,
}

const TESTFLIGHT_URL = "https://testflight.apple.com/join/FYFDhmcA"
const DISCORD_URL = "https://discord.com/oauth2/authorize?client_id=1327489137238081566"

export default function LandingPage({ darkMode = false }: { darkMode?: boolean }) {
  const { width } = useWindowDimensions()

  const isNarrow = width < 900
  const isMobile = width < 640

  const [stats, setStats] = useState({ totalTeams: 0, averageOPR: 0, matchesPlayed: 0 })
  const [teams, setTeams] = useState<TeamInfo[]>([])
  const [tableLoading, setTableLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [teamList, avg, matches] = await Promise.all([
          getAllTeams(DEFAULT_SEASON),
          getAverageOPRs(DEFAULT_SEASON),
          getTeamMatchCount(DEFAULT_SEASON),
        ])
        if (cancelled) return
        setTeams(teamList ?? [])
        setStats({
          totalTeams: teamList ? teamList.length : 0,
          averageOPR: Number(avg?.overallOPR ?? 0),
          matchesPlayed: matches ?? 0,
        })
      } finally {
        if (!cancelled) setTableLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const theme = getThemedStyles(darkMode)

  const openLink = (url: string) => Linking.openURL(url)

  const titleSize = isMobile ? 34 : isNarrow ? 40 : 50
  const titleLine = isMobile ? 42 : isNarrow ? 48 : 58

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ---------------- Hero ---------------- */}
      <LinearGradient
        colors={
          darkMode
            ? ["#2E2E2E", "#282828"]
            : ["#F6F7F9", "#FFFFFF"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.heroSection, { borderColor: theme.border, borderWidth: 1 }]}
      >

        <View
          style={[
            styles.heroContent,
            { flexDirection: isNarrow ? "column" : "row", gap: isNarrow ? 40 : 60 },
          ]}
        >
          <View style={[styles.leftSection, { maxWidth: isNarrow ? 640 : 600 }]}>
            <View style={styles.brandRow}>
              <View style={[styles.logoContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <Image
                  source={require("@/assets/images/ARES-Logo-Green.png")}
                  style={[styles.logo, { tintColor: darkMode ? "#3B82F6" : "#2563EB" } as any]}
                  resizeMode="contain"
                />
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: darkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={[styles.badgeDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                  FTC Scouting Intelligence Platform
                </Text>
              </View>
            </View>

            <View style={styles.heroText}>
              <Text
                style={[
                  styles.title,
                  { color: theme.textPrimary, fontSize: titleSize, lineHeight: titleLine },
                ]}
              >
                Welcome to{" "}
                <Text style={{ color: theme.accent }}>ARES</Text>
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Scouting intelligence, simplified. Transform your robotics competition
                strategy with powerful analytics and real&#8209;time insights.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <HoverButton
                onPress={() => openLink(TESTFLIGHT_URL)}
                label="Join the ARES TestFlight beta"
                style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                lift
              >
                <Feather name="download" size={18} color="#FFFFFF" />
                <Text style={styles.primaryText}>Join TestFlight</Text>
              </HoverButton>

              <HoverButton
                onPress={() => openLink(DISCORD_URL)}
                label="Add the ARES bot to Discord"
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: theme.cardBackground, borderColor: theme.border },
                ]}
                hoverStyle={{ borderColor: theme.accent }}
                lift
              >
                <Text style={[styles.secondaryText, { color: theme.textPrimary }]}>
                  Add to Discord
                </Text>
                <Feather name="external-link" size={16} color={theme.textSecondary} />
              </HoverButton>
            </View>

            <View style={styles.socialProof}>
              {[
                { icon: "zap", label: "Real-time match sync" },
                { icon: "database", label: "7 FTC seasons of data" },
                { icon: "gift", label: "Free for every team" },
              ].map((chip) => (
                <View
                  key={chip.label}
                  style={[styles.proofChip, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
                >
                  <Feather name={chip.icon as any} size={13} color={theme.accent} />
                  <Text style={[styles.proofChipText, { color: theme.textSecondary }]}>{chip.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ---- Product preview ---- */}
          <View
            style={[
              styles.rightSection,
              { width: isNarrow ? "100%" : undefined, maxWidth: isNarrow ? 420 : 380 },
            ]}
          >
            <HeroPreview theme={theme} darkMode={darkMode} />
          </View>
        </View>
      </LinearGradient>

      {/* ---------------- Stats + features ---------------- */}
      <View
        style={[
          styles.statsSection,
          { backgroundColor: theme.background },
        ]}
      >
        <View style={styles.sectionContent}>
          <Reveal style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Platform Statistics
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Real&#8209;time insights from competitions worldwide. See how ARES is
              transforming robotics scouting.
            </Text>
          </Reveal>

          <View style={styles.statsGrid}>
            <Reveal delay={0} style={styles.statCol}>
              <StatCard title="Total Teams" value={stats.totalTeams} icon="users" tone="blue" />
            </Reveal>
            <Reveal delay={80} style={styles.statCol}>
              <StatCard title="Average OPR" value={stats.averageOPR} decimals={2} icon="target" tone="indigo" />
            </Reveal>
            <Reveal delay={160} style={styles.statCol}>
              <StatCard title="Matches Played" value={stats.matchesPlayed} icon="award" tone="green" />
            </Reveal>
          </View>

          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70} style={styles.featureCol}>
                <FeatureCard {...f} theme={theme} darkMode={darkMode} />
              </Reveal>
            ))}
          </View>

          {/* ---------------- CTA band ---------------- */}
          <Reveal>
            <LinearGradient
              colors={[theme.accent, theme.accentHover]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaSection}
            >
              <View style={styles.ctaContent}>
                <Text style={styles.ctaTitle}>Ready to out&#8209;scout the competition?</Text>
                <Text style={styles.ctaSubtitle}>
                  Join the teams already using ARES to turn raw match data into a
                  winning alliance strategy.
                </Text>
                <View
                  style={[styles.ctaButtons, { flexDirection: isMobile ? "column" : "row" }]}
                >
                  <HoverButton
                    onPress={() => openLink(TESTFLIGHT_URL)}
                label="Join the ARES TestFlight beta"
                    style={styles.ctaPrimaryBtn}
                    lift
                  >
                    <Feather name="download" size={18} color={theme.accent} />
                    <Text style={[styles.ctaPrimaryText, { color: theme.accent }]}>
                      Join TestFlight
                    </Text>
                  </HoverButton>
                  <HoverButton
                    onPress={() => openLink(DISCORD_URL)}
                label="Add the ARES bot to Discord"
                    style={styles.ctaSecondaryBtn}
                    hoverStyle={{ borderColor: "rgba(255,255,255,0.9)" }}
                    lift
                  >
                    <Text style={styles.ctaSecondaryText}>Add to Discord</Text>
                    <Feather name="external-link" size={16} color="#FFFFFF" />
                  </HoverButton>
                </View>
              </View>
            </LinearGradient>
          </Reveal>

          {/* ---------------- Team search ---------------- */}
          <Reveal>
            <Text style={[styles.teamSearch, { color: theme.textPrimary }]}>Team Search</Text>
            {tableLoading ? (
              <View style={styles.tableLoading}>
                <ActivityIndicator size="large" color={theme.textSecondary} />
                <Text style={[styles.tableLoadingText, { color: theme.textSecondary }]}>
                  Loading teams…
                </Text>
              </View>
            ) : (
              <DataTable teams={teams} data="overall" />
            )}
          </Reveal>
        </View>
      </View>
    </View>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

type Theme = ReturnType<typeof getThemedStyles>

const FEATURES = [
  {
    icon: "activity",
    title: "Real-time Analytics",
    description: "Live match data and performance metrics as they happen.",
  },
  {
    icon: "users",
    title: "Team Collaboration",
    description: "Share insights across your entire scouting team.",
  },
  {
    icon: "award",
    title: "Competition Ready",
    description: "Purpose-built and optimized for FTC events.",
  },
  {
    icon: "trending-up",
    title: "Predictive Insights",
    description: "AI-powered match outcome predictions.",
  },
] as const

function HoverButton({
  children,
  onPress,
  style,
  hoverStyle,
  lift = false,
  label,
}: {
  children: React.ReactNode
  onPress?: () => void
  style?: any
  hoverStyle?: any
  lift?: boolean
  label?: string
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        style,
        webTransition("transform, border-color"),
        hovered && hoverStyle,
        hovered && lift && {
          transform: [{ translateY: -2 }],
          boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.16)",
        },
      ]}
    >
      {children}
    </Pressable>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  theme,
  darkMode,
}: {
  icon: string
  title: string
  description: string
  theme: Theme
  darkMode: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.featureCard,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
        webTransition(),
        hovered && {
          transform: [{ translateY: -6 }],
          borderColor: theme.accent,
          boxShadow: "0px 16px 32px rgba(0, 0, 0, 0.12)",
        },
      ]}
    >
      <View
        style={[
          styles.featureIcon,
          { backgroundColor: darkMode ? "rgba(255,255,255,0.06)" : "#F1F3F6", borderColor: theme.border, borderWidth: 1 },
          webTransition(),
          hovered && { borderColor: theme.accent, transform: [{ scale: 1.05 }] },
        ]}
      >
        <Feather name={icon as any} size={22} color={hovered ? theme.accent : theme.textSecondary} />
      </View>
      <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
        {description}
      </Text>
    </Pressable>
  )
}

/** Faux analytics panel used as the hero visual. */
function HeroPreview({ theme, darkMode }: { theme: Theme; darkMode: boolean }) {
  const bars = [42, 58, 47, 71, 63, 88, 76]
  // Opaque — this panel and the floating card overhang the hero gradient.
  const panelBg = darkMode ? "#303030" : "#FFFFFF"
  const trackBg = darkMode ? "rgba(255,255,255,0.10)" : "#EEF2F7"

  return (
    <View style={styles.previewOuter}>
      <View
        style={[
          styles.previewPanel,
          { backgroundColor: panelBg, borderColor: theme.border },
        ]}
      >
        <View style={styles.previewHeader}>
          <View style={styles.previewLiveRow}>
            <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.previewLiveText, { color: theme.textSecondary }]}>
              Live scouting feed
            </Text>
          </View>
          <Text style={[styles.previewTag, { color: theme.textTertiary }]}>CANOPY · {DEFAULT_SEASON}</Text>
        </View>

        <View style={styles.previewTeamRow}>
          <Text style={[styles.previewTeam, { color: theme.textPrimary }]}>Team 14584</Text>
          <View style={[styles.previewPill, { backgroundColor: theme.statCards.blue.background, borderColor: theme.statCards.blue.border }]}>
            <Text style={[styles.previewPillText, { color: theme.accent }]}>OPR 182.4</Text>
          </View>
        </View>

        <View style={styles.previewChart}>
          {bars.map((h, i) => (
            <View
              key={i}
              style={[
                styles.previewBar,
                {
                  height: `${h}%`,
                  backgroundColor: i === bars.length - 2 ? theme.accent : theme.statCards.blue.border,
                },
              ]}
            />
          ))}
        </View>

        <MiniStat label="Win rate" value="78%" pct={0.78} theme={theme} trackBg={trackBg} />
        <MiniStat label="Auto avg" value="41.2" pct={0.62} theme={theme} trackBg={trackBg} />
      </View>

      <View
        style={[
          styles.floatingCard,
          { backgroundColor: panelBg, borderColor: theme.border },
        ]}
      >
        <Feather name="trending-up" size={16} color={theme.success} />
        <Text style={[styles.floatingCardText, { color: theme.textPrimary }]}>
          +12% this week
        </Text>
      </View>
    </View>
  )
}

function MiniStat({
  label,
  value,
  pct,
  theme,
  trackBg,
}: {
  label: string
  value: string
  pct: number
  theme: Theme
  trackBg: string
}) {
  return (
    <View style={styles.miniStat}>
      <View style={styles.miniStatRow}>
        <Text style={[styles.miniStatLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.miniStatValue, { color: theme.textPrimary }]}>{value}</Text>
      </View>
      <View style={[styles.miniTrack, { backgroundColor: trackBg }]}>
        <View
          style={[styles.miniFill, { width: `${pct * 100}%`, backgroundColor: theme.accent }]}
        />
      </View>
    </View>
  )
}

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

function getThemedStyles(darkMode: boolean) {
  const neutralCard = {
    background: darkMode ? "rgba(255,255,255,0.045)" : "#FFFFFF",
    border: darkMode ? "#414141" : "#E2E5EA",
  }
  return {
    background: darkMode ? "rgba(42, 42, 42, 1)" : "#FFFFFF",
    textPrimary: darkMode ? "#F3F4F6" : "#0F1729",
    textSecondary: darkMode ? "#A2A8B2" : "#5B6472",
    textTertiary: darkMode ? "#6B7280" : "#8A94A3",
    border: darkMode ? "#414141" : "#E2E5EA",
    cardBackground: darkMode ? "rgba(255,255,255,0.045)" : "#FFFFFF",
    cardBackgroundHover: darkMode ? "rgba(255,255,255,0.08)" : "#F3F4F6",
    accent: darkMode ? "#3B82F6" : "#2563EB",
    accentHover: darkMode ? "#60A5FA" : "#1D4ED8",
    success: darkMode ? "#10B981" : "#047857",
    statCards: {
      blue: neutralCard,
      indigo: neutralCard,
      green: neutralCard,
      purple: neutralCard,
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1 },

  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 56,
    borderRadius: 24,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 1px 2px rgba(15, 23, 42, 0.04), 0px 18px 48px rgba(15, 23, 42, 0.06)" } as any)
      : { elevation: 3 }),
  },
  glow: {
    position: "absolute",
    top: -140,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 360,
    ...(Platform.OS === "web" ? ({ filter: "blur(90px)" } as any) : {}),
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  leftSection: { flex: 1 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    ...boxShadowStyle,
  },
  logo: { width: 34, height: 34, borderRadius: 9 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: "500" },
  heroText: { marginBottom: 28 },
  title: { fontWeight: "700", marginBottom: 16, letterSpacing: -0.5 },
  subtitle: { fontSize: 19, lineHeight: 28, fontWeight: "400", maxWidth: 520 },

  buttonContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 14,
    marginBottom: 22,
  },
  primaryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...boxShadowStyle,
  },
  primaryText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryText: { fontWeight: "500", fontSize: 16 },
  socialProof: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  proofChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  proofChipText: { fontSize: 13, fontWeight: "500" },

  rightSection: { alignItems: "center", justifyContent: "center" },

  /* hero preview */
  previewOuter: { width: "100%", maxWidth: 360, position: "relative" },
  previewPanel: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 24px 60px rgba(15, 23, 42, 0.18)" } as any)
      : { elevation: 10 }),
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewLiveRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  previewLiveText: { fontSize: 13, fontWeight: "500" },
  previewTag: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  previewTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  previewTeam: { fontSize: 18, fontWeight: "700", flexShrink: 1 },
  previewPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  previewPillText: { fontSize: 12, fontWeight: "700" },
  previewChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 96,
    paddingVertical: 4,
  },
  previewBar: { flex: 1, borderRadius: 5, minHeight: 8 },
  miniStat: { gap: 6 },
  miniStatRow: { flexDirection: "row", justifyContent: "space-between" },
  miniStatLabel: { fontSize: 13, fontWeight: "500" },
  miniStatValue: { fontSize: 13, fontWeight: "700" },
  miniTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  miniFill: { height: 6, borderRadius: 3 },
  floatingCard: {
    position: "absolute",
    bottom: -16,
    left: -14,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 12px 28px rgba(15, 23, 42, 0.16)" } as any)
      : { elevation: 8 }),
  },
  floatingCardText: { fontSize: 13, fontWeight: "600" },

  /* stats + features */
  statsSection: { paddingTop: 40, marginTop: 40 },
  sectionContent: { maxWidth: 1200, width: "100%", alignSelf: "center" },
  sectionHeader: { alignItems: "center", marginBottom: 44 },
  sectionTitle: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 14,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 17,
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 26,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 44,
    flexWrap: "wrap",
  },
  statCol: { flex: 1, minWidth: 260 },
  statCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    gap: 14,
  },
  statTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statTitle: { fontSize: 14, fontWeight: "500" },
  statValue: { fontSize: 32, fontWeight: "700", letterSpacing: -0.5 },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 56,
  },
  featureCol: { flex: 1, minWidth: 230 },
  featureCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    height: "100%",
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  /* cta */
  ctaSection: { borderRadius: 24, paddingVertical: 56, paddingHorizontal: 24, marginBottom: 48 },
  ctaContent: { maxWidth: 720, width: "100%", alignSelf: "center", alignItems: "center" },
  ctaTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 14,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 27,
  },
  ctaButtons: { gap: 14, alignItems: "center" },
  ctaPrimaryBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaPrimaryText: { fontWeight: "600", fontSize: 16 },
  ctaSecondaryBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaSecondaryText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },

  /* team search */
  teamSearch: {
    fontSize: 32,
    fontWeight: "700",
    marginVertical: 28,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  tableLoading: { paddingVertical: 60, alignItems: "center", gap: 12 },
  tableLoadingText: { fontSize: 15, fontWeight: "500" },
})
