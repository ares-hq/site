import { getCachedMatchScoreDetails } from '@/api/match-scores';
import { MatchInfo, SupportedYear } from '@/api/utils/types';
import { webTransition } from '@/components/shared/motion';
import { TeamPill } from '@/components/shared/Table';
import { useTheme } from '@/components/shared/theme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import MatchScoreBreakdown from './MatchScoreBreakdown';

const RED = { light: '#DC2626', dark: '#F87171' };
const BLUE = { light: '#2563EB', dark: '#60A5FA' };

type Props = {
  match: MatchInfo;
  seasonYear: SupportedYear;
  eventCode?: string;
  /** team number ringed inside the alliance pills (controlled by the parent) */
  highlightTeam?: number;
  first?: boolean;
  last?: boolean;
  /** deep-link target: start expanded and scroll into view */
  defaultOpen?: boolean;
  /** parent decides: first tap highlights, a tap on the already-highlighted team navigates */
  onTeam?: (n: number) => void;
};

export default function MatchResultRow({ match, seasonYear, eventCode, highlightTeam, first, last, defaultOpen, onTeam }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const stack = width < 640;

  const [open, setOpen] = useState(!!defaultOpen);
  const wrapRef = useRef<any>(null);

  useEffect(() => {
    if (!defaultOpen || Platform.OS !== 'web') return;
    const id = setTimeout(() => {
      const node: any = wrapRef.current;
      node?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    }, 250);
    return () => clearTimeout(id);
  }, [defaultOpen]);
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const redScore = match.redAlliance.totalPoints ?? 0;
  const blueScore = match.blueAlliance.totalPoints ?? 0;
  const redWin = redScore > blueScore;
  const blueWin = blueScore > redScore;
  const tie = redScore === blueScore;

  const redC = t.isDark ? RED.dark : RED.light;
  const blueC = t.isDark ? BLUE.dark : BLUE.light;

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (details || !eventCode) return;
    const level = match.matchType === 'PLAYOFF' ? 'playoff' : match.matchType === 'PRACTICE' ? 'practice' : 'qual';
    setLoadingDetails(true);
    try {
      const d = await getCachedMatchScoreDetails(seasonYear, eventCode, level, match.matchNumber);
      if (d) setDetails(d);
    } catch (err) {
      console.error('match breakdown:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const pills = (a: MatchInfo['redAlliance'], side: 'red' | 'blue') =>
    [a.team_1, a.team_2].filter(Boolean).map((tm) => (
      <TeamPill
        key={tm!.teamNumber}
        teamNumber={tm!.teamNumber}
        side={side}
        highlight={highlightTeam != null && tm!.teamNumber === highlightTeam}
        onPress={onTeam ? () => onTeam(tm!.teamNumber) : undefined}
      />
    ));

  const idBlock = (
    <View style={styles.idRow}>
      <Text style={[styles.code, { color: t.c.text }]} numberOfLines={1}>{match.matchNumber}</Text>
      <View style={[styles.badge, { borderColor: t.c.border }]}>
        <Text style={[styles.badgeText, { color: t.c.textFaint }]}>
          {match.matchType === 'PLAYOFF' ? 'Playoff' : 'Qual'}
        </Text>
      </View>
    </View>
  );

  const scoreBlock = (
    <View style={styles.scoreCol}>
      <Text style={[styles.score, { color: tie || redWin ? (redWin ? redC : t.c.text) : t.c.textFaint, fontWeight: redWin ? '800' : '600' }]}>
        {redScore}
      </Text>
      <Text style={[styles.sep, { color: t.c.textFaint }]}>–</Text>
      <Text style={[styles.score, { color: tie || blueWin ? (blueWin ? blueC : t.c.text) : t.c.textFaint, fontWeight: blueWin ? '800' : '600' }]}>
        {blueScore}
      </Text>
    </View>
  );

  const chevron = (
    <Feather
      name="chevron-down"
      size={16}
      color={open ? t.c.accent : t.c.textFaint}
      style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
    />
  );

  return (
    <View ref={wrapRef} style={!(last && !open) ? { borderBottomWidth: 1, borderBottomColor: t.c.border } : undefined}>
      <Pressable
        onPress={toggle}
        style={({ hovered }: any) => [
          styles.row,
          webTransition('background-color'),
          (open || hovered) && { backgroundColor: t.c.border },
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null,
        ]}
      >
        {stack ? (
          <View style={{ flex: 1, gap: 9 }}>
            <View style={styles.stackTop}>
              {idBlock}
              {scoreBlock}
              {chevron}
            </View>
            <View style={styles.allianceStacked}>
              <View style={[styles.sideTag, { backgroundColor: redC }]}><Text style={styles.sideTagText}>R</Text></View>
              <View style={styles.pillWrap}>{pills(match.redAlliance, 'red')}</View>
            </View>
            <View style={styles.allianceStacked}>
              <View style={[styles.sideTag, { backgroundColor: blueC }]}><Text style={styles.sideTagText}>B</Text></View>
              <View style={styles.pillWrap}>{pills(match.blueAlliance, 'blue')}</View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.idColWide}>{idBlock}</View>
            <View style={[styles.pillWrap, styles.redSide]}>{pills(match.redAlliance, 'red')}</View>
            {scoreBlock}
            <View style={[styles.pillWrap, styles.blueSide]}>{pills(match.blueAlliance, 'blue')}</View>
            <View style={{ marginLeft: 4 }}>{chevron}</View>
          </>
        )}
      </Pressable>

      {open && (
        <View style={[styles.breakdown, { backgroundColor: t.c.bg, borderTopColor: t.c.hairline }]}>
          <View style={styles.breakdownHead}>
            <Text style={[styles.breakdownLabel, { color: t.c.textMuted }]}>Score breakdown</Text>
            <View style={styles.breakdownTotals}>
              <Text style={[styles.btNum, { color: redC }]}>{redScore}</Text>
              <Text style={{ color: t.c.textFaint, fontSize: 12 }}>vs</Text>
              <Text style={[styles.btNum, { color: blueC }]}>{blueScore}</Text>
            </View>
          </View>
          {!eventCode ? (
            <Text style={{ color: t.c.textFaint, fontSize: 12, paddingVertical: 10 }}>
              Score breakdown isn&apos;t available for this match.
            </Text>
          ) : (
            <MatchScoreBreakdown match={match} matchScoreDetails={details} loadingScores={loadingDetails} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  stackTop: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  idColWide: { width: 150 },
  code: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'], flexShrink: 0 },
  badge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, borderWidth: 1, flexShrink: 0 },
  badgeText: { fontSize: 9.5, fontWeight: '700' },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  redSide: { flex: 1, justifyContent: 'flex-end' },
  blueSide: { flex: 1, justifyContent: 'flex-start' },
  allianceStacked: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideTag: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  sideTagText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  scoreCol: { width: 108, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 9 },
  score: { fontSize: 18, fontVariant: ['tabular-nums'] },
  sep: { fontSize: 13 },
  breakdown: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  breakdownHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  breakdownLabel: { fontSize: 12, fontWeight: '700' },
  breakdownTotals: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  btNum: { fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
