"use client"
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Dimensions, StatusBar } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useDarkMode } from "@/context/DarkModeContext"
import React from "react"

const { width, height } = Dimensions.get("window")

// Define command data
const commands = [
  {
    id: "team",
    title: "/team",
    description: "Displays team FIRST information",
    usage: "/team <team_number>",
    icon: "users",
  },
  {
    id: "match",
    title: "/match",
    description: "OPR-Based Match Prediction",
    usage: "/match <red_alliance> <blue_alliance>",
    icon: "play",
  },
  {
    id: "favorite",
    title: "/favorite",
    description: "Marks a team as the server favorite. Enter a team a second time to remove them from the list.",
    usage: "/favorite <team_number>",
    icon: "heart",
  },
]

const steps = [
  {
    title: "Add Bot to Server",
    description: "Click 'Add Bot' and authorize for your Discord server",
    icon: "plus-circle",
  },
  {
    title: "Use Commands",
    description: "Type commands in any channel to get FTC data instantly",
    icon: "message-square",
  },
]

const { width: winW } = Dimensions.get("window")

export default function DiscordBotCommandsPage() {
  const openDiscordInvite = () => {
    Linking.openURL("https://discord.com/oauth2/authorize?client_id=1327489137238081566")
  }

  const { isDarkMode: darkMode } = useDarkMode()
  const [gridWidth, setGridWidth] = React.useState(winW)   // measure the actual grid

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
  // cards will *stack* when we can’t fit at least 2 cards of min width + gutter
  const MIN_CARD_WIDTH = 280         // tune this
  const GUTTER = spacing.xs
  const innerPad = spacing.sm * 2    // grid’s horizontal paddings in your layout
  const usable = Math.max(0, gridWidth - innerPad)
  const maxColumns = 3               // cap columns if you ever go wider
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
                ARES Discord Bot
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
                FTC scouting intelligence for Discord
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
              onPress={openDiscordInvite}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              <Feather name="plus" size={isSmallPhone ? 14 : 16} color="white" />
              <Text style={[styles.addButtonText, { fontSize: isSmallPhone ? 12 : 14 }]}>Add Bot</Text>
            </Pressable>
          </View>
        </View>

        {/* Main Content */}
        <View style={[styles.content, { paddingHorizontal: spacing.sm }]}>
          {/* Commands Section */}
          <View style={[styles.section, { paddingVertical: spacing.md }]}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textPrimary, fontSize: isSmallPhone ? 16 : 18, marginBottom: spacing.sm },
              ]}
            >
              Commands
            </Text>

            <View
              onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
              style={[
                styles.grid,
                // always row + wrap; column is simulated by columns===1
                { gap: GUTTER },
              ]}
            >
              {commands.map((command) => (
                <Pressable
                  key={command.id}
                  style={[
                    styles.commandCard,
                    {
                      width: columns === 1 ? "100%" : cardWidthPx,   // <- key: stack when columns===1
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
                  {/* ...card content unchanged... */}
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
                      <Feather name={command.icon as any} size={isSmallPhone ? 12 : 16} color={theme.accent} />
                    </View>
                    <Text
                      style={[
                        styles.commandTitle,
                        { color: theme.commandBadgeText, fontSize: isSmallPhone ? 14 : 16 },
                      ]}
                    >
                      {command.title}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.commandDescription,
                      { color: theme.textSecondary, fontSize: isSmallPhone ? 11 : 12, marginBottom: spacing.xs },
                    ]}
                  >
                    {command.description}
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
                      USAGE
                    </Text>
                    <Text
                      style={[
                        styles.usageText,
                        { color: theme.textPrimary, fontSize: isSmallPhone ? 11 : 13 },
                      ]}
                    >
                      {command.usage}
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
                  question: "Is the ARES Discord Bot free?",
                  answer: "Yes, completely free for all FTC teams!",
                },
                {
                  question: "What data sources does the bot use?",
                  answer: "Official FIRST Robotics Competition APIs and public sources.",
                },
                {
                  question: "How often is data updated?",
                  answer: "Near real-time as data becomes available.",
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

  // grid stays row+wrap; we drive stacking via width calculations
  grid: { flexDirection: "row", flexWrap: "wrap" },

  // IMPORTANT: remove maxWidth/flex that fight our width math
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