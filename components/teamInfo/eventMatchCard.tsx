import { routeFromSeason } from '@/api/utils/seasons';
import { EventInfo, SupportedYear } from '@/api/utils/types';
import { webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MatchResultRow from './MatchResultRow';

interface Props {
  eventData: EventInfo;
  seasonYear: SupportedYear;
  /** ring this team inside the alliance pills */
  highlightTeam?: number;
  /** deep-link: expand + scroll to this match number */
  focusMatch?: string;
}

type Filter = 'all' | 'QUALIFICATION' | 'PLAYOFF';

export default function EventMatchCard({ eventData, seasonYear, highlightTeam, focusMatch }: Props) {
  const t = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [hl, setHl] = useState<number | undefined>(highlightTeam);

  // First tap on a team highlights it across every match; a second tap opens its dashboard.
  const onTeamPress = (n: number) => {
    if (hl === n) {
      router.push(`/dashboards/${routeFromSeason(seasonYear)}?teamnumber=${n}` as any);
    } else {
      setHl(n);
    }
  };

  const matches = useMemo(
    () => (eventData.matches ?? []).filter((m) => m.matchType !== 'PRACTICE'),
    [eventData.matches],
  );

  const counts = useMemo(
    () => ({
      all: matches.length,
      QUALIFICATION: matches.filter((m) => m.matchType === 'QUALIFICATION').length,
      PLAYOFF: matches.filter((m) => m.matchType === 'PLAYOFF').length,
    }),
    [matches],
  );

  const shown = filter === 'all' ? matches : matches.filter((m) => m.matchType === filter);

  const Chip = ({ id, label }: { id: Filter; label: string }) => {
    const active = filter === id;
    const n = id === 'all' ? counts.all : counts[id];
    if (id !== 'all' && n === 0) return null;
    return (
      <Pressable
        onPress={() => setFilter(id)}
        style={[
          styles.chip,
          webTransition(),
          { backgroundColor: active ? t.c.accentSoft : t.c.bgSubtle, borderColor: active ? t.c.accent : t.c.border },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? t.c.accentText : t.c.textMuted }]}>
          {label} <Text style={{ color: t.c.textFaint }}>{n}</Text>
        </Text>
      </Pressable>
    );
  };

  return (
    <View>
      <View style={styles.filterRow}>
        <Chip id="all" label="All" />
        <Chip id="QUALIFICATION" label="Qual" />
        <Chip id="PLAYOFF" label="Playoff" />
      </View>

      <View style={[styles.card, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
        {shown.length === 0 ? (
          <Text style={{ color: t.c.textMuted, fontSize: 13, padding: 18, textAlign: 'center' }}>No matches to show.</Text>
        ) : (
          shown.map((m, i) => (
            <MatchResultRow
              key={`${m.matchNumber}-${i}`}
              match={m}
              seasonYear={seasonYear}
              eventCode={eventData.eventCode}
              highlightTeam={hl}
              first={i === 0}
              last={i === shown.length - 1}
              defaultOpen={!!focusMatch && String(m.matchNumber) === String(focusMatch)}
              onTeam={onTeamPress}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
});
