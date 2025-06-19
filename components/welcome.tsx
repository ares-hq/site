// app/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { getAverageOPRs, getTeamInfo, getTeamMatches } from '@/api/dashboardInfo';
import { getAveragePlace, getAwards } from '@/api/averageMatchScores';
import { EventInfo, TeamInfo } from '@/api/types';
import { Feather } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

    const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
    const [eventData, setEventData] = useState<EventInfo[] | null>(null);
    const [wins, setWins] = useState<number | null>(0);
    const [averageOPR, setAverageOPR] = useState<{
      autoOPR: number;
      teleOPR: number;
      endgameOPR: number;
      overallOPR: number;
    } | null>(null);
  
    useEffect(() => {
      const fetchInfo = async () => {
        try {
          const data = await getTeamInfo(14584);
          const avg = await getAverageOPRs();
          const match = await getTeamMatches(14584);
  
          if (data) {
            data.averagePlace = getAveragePlace(eventData ?? []);
            data.achievements = getAwards(eventData ?? []);
            setTeamInfo(data);
          }
          if (avg) setAverageOPR(avg);
          if (wins) setWins(wins);
          if (eventData) setEventData(eventData);
        } catch (err) {
          console.error('Error fetching dashboard info', err);
        } finally {
        //   setLoading(false);
        }
      };
      fetchInfo();
    }, []);

  type StatCardProps = {
    title: string;
    value: string;
    change: string;
    positive: boolean;
    color: 'blue' | 'indigo';
    };

  const StatCard = ({ title, value, change, positive, color }: StatCardProps) => {
    const backgroundColor = color === 'blue' ? '#E6F1FD' : '#EDEEFC';
    const textColor = positive ? '#16a34a' : '#dc2626';

    return (
        <View style={[styles.card, { backgroundColor }]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.row}>
            <Text style={styles.value}>{value}</Text>
            <View style={styles.changeRow}>
            <Text style={[styles.change, { color: textColor }]}>{change}</Text>
            <Feather name={positive ? 'trending-up' : 'trending-down'} size={11} color={textColor} />
            </View>
        </View>
        </View>
    );
    };
  
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/ARES-Logo-Green.png')}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>Welcome to ARES</Text>
          <Text style={styles.subtitle}>Scouting Intelligence. Simplified.</Text>
        </View>
        
        <View style={styles.rightSection}>
          <View style={styles.buttonContainer}>
            <Pressable 
              style={styles.primaryBtn} 
              onPress={() => router.push('/dashboards/intothedeep')}
            >
              <Text style={styles.primaryText}>Join TestFlight</Text>
            </Pressable>
            
            <Pressable 
              style={styles.secondaryBtn} 
              onPress={() => openLink('https://discord.gg/YOUR_INVITE')}
            >
              <Text style={styles.secondaryText}>Add to Discord</Text>
            </Pressable>
          </View>
        </View>
      </View>
      
      {/* Clear separator for table below */}
      <View style={styles.separator} />
        <View style={styles.cardRow}>
            <StatCard 
            title={`Auto OPR`}
            value={teamInfo?.autoOPR?.toFixed(2) ?? '--'} 
            change={
                averageOPR && teamInfo?.autoOPR != null
                ? `${(teamInfo.autoOPR - averageOPR.autoOPR >= 0 ? '+' : '')}${(teamInfo.autoOPR - averageOPR.autoOPR).toFixed(2)}`
                : '--'
            }
            positive={!!(averageOPR && teamInfo?.autoOPR != null && teamInfo.autoOPR - averageOPR.autoOPR >= 0)}
            color="indigo" 
            />
            <StatCard 
            title="TeleOp OPR" 
            value={teamInfo?.teleOPR?.toFixed(2) ?? '--'} 
            change={
                averageOPR && teamInfo?.teleOPR != null
                ? `${(teamInfo.teleOPR - averageOPR.teleOPR >= 0 ? '+' : '')}${(teamInfo.teleOPR - averageOPR.teleOPR).toFixed(2)}`
                : '--'
            }
            positive={!!(averageOPR && teamInfo?.teleOPR != null && teamInfo.teleOPR - averageOPR.teleOPR >= 0)}
            color="blue" 
            />
            <StatCard 
            title="Endgame OPR" 
            value={teamInfo?.endgameOPR?.toFixed(2) ?? '--'} 
            change={
                averageOPR && teamInfo?.endgameOPR != null
                ? `${(teamInfo.endgameOPR - averageOPR.endgameOPR >= 0 ? '+' : '')}${(teamInfo.endgameOPR - averageOPR.endgameOPR).toFixed(2)}`
                : '--'
            }
            positive={!!(averageOPR && teamInfo?.endgameOPR != null && teamInfo.endgameOPR - averageOPR.endgameOPR >= 0)}
            color="indigo" 
            />
            <StatCard 
            title="Overall OPR" 
            value={teamInfo?.overallOPR?.toFixed(2) ?? '--'} 
            change={
                averageOPR && teamInfo?.overallOPR != null
                ? `${(teamInfo.overallOPR - averageOPR.overallOPR >= 0 ? '+' : '')}${(teamInfo.overallOPR - averageOPR.overallOPR).toFixed(2)}`
                : '--'
            }
            positive={!!(averageOPR && teamInfo?.overallOPR != null && teamInfo.overallOPR - averageOPR.overallOPR >= 0)}
            color="blue" 
            />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    paddingRight: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  value: {
    fontSize: 26,
    color: '#000',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
  },
  change: {
    fontSize: 13,
  },
  logoContainer: {
    marginBottom: 24,
    borderRadius: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    shadowColor: '#000',
  },
    cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 13,
    marginBottom: 13,
  },
  card: {
    flex: 1,
    minWidth: 162,
    height: 97,
    borderRadius: 13,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 24,
    fontWeight: '400',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  buttonContainer: {
    gap: 16,
    minWidth: 200,
  },
  primaryBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 16,
  },
  separator: {
    height: 1,
    marginVertical: 32,
    width: '100%',
    backgroundColor: '#6B7280',
  },
});