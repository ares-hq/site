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
        <View style={[styles.infoItem, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.25)' }]}>
              <ShieldIcon width={14} height={14} fill={isDarkMode ? '#60A5FA' : '#1E40AF'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Team Name</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.teamName || 'N/A'}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.25)' }]}>
              <LocationIcon width={14} height={14} fill={isDarkMode ? '#34D399' : '#047857'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Location</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.location || 'N/A'}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.3)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.25)' }]}>
              <CalendarIcon width={14} height={14} fill={isDarkMode ? '#A78BFA' : '#5B21B6'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Founded</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{teamInfo.founded || 'N/A'}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: 'rgba(251, 146, 60, 0.12)', borderColor: 'rgba(251, 146, 60, 0.3)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(251, 146, 60, 0.25)' }]}>
              <TopScore width={14} height={14} fill={isDarkMode ? '#FBBF24' : '#92400E'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Highest Score</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>{highScore.toString()}</Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: 'rgba(14, 165, 233, 0.12)', borderColor: 'rgba(14, 165, 233, 0.3)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(14, 165, 233, 0.25)' }]}>
              <GlobeIcon width={14} height={14} fill={isDarkMode ? '#38BDF8' : '#0C4A6E'} />
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
        <View style={[styles.infoItemFull, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <UsersIcon width={14} height={14} fill={isDarkMode ? '#F87171' : '#7F1D1D'} />
            </View>
            <Text style={[styles.itemLabel, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>Sponsors</Text>
          </View>
          <Text style={[styles.itemValue, { color: isDarkMode ? '#F9FAFB' : '#111827' }]} numberOfLines={2}>{teamInfo.sponsors || 'N/A'}</Text>
        </View>
      </View>
      
      <View style={[styles.infoItemsGridRowFull]}>
        <View style={[styles.infoItemFull, { backgroundColor: 'rgba(20, 184, 166, 0.12)', borderColor: 'rgba(20, 184, 166, 0.3)' }]}>
          <View style={styles.itemIconLabel}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(20, 184, 166, 0.25)' }]}>
              <TrophyIcon width={14} height={14} fill={isDarkMode ? '#5EEAD4' : '#0D9488'} />
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    marginBottom: 20,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  containerMobile: {
    gap: 10,
    marginBottom: 20,
  },
  containerTablet: {
    gap: 18,
  },
  infoItemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    columnGap: 28,
    rowGap: 12,
  },
  infoItemsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  infoItemsGridRowFull: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 0,
  },
  infoItemFull: {
    flex: 1,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  infoItem: {
    flexBasis: 'auto',
    flex: 1,
    padding: 6,
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
    marginLeft: 10
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