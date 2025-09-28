"use client"
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Dimensions, StatusBar } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useDarkMode } from "@/context/DarkModeContext"
import React from "react"

const { width, height } = Dimensions.get("window")

// ——— App feature cards ———
const features = [
  {
    id: "searchTeams",
    title: "Search Teams",
    description: "Look up any FTC team to view profile, season summaries, and event history.",
    usage: "From Home, tap the search bar → enter team number or name → open the team profile.",
    icon: "search",
  },
  {
    id: "teamAnalysts",
    title: "Team Analysts",
    description: "Deep dives: OPR/eOPR trends, consistency metrics, schedule strength, and notes.",
    usage: "On a team page, open the ‘Analysts’ tab to view charts and advanced breakdowns.",
    icon: "trending-up",
  },
  {
    id: "favorites",
    title: "Favorite Teams",
    description: "Pin your team(s) for one-tap access across the app.",
    usage: "Tap the heart on any team profile to toggle it in Favorites.",
    icon: "heart",
  },
  {
    id: "watchlist",
    title: "Teams to Watch",
    description: "Build a watchlist of interesting opponents or partners to monitor through the season.",
    usage: "On a team or search result, tap ‘Watch’ to add/remove from your list.",
    icon: "eye",
  },
  {
    id: "stats",
    title: "General Statistics",
    description: "Browse global and regional leaderboards, averages, and distribution snapshots.",
    usage: "Open ‘Stats’ from the Home screen → filter by season, event, or region.",
    icon: "bar-chart-2",
  },
]

// ——— “How it works” steps ———
const steps = [
  {
    title: "Connect a Team",
    description: "Search your team number to personalize dashboards and quick links.",
    icon: "link-2",
  },
  {
    title: "Search & Filter",
    description: "Use the search bar and filters (region, season) to find the right teams and stats.",
    icon: "filter",
  },
  {
    title: "Pin Favorites",
    description: "Heart your teams to surface them on Home and in the quick picker.",
    icon: "bookmark",
  },
  {
    title: "Monitor Watchlist",
    description: "Add opponents or partners to ‘Teams to Watch’ to track them at a glance.",
    icon: "list",
  },
]

const { width: winW } = Dimensions.get("window")

export default function AppHowToPage() {
  // Opens the TestFlight app (iOS). If unsupported, falls back to the public TestFlight page.
  const openTestFlight = async () => {
    const primary = "https://testflight.apple.com/join/FYFDhmcA"
    const fallback = "https://testflight.apple.com/join/FYFDhmcA"
    try {
      const supported = await Linking.canOpenURL(primary)
      await Linking.openURL(supported ? primary : fallback)
    } catch {
      Linking.openURL(fallback)
    }
  }

  const { isDarkMode: darkMode } = useDarkMode()
  const [gridWidth, setGridWidth] = React.useState(winW)

  // ----- responsive knobs -----
  const isSmallPhone = winW < 375
  const isMobile = winW < 768
  const isTablet = winW >= 768 && winW < 1024

  const spacing = {
    xs: isSmallPhone ? 8 : 12,
    sm: isSmallPhone ? 12 : 16,
    md: isSmallPhone ? 16 : 20,
    lg: isSmallPhone ? 20 : 24,
    xl: isSmallPhone ? 24 : 32,
  }

  // ----- dynamic columns based on container width -----
  const MIN_CARD_WIDTH = 280
  const GUTTER = spacing.xs
  const innerPad = spacing.sm * 2
  const usable = Math.max(0, gridWidth - innerPad)
  const maxColumns = 3
  const columns = Math.max(
    1,
    Math.min(maxColumns, Math.floor((usable + GUTTER) / (MIN_CARD_WIDTH + GUTTER)))
  )
  const cardWidthPx = columns === 1
    ? usable
    : Math.floor((usable - (columns - 1) * GUTTER) / columns)

  const theme = {
    background: darkMode ? "rgba(42, 42, 42, 1)" : "#ffffff",
    cardBackground: darkMode ? "rgb(40, 41, 45)" : "#FFFFFF",
    textPrimary: darkMode ? "#F8FAFC" : "#111827",
    textSecondary: darkMode ? "#CBD5E1" : "#6B7280",
    border: darkMode ? "rgb(51, 53, 58)" : "#E5E7EB",
    accent: "#3B82F6",
    commandBadgeBg: darkMode ? "rgba(59, 130, 246, 0.2)" : "#EBF4FF",
    commandBadgeText: darkMode ? "#3B82F6" : "#2563EB",
    shadow: darkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.1)",
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <View style={[styles.headerContent, isMobile && styles.mobileHeaderContent]}>
            <View style={[styles.headerText, isMobile && styles.mobileHeaderText]}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.textPrimary,
                    fontSize: isSmallPhone ? 20 : isMobile ? 24 : isTablet ? 28 : 32,
                  },
                ]}
              >
                ARES Dashboard App
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.textSecondary,
                    fontSize: isSmallPhone ? 12 : 14,
                  },
                ]}
              >
                Search, analyze, favorite, and track the teams that matter
              </Text>
            </View>

            <Pressable
              style={[
                styles.addButton,
                {
                  backgroundColor: theme.accent,
                  paddingHorizontal: isSmallPhone ? 12 : 16,
                  paddingVertical: isSmallPhone ? 8 : 10,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                },
              ]}
              onPress={openTestFlight}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              <Feather name="external-link" size={isSmallPhone ? 14 : 16} color="white" />
              <Text style={[styles.addButtonText, { fontSize: isSmallPhone ? 12 : 14 }]}>Open in TestFlight</Text>
            </Pressable>
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.content, { paddingHorizontal: spacing.sm }]}>
          {/* Features Section */}
          <View style={[styles.section, { paddingVertical: spacing.md }]}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textPrimary, fontSize: isSmallPhone ? 16 : 18, marginBottom: spacing.sm },
              ]}
            >
              Core Features
            </Text>

            <View
              onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              style={[styles.grid, { gap: GUTTER }]}
            >
              {features.map((f) => (
                <Pressable
                  key={f.id}
                  style={[
                    styles.commandCard,
                    {
                      width: columns === 1 ? "100%" : cardWidthPx,
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                      padding: spacing.sm,
                      shadowColor: theme.shadow,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 2,
                    },
                  ]}
                  android_ripple={{ color: theme.commandBadgeBg }}
                >
                  <View style={[styles.commandHeader, { marginBottom: spacing.xs }]}>
                    <View
                      style={[
                        styles.iconWrapper,
                        {
                          backgroundColor: theme.commandBadgeBg,
                          width: isSmallPhone ? 24 : 28,
                          height: isSmallPhone ? 24 : 28,
                        },
                      ]}
                    >
                      <Feather name={f.icon as any} size={isSmallPhone ? 12 : 16} color={theme.accent} />
                    </View>
                    <Text
                      style={[
                        styles.commandTitle,
                        { color: theme.commandBadgeText, fontSize: isSmallPhone ? 14 : 16 },
                      ]}
                    >
                      {f.title}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.commandDescription,
                      { color: theme.textSecondary, fontSize: isSmallPhone ? 11 : 12, marginBottom: spacing.xs },
                    ]}
                  >
                    {f.description}
                  </Text>

                    <View
                      style={[
                        styles.usageContainer,
                        { borderTopColor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", paddingTop: spacing.xs },
                      ]}
                    >
                      <Text
                        style={[
                          styles.usageLabel,
                          { color: theme.textSecondary, fontSize: isSmallPhone ? 10 : 12, marginBottom: 4 },
                        ]}
                      >
                        TIP
                      </Text>
                      <Text
                        style={[
                          styles.usageText,
                          { color: theme.textPrimary, fontSize: isSmallPhone ? 11 : 13 },
                        ]}
                      >
                        {f.usage}
                      </Text>
                    </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Getting Started Section */}
          <View style={[styles.section, { paddingVertical: spacing.md }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.textPrimary,
                  fontSize: isSmallPhone ? 16 : 18,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              Getting Started
            </Text>
            <View style={[styles.stepsContainer, { gap: spacing.xs }]}>
              {steps.map((step, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.border,
                      padding: spacing.sm,
                      shadowColor: theme.shadow,
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                  ]}
                  android_ripple={{ color: theme.commandBadgeBg }}
                >
                  <View style={[styles.stepHeader, { marginBottom: spacing.xs }]}>
                    <View
                      style={[
                        styles.stepNumber,
                        {
                          backgroundColor: theme.accent,
                          width: isSmallPhone ? 24 : 28,
                          height: isSmallPhone ? 24 : 28,
                          borderRadius: isSmallPhone ? 12 : 14,
                        },
                      ]}
                    >
                      <Text style={[styles.stepNumberText, { fontSize: isSmallPhone ? 12 : 14 }]}>{index + 1}</Text>
                    </View>
                    <Text
                      style={[
                        styles.stepTitle,
                        {
                          color: theme.textPrimary,
                          fontSize: isSmallPhone ? 14 : 16,
                        },
                      ]}
                    >
                      {step.title}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepDescription,
                      {
                        color: theme.textSecondary,
                        fontSize: isSmallPhone ? 11 : 13,
                        paddingLeft: isSmallPhone ? 32 : 38,
                      },
                    ]}
                  >
                    {step.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* FAQ Section */}
          <View style={[styles.section, { paddingBottom: spacing.xs }]}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.textPrimary,
                  fontSize: isSmallPhone ? 16 : 18,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              FAQ
            </Text>
            <View
              style={[
                styles.faqContainer,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                },
              ]}
            >
              {[
                {
                  question: "Is ARES free to use?",
                  answer: "Yes. Core scouting features are free for all teams.",
                },
                {
                  question: "What sources power team stats?",
                  answer: "Official FIRST APIs plus vetted public datasets, aggregated and cached for speed.",
                },
                {
                  question: "How do I manage my Favorites and Watchlist?",
                  answer: "From a team profile, use the heart to Favorite and the eye to Watch/Unwatch.",
                },
                {
                  question: "How do I install TestFlight builds?",
                  answer: "Tap ‘Open in TestFlight’ above. If TestFlight isn’t installed, you’ll be redirected to Apple’s page.",
                },
              ].map((faq, index, array) => (
                <View
                  key={index}
                  style={[
                    styles.faqItem,
                    {
                      borderBottomColor: theme.border,
                      borderBottomWidth: index === array.length - 1 ? 0 : 1,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.faqQuestion,
                      {
                        color: theme.textPrimary,
                        fontSize: isSmallPhone ? 12 : 14,
                        marginBottom: 4,
                      },
                    ]}
                  >
                    {faq.question}
                  </Text>
                  <Text
                    style={[
                      styles.faqAnswer,
                      {
                        color: theme.textSecondary,
                        fontSize: isSmallPhone ? 11 : 13,
                      },
                    ]}
                  >
                    {faq.answer}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { borderBottomWidth: 1 },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mobileHeaderContent: { flexDirection: "column", alignItems: "stretch", gap: 12 },
  headerText: { flex: 1 },
  mobileHeaderText: { flex: 0, alignItems: "center" },
  title: { fontWeight: "800", marginBottom: 4 },
  subtitle: { fontWeight: "400" },
  addButton: { flexDirection: "row", alignItems: "center", borderRadius: 10, gap: 6, minHeight: 44 },
  addButtonText: { color: "white", fontWeight: "600" },
  content: { flex: 1 },
  section: { marginBottom: 8 },
  sectionTitle: { fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap" },

  commandCard: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 140,
  },

  commandHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrapper: { borderRadius: 8, alignItems: "center", justifyContent: "center" },
  commandTitle: { fontWeight: "700", fontFamily: "monospace" },
  commandDescription: { lineHeight: 18, flex: 1 },
  usageContainer: { borderTopWidth: 1 },
  usageLabel: { fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  usageText: { fontFamily: "monospace", lineHeight: 16 },

  stepsContainer: { flexDirection: "column" },
  stepCard: { borderRadius: 16, borderWidth: 1, minHeight: 60 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNumber: { alignItems: "center", justifyContent: "center" },
  stepNumberText: { fontWeight: "bold", color: "#FFFFFF" },
  stepTitle: { fontWeight: "600", flex: 1 },
  stepDescription: { lineHeight: 18 },
  faqContainer: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  faqItem: { minHeight: 60, justifyContent: "center" },
  faqQuestion: { fontWeight: "600" },
  faqAnswer: { lineHeight: 18 },
})