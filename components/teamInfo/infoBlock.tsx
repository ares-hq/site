import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import LocationIcon from '@/assets/icons/map-pin.svg';
import TrophyIcon from '@/assets/icons/ranking.svg';
import TopScore from '@/assets/icons/trophy.svg';
import UsersIcon from '@/assets/icons/handshake.svg';
import CalendarIcon from '@/assets/icons/calendar.svg';
import ShieldIcon from '@/assets/icons/identification-card.svg';
import GlobeIcon from '@/assets/icons/link-simple-horizontal.svg';
import { TeamInfo } from '@/api/dashboardInfo';

interface InfoSectionProps {
  screenWidth: number;
  teamInfo: TeamInfo;
  highScore: number;
}

const InfoBox = ({ screenWidth, teamInfo, highScore }: InfoSectionProps) => {
  const Inside = () => (
    <View style={styles.container}>
    <Text style={styles.title}>Team Profile</Text>
      <View style={styles.contentContainer}>
        <View style={{ gap: 30 }}>
          <InfoRow icon={<ShieldIcon />} label="Team Name" value={teamInfo.teamName} />
          <InfoRow icon={<LocationIcon />} label="Location" value={teamInfo.location} />
          <InfoRow icon={<CalendarIcon />} label="Founded" value={teamInfo.founded} />
          <InfoRow icon={<TrophyIcon />} label="Highest Score" value={highScore.toString()} />
        </View>
        <View style={styles.offsetColumn}>
          <InfoRow
            icon={<GlobeIcon />}
            label="Website"
            value={teamInfo.website}
            isLink
            displayText={teamInfo.teamName}
          />
          <InfoRow
            icon={<UsersIcon />}
            label="Sponsors"
            value={teamInfo.sponsors}
          />
          <InfoRow
            icon={<TopScore />}
            label="Achievements"
            value={teamInfo.achievements}
          />
        </View>
      </View>
    </View>
  );
  return (
    screenWidth < 1400 ? (
      <View style={[styles.container, { width: 550 }]}>
        <Inside />
      </View>
    ) : (
      <View style={styles.container}>
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
        <Text style={styles.label}>{label}</Text>
        {isLink ? (
          <Pressable onPress={() => openLink(value)} style={styles.pressableLink}>
            <Text
              style={[styles.value, styles.link]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
               {displayText || value}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.value}>{value}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    paddingTop: 8,
    flex: 1,
    borderRadius: 16,
  },
  title: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
    textAlign: 'left',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 30,
    flexWrap: 'wrap',
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
  offsetColumn: {
    flex: 1,
    minWidth: 150,
    gap: 30,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  link: {
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  pressableLink: {
    alignSelf: 'flex-start',
  },
});

export default InfoBox;