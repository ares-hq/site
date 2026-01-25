import { calculateTeamOPR } from '@/api/algorithms/calcOPR';
import { getEventistoricalData, getAverageOPRs } from '@/api/dashboardInfo';
import { getEventData } from '@/api/event-service';
import { AllianceInfo, EventInfo, MatchTypeAverages, SupportedYear } from '@/api/utils/types';
import { usePageTitleContext } from '@/app/_layout';
import EventPerformance from '@/components/graphs/eventPerformace';
import EventMatchCard from '@/components/teamInfo/eventMatchCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Caret from '../../assets/icons/caret-up-down-bold.svg';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  color: 'blue' | 'indigo';
  isMobile?: boolean;
};

const StatCard = ({ title, value, change, positive, color, isMobile }: StatCardProps) => {
  const { isDarkMode } = useDarkMode();
  
  const getBackgroundColor = () => {
    if (isDarkMode) {
      return color === 'blue' ? 'rgba(30, 58, 138, 0.4)' : 'rgba(55, 48, 163, 0.4)';
    }
    return color === 'blue' ? '#E6F1FD' : '#EDEEFC';
  };

  const textColor = positive ? '#16a34a' : '#dc2626';

  return (
    <View style={[
      isMobile ? styles.cardMobile : styles.card,
      { backgroundColor: getBackgroundColor() }
    ]}>
      <Text style={[
        isMobile ? styles.titleMobile : styles.title,
        { color: isDarkMode ? '#D1D5DB' : '#6b7280' }
      ]}>
        {title}
      </Text>
      <View style={isMobile ? styles.rowMobile : styles.row}>
        <Text style={[
          isMobile ? styles.valueMobile : styles.value,
          { color: isDarkMode ? '#F9FAFB' : '#000' }
        ]}>
          {value}
        </Text>
        <View style={styles.changeRow}>
          <Text style={[styles.change, { color: textColor }]}>{change}</Text>
          <Feather name={positive ? 'trending-up' : 'trending-down'} size={isMobile ? 9 : 11} color={textColor} />
        </View>
      </View>
    </View>
  );
};

const GAME_NAMES: Record<SupportedYear, string> = {
  2019: '2019 - Skystone',
  2020: '2020 - Ultimate Goal',
  2021: '2021 - Freight Frenzy',
  2022: '2022 - Power Play',
  2023: '2023 - Centerstage',
  2024: '2024 - Into the Deep',
  2025: '2025 - Decode',
};

export const EventDashboardTemplate = ({ seasonYear: propSeasonYear }: { seasonYear?: SupportedYear }) => {
  const params = useLocalSearchParams();
  const { setPageTitleInfo } = usePageTitleContext();
  const eventCode = Array.isArray(params.eventCode) ? params.eventCode[0] : params.eventCode;
  const yearParam = Array.isArray(params.year) ? params.year[0] : params.year;
  const seasonYear: SupportedYear = (yearParam ? parseInt(yearParam) : propSeasonYear) as SupportedYear || 2025;

  const [containerWidth, setContainerWidth] = useState(0);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [availableYears, setAvailableYears] = useState<SupportedYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [noEventSelected, setNoEventSelected] = useState(false);
  const [noDataForEvent, setNoDataForEvent] = useState(false);
  const { isDarkMode } = useDarkMode();

  const [eventAverageOPR, setEventAverageOPR] = useState<{
    autoOPR: number; teleOPR: number; endgameOPR: number; overallOPR: number;
  } | null>(null);

  const [globalSeasonAverage, setGlobalSeasonAverage] = useState<{
    autoOPR: number; teleOPR: number; endgameOPR: number; overallOPR: number;
  } | null>(null);

  // Set Page Title
  useEffect(() => {
    if (eventCode) {
      setPageTitleInfo({ customSuffix: `${eventCode} (${GAME_NAMES[seasonYear]})` });
    }
  }, [eventCode, seasonYear]);

  // Fetch Available Years for this specific event
  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        if (!eventCode) return;
        const historicalData = await getEventistoricalData(eventCode);
        const yearsWithData: SupportedYear[] = [];
        historicalData.forEach((data, year) => {
          if (data !== null) yearsWithData.push(year as SupportedYear);
        });
        yearsWithData.sort((a, b) => b - a);
        setAvailableYears(yearsWithData);
      } catch (err) {
        console.error('Error fetching available years:', err);
      }
    };
    fetchAvailableYears();
  }, [eventCode]);

  // Main Data Fetching and OPR Matrix Logic
  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      setNoDataForEvent(false);
      try {
        const [fullEventData, seasonAvg] = await Promise.all([
          getEventData(eventCode, seasonYear),
          getAverageOPRs(seasonYear)
        ]);

        if (!fullEventData || !fullEventData.matches) {
          setNoDataForEvent(true);
          setLoading(false);
          return;
        }

        setEventInfo(fullEventData);
        setGlobalSeasonAverage(seasonAvg);

        const qualMatches = fullEventData.matches.filter(m => m.matchType === 'QUALIFICATION');
        
        const teams = Array.from(new Set(qualMatches.flatMap(m => [
          m.redAlliance?.team_1?.teamNumber, m.redAlliance?.team_2?.teamNumber,
          m.blueAlliance?.team_1?.teamNumber, m.blueAlliance?.team_2?.teamNumber
        ].filter((t): t is number => !!t))));

        if (teams.length > 0) {
          // Helper to map match totalPoints to specific phase scores (Auto/Tele/Endgame)
          // We adjust for the MatrixBuilder's penalty subtraction: (score + penalty) - penalty = score
          const mapMatchesForPhase = (phase: 'auto' | 'tele' | 'endgame') => {
            return qualMatches.map(m => ({
              ...m,
              redAlliance: {
                ...m.redAlliance,
                totalPoints: (m.redAlliance[phase] ?? 0) + (m.blueAlliance.penalty ?? 0)
              },
              blueAlliance: {
                ...m.blueAlliance,
                totalPoints: (m.blueAlliance[phase] ?? 0) + (m.redAlliance.penalty ?? 0)
              }
            }));
          };

          const autoMatches = mapMatchesForPhase('auto');
          const teleMatches = mapMatchesForPhase('tele');
          const endMatches = mapMatchesForPhase('endgame');

          const calculateEventAvg = (matchSet: any[]) => {
            const oprs = teams.map(t => calculateTeamOPR(matchSet, t));
            const valid = oprs.filter(v => !isNaN(v) && isFinite(v));
            return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
          };

          setEventAverageOPR({
            autoOPR: calculateEventAvg(autoMatches),
            teleOPR: calculateEventAvg(teleMatches),
            endgameOPR: calculateEventAvg(endMatches),
            overallOPR: calculateEventAvg(qualMatches),
          });
        }
      } catch (err) {
        console.error("OPR Generation Error:", err);
        setNoDataForEvent(true);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventCode, seasonYear]);

  const renderStatCard = (title: string, eventVal: number | undefined, globalVal: number | undefined, color: 'blue' | 'indigo') => {
    const value = eventVal ?? 0;
    const compare = globalVal ?? 0;
    const diff = value - compare;
    return (
      <StatCard 
        title={title}
        value={value ? value.toFixed(2) : '--'}
        change={`${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`}
        positive={diff >= 0}
        color={color}
        isMobile={containerWidth < 900}
      />
    );
  };

  if (loading) return <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#6b7280" /></View>;

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(42, 42, 42, 1)' : '#ffffff' }]} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
          {eventInfo?.name} ({eventCode}) Overview
        </Text>
        
        {/* Season Selector Dropdown */}
        <View style={[styles.seasonBadge, { backgroundColor: isDarkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)' }]}>
          <View style={{ position: 'relative' }}>
            <Picker
              selectedValue={seasonYear}
              onValueChange={(itemValue: SupportedYear) => {
                router.push(`/analytics/events/${eventCode}?year=${itemValue}` as any);
              }}
              style={styles.pickerHidden}
            >
              {availableYears.map((year) => (
                <Picker.Item key={year} label={GAME_NAMES[year]} value={year} />
              ))}
            </Picker>
            <View style={styles.pickerOverlay}>
              <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827', fontSize: 12, fontWeight: '600', flex: 1 }}>
                {GAME_NAMES[seasonYear]}
              </Text>
              <Caret width={12} height={12} fill={isDarkMode ? '#F9FAFB' : '#111827'} stroke={isDarkMode ? '#F9FAFB' : '#111827'} strokeWidth={7}/>
            </View>
          </View>
        </View>
      </View>

      <View style={containerWidth < 900 ? styles.cardRowMobile : styles.cardRow}>
        {renderStatCard("Avg Auto OPR", eventAverageOPR?.autoOPR, globalSeasonAverage?.autoOPR, 'indigo')}
        {renderStatCard("Avg TeleOp OPR", eventAverageOPR?.teleOPR, globalSeasonAverage?.teleOPR, 'blue')}
        {renderStatCard("Avg Endgame OPR", eventAverageOPR?.endgameOPR, globalSeasonAverage?.endgameOPR, 'indigo')}
        {renderStatCard("Avg Overall OPR", eventAverageOPR?.overallOPR, globalSeasonAverage?.overallOPR, 'blue')}
      </View>

      {eventInfo && <EventMatchCard eventData={eventInfo} seasonYear={seasonYear} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  header: { fontSize: 13, fontWeight: '600', flexShrink: 1, marginRight: 10 },
  seasonBadge: { borderRadius: 20, overflow: 'hidden' },
  pickerHidden: { opacity: 0, position: 'absolute', height: '100%', width: '100%', zIndex: 10 },
  pickerOverlay: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, width: 160 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginBottom: 13 },
  cardRowMobile: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  card: { flex: 1, minWidth: 220, height: 97, borderRadius: 13, padding: 20 },
  cardMobile: { flex: 1, minWidth: 160, height: 80, borderRadius: 10, padding: 12, justifyContent: 'center' },
  title: { fontSize: 15, marginBottom: 9 },
  titleMobile: { fontSize: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowMobile: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { fontSize: 26, fontWeight: '700' },
  valueMobile: { fontSize: 18, fontWeight: '700' },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4.5 },
  change: { fontSize: 13, fontWeight: '600' },
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default EventDashboardTemplate;