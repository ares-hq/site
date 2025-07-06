import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useDarkMode } from '@/context/DarkModeContext';

interface LegalPageProps {
  onBack?: () => void;
  privacyPolicy?: boolean;
}

const PrivacyPolicyTerms = ({ onBack, privacyPolicy } : LegalPageProps) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(privacyPolicy ? 'privacy' : 'terms');
  const { isDarkMode } = useDarkMode();

  const getThemedStyles = (darkMode: boolean) => {
    const theme = {
      background: darkMode ? "rgba(42, 42, 42, 1)" : "#FFFFFF",
      backgroundSecondary: darkMode ? "#1E293B" : "#F9FAFB",
      backgroundTertiary: darkMode ? "#334155" : "#FFFFFF",
      textPrimary: darkMode ? "#F8FAFC" : "#111827",
      textSecondary: darkMode ? "#CBD5E1" : "#6B7280",
      textTertiary: darkMode ? "#94A3B8" : "#9CA3AF",
      border: darkMode ? "#rgba(71, 85, 105, 0.3)" : "#E5E7EB",
      borderLight: darkMode ? "#475569" : "#F3F4F6",
      cardBackground: darkMode ? "#1E293B" : "#FFFFFF",
      cardBackgroundHover: darkMode ? "#334155" : "#F9FAFB",
      accent: "#3B82F6",
      accentHover: darkMode ? "#60A5FA" : "#2563EB",
      success: darkMode ? "#10B981" : "#059669",
      error: darkMode ? "#EF4444" : "#DC2626",
      tabContainer: darkMode ? "rgba(42, 42, 42, 0.8)" : "#F9FAFB",
      tabContainerBorder: darkMode ? "rgba(71, 85, 105, 0.3)" : "#E5E7EB",
      activeTabBackground: darkMode ? "rgba(71, 85, 105, 0.4)" : "#FFFFFF",
      activeTabText: darkMode ? "#F1F5F9" : "#111827",
      inactiveTabText: darkMode ? "#94A3B8" : "#6B7280",
    };
    return theme;
  };

  const theme = getThemedStyles(isDarkMode);
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();

  const renderPrivacyPolicy = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last updated: January 1, 2024</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          ARES FTC Analytics Platform collects information to provide better services to our users. We collect information in the following ways:
        </Text>
        <Text style={styles.bulletPoint}>• Account information (username, email address)</Text>
        <Text style={styles.bulletPoint}>• Team and competition data you input</Text>
        <Text style={styles.bulletPoint}>• Usage analytics and performance metrics</Text>
        <Text style={styles.bulletPoint}>• Device information and app usage statistics</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide and maintain our scouting platform</Text>
        <Text style={styles.bulletPoint}>• Generate analytics and insights for FTC competitions</Text>
        <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
        <Text style={styles.bulletPoint}>• Communicate with you about updates and features</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Data Sharing and Disclosure</Text>
        <Text style={styles.paragraph}>
          We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy. We may share aggregated, non-personally identifiable information for research and competition analysis purposes.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is designed for FTC participants, many of whom are minors. We comply with COPPA requirements and obtain parental consent when necessary for users under 13.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us at privacy@aresftc.com
        </Text>
      </View>
    </View>
  );

  const renderTermsOfService = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.title}>Terms and Conditions</Text>
      <Text style={styles.lastUpdated}>Last updated: January 1, 2024</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing and using the ARES FTC Analytics Platform, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          ARES provides scouting intelligence and analytics tools for FIRST Tech Challenge (FTC) robotics competitions. Our platform offers real-time insights, match analysis, and strategic planning tools.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
        <Text style={styles.paragraph}>
          Users agree to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide accurate and truthful information</Text>
        <Text style={styles.bulletPoint}>• Use the service in compliance with FTC rules and regulations</Text>
        <Text style={styles.bulletPoint}>• Respect other users and maintain sportsmanship</Text>
        <Text style={styles.bulletPoint}>• Not attempt to hack, disrupt, or misuse the platform</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Prohibited Uses</Text>
        <Text style={styles.paragraph}>
          You may not use our service:
        </Text>
        <Text style={styles.bulletPoint}>• For any unlawful purpose or to solicit unlawful acts</Text>
        <Text style={styles.bulletPoint}>• To violate any international, federal, provincial, or state regulations or laws</Text>
        <Text style={styles.bulletPoint}>• To transmit or procure sending of any advertising or promotional material</Text>
        <Text style={styles.bulletPoint}>• To impersonate or attempt to impersonate other users or entities</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          The service and its original content, features, and functionality are owned by ARES and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          ARES shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Contact Information</Text>
        <Text style={styles.paragraph}>
          Questions about the Terms of Service should be sent to us at legal@aresftc.com
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Legal</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            {width < 575 ? 'T & C' : 'Terms & Conditions'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'privacy' ? renderPrivacyPolicy() : renderTermsOfService()}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.accent,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  themeToggleText: {
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.tabContainer,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.tabContainerBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.activeTabBackground,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.inactiveTabText,
  },
  activeTabText: {
    color: theme.activeTabText,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.textSecondary,
    marginLeft: 16,
    marginBottom: 6,
  },
});

export default PrivacyPolicyTerms;