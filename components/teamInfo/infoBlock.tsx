import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import LocationIcon from '@/assets/icons/robot.svg';
import TrophyIcon from '@/assets/icons/robot.svg';
import UsersIcon from '@/assets/icons/robot.svg';
import CalendarIcon from '@/assets/icons/robot.svg';
import StarIcon from '@/assets/icons/robot.svg';
import ShieldIcon from '@/assets/icons/robot.svg';
import GlobeIcon from '@/assets/icons/robot.svg';

const InfoBox = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Profile</Text>
      <View style={styles.contentContainer}>
        <View>
          <InfoRow icon={<ShieldIcon />} label="Team Name" value="Team 1234" />
          <InfoRow icon={<LocationIcon />} label="Location" value="City, Country" />
          <InfoRow icon={<CalendarIcon />} label="Founded" value="2010" />
          <InfoRow icon={<TrophyIcon />} label="Highest Score" value="250" />
        </View>
        <View style={styles.offsetColumn}>
          <InfoRow
            icon={<GlobeIcon />}
            label="Website"
            value="https://team1234.example.com/very/long/path/that/keeps/going"
            isLink={true}
          />
          <InfoRow
            icon={<UsersIcon />}
            label="Sponsors"
            value="Sponsor A, Sponsor B, Sponsor C, Sponsor D, Sponsor E, Sponsor F"
          />
          <InfoRow
            icon={<TrophyIcon />}
            label="Achievements"
            value="Achievement 1 • Achievement 2"
          />
        </View>
      </View>
    </View>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
  isLink = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
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
              Team 14584
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
    padding: 20,
    borderRadius: 20,
    maxWidth: 600,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'left',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 4,
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