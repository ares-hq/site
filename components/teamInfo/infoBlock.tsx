import { TeamInfo } from '@/api/types';
import CalendarIcon from '@/assets/icons/calendar.svg';
import UsersIcon from '@/assets/icons/handshake.svg';
import ShieldIcon from '@/assets/icons/identification-card.svg';
import GlobeIcon from '@/assets/icons/link-simple-horizontal.svg';
import LocationIcon from '@/assets/icons/map-pin.svg';
import TrophyIcon from '@/assets/icons/ranking.svg';
import TopScore from '@/assets/icons/trophy.svg';
import { useDarkMode } from '@/context/DarkModeContext';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

interface InfoSectionProps {
  screenWidth: number;
  teamInfo: TeamInfo;
  highScore: number;
}

const InfoBox = ({ screenWidth, teamInfo, highScore }: InfoSectionProps) => {
  const { isDarkMode } = useDarkMode();

  return (
    <View style={[
      styles.container,
      screenWidth < 820 && styles.containerMobile,
      screenWidth >= 820 && screenWidth < 1400 && styles.containerTablet,
    ]}>
      <View style={[styles.infoItemsGridRow]}>
        <View style={[styles.infoItem, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)' }]}>
              <ShieldIcon width={14} height={14} fill={isDarkMode ? '#60A5FA' : '#3B82F6'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Team Name</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.teamName || 'N/A'}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)' }]}>
              <LocationIcon width={14} height={14} fill={isDarkMode ? '#22C55E' : '#22C55E'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Location</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.location || 'N/A'}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)' }]}>
              <CalendarIcon width={14} height={14} fill={isDarkMode ? '#A855F7' : '#A855F7'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Founded</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.founded || 'N/A'}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: isDarkMode ? 'rgba(251, 146, 60, 0.1)' : 'rgba(251, 146, 60, 0.05)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(251, 146, 60, 0.3)' : 'rgba(251, 146, 60, 0.2)' }]}>
              <TopScore width={14} height={14} fill={isDarkMode ? '#FB923C' : '#FB923C'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Highest Score</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{highScore.toString()}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.05)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.2)' }]}>
              <GlobeIcon width={14} height={14} fill={isDarkMode ? '#0EA5E9' : '#0EA5E9'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Website</Text>
          </View>
          <Pressable onPress={() => openLink(teamInfo.website || '')} disabled={!teamInfo.website}>
            <Text style={[styles.itemValue, styles.link, { color: teamInfo.website ? (isDarkMode ? '#60A5FA' : '#3B82F6') : (isDarkMode ? '#9CA3AF' : '#6B7280') }]}>
              {teamInfo.website ? `Team ${teamInfo.teamNumber}` : 'N/A'}
            </Text>
          </Pressable>
        </View>
      </View>
      
      <View style={[styles.infoItemsGridRowFull]}>
        <View style={[styles.infoItemFull, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)' }]}>
              <UsersIcon width={14} height={14} fill={isDarkMode ? '#EF4444' : '#EF4444'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Sponsors</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]} numberOfLines={2}>{teamInfo.sponsors || 'N/A'}</Text>
        </View>
      </View>
      
      <View style={[styles.infoItemsGridRowFull]}>
        <View style={[styles.infoItemFull, { backgroundColor: isDarkMode ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.05)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)' }]}>
              <TrophyIcon width={14} height={14} fill={isDarkMode ? '#EC4899' : '#EC4899'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Achievements</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]} numberOfLines={2}>{teamInfo.achievements || 'N/A'}</Text>
        </View>
      </View>
    </View>
  );

  function openLink(url: string) {
    const prefixed = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(prefixed).catch(() => Alert.alert("Can't open URL", url));
  }
};

const InfoRow = ({
  icon,
  label,
  value,
  isLink = false,
  displayText,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
  displayText?: string;
}) => {
  const { isDarkMode } = useDarkMode();

  const openLink = async (url: string) => {
    const prefixed = url.startsWith('http') ? url : `https://${url}`;
    const supported = await Linking.canOpenURL(prefixed);
    if (supported) {
      await Linking.openURL(prefixed);
    } else {
      Alert.alert("Can't open URL", url);
    }
  };

  return (
    <View style={styles.row}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.label,
          { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
        ]}>
          {label}
        </Text>
        {isLink ? (
          <Pressable onPress={() => openLink(value)} style={styles.pressableLink}>
            <Text
              style={[
                styles.value,
                styles.link,
                { 
                  color: isDarkMode ? '#60A5FA' : '#3B82F6',
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displayText || value}
            </Text>
          </Pressable>
        ) : (
          <Text style={[
            styles.value,
            { 
              color: isDarkMode ? '#F9FAFB' : '#111827',
              flexShrink: 1,
            }
          ]}
          numberOfLines={value.length > 80 ? undefined : 3}
          ellipsizeMode={value.length > 80 ? undefined : "tail"}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 16,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  containerMobile: {
    gap: 16,
    marginBottom: 12,
  },
  containerTablet: {
    gap: 18,
  },
  infoItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%',
    columnGap: 28,
    rowGap: 12,
  },
  infoItemsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItemsGridRowFull: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  infoItemFull: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  infoItem: {
    flexBasis: 'auto',
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 100,
  },
  itemIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginLeft: 22,
  },
  link: {
    textDecorationLine: 'underline',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
});

export default InfoBox;