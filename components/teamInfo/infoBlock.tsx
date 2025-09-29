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

  const Inside = () => (
    <View style={styles.container}>
      <Text style={[
        styles.title,
        { color: isDarkMode ? '#F9FAFB' : '#111827' }
      ]}>
        Team Profile
      </Text>
      <View style={styles.contentContainer}>
        <View style={styles.infoColumn}>
          <InfoRow icon={<ShieldIcon fill={isDarkMode ? '#fff' : '#000'}/>} label="Team Name" value={teamInfo.teamName || 'N/A'} />
          <InfoRow icon={<LocationIcon fill={isDarkMode ? '#fff' : '#000'}/>} label="Location" value={teamInfo.location || 'N/A'} />
          <InfoRow icon={<CalendarIcon fill={isDarkMode ? '#fff' : '#000'}/>} label="Founded" value={teamInfo.founded || 'N/A'} />
          <InfoRow icon={<TrophyIcon fill={isDarkMode ? '#fff' : '#000'}/>} label="Highest Score" value={highScore.toString()} />
        </View>
        <View style={styles.offsetColumn}>
          <InfoRow
            icon={<GlobeIcon fill={isDarkMode ? '#fff' : '#000'}/>}
            label="Website"
            value={teamInfo.website || 'N/A'}
            isLink
            displayText={'Team ' + (teamInfo.teamNumber && teamInfo.teamNumber.toString())}
          />
          <InfoRow
            icon={<UsersIcon fill={isDarkMode ? '#fff' : '#000'}/>}
            label="Sponsors"
            value={teamInfo.sponsors || 'N/A'}
          />
          <InfoRow
            icon={<TopScore fill={isDarkMode ? '#fff' : '#000'}/>}
            label="Achievements"
            value={teamInfo.achievements || 'N/A'}
          />
        </View>
      </View>
    </View>
  );

  return (
    screenWidth < 1400 ? (
      <View style={[
        styles.container, 
        { 
          width: 700,
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F9FAFB',
          borderColor: isDarkMode ? '#374151' : 'transparent',
          // borderWidth: 1 ,
        }
      ]}>
        <Inside />
      </View>
    ) : (
      <View style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
          borderColor: isDarkMode ? '#374151' : 'transparent',
          // borderWidth: 1,
        }
      ]}>
        <Inside />
      </View>
    )
  );
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
    padding: 10,
    paddingTop: 8,
    flex: 1,
    borderRadius: 16,
  },
  title: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'left',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 30,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
    marginTop: 1,
  },
  infoColumn: {
    minWidth: 1,
    maxWidth: 150,
    gap: 20,
  },
  offsetColumn: {
    flex: 1,
    gap: 10,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  link: {
    textDecorationLine: 'underline',
  },
  pressableLink: {
    alignSelf: 'flex-start',
  },
});

export default InfoBox;