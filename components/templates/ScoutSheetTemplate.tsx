import { calculateAllOPRs } from '@/api/algorithms/calcOPR';
import { getEventsBasic } from '@/api/basic-event-service';
import { getAllTeams } from '@/api/dashboardInfo';
import { getEventData } from '@/api/event-service';
import { DEFAULT_SEASON, SUPPORTED_YEARS } from '@/api/utils/seasons';
import { BasicEventInfo, MatchInfo, SupportedYear } from '@/api/utils/types';
import { usePageTitleContext } from '@/app/_layout';
import { MetaRow } from '@/components/shared/MetaRow';
import { webTransition } from '@/components/shared/motion';
import {
  Cell,
  CellView,
  HeadCell,
  TableEmpty,
  TableHead,
  TableRow,
  TableShell,
} from '@/components/shared/Table';
import { useTheme } from '@/components/shared/theme';
import { PageHeader, SectionHeader } from '@/components/shared/ui';
import { YearSelector } from '@/components/shared/YearSelector';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

type TeamRow = {
  teamNumber: number;
  teamName: string;
  opr: number;
  auto: number;
  tele: number;
  endgame: number;
  played: number;
  wins: number;
  form: boolean[]; // most recent first
};

type Loaded = {
  eventName: string;
  qualCount: number;
  teams: TeamRow[];
  /** mean penalty points an alliance is handed per match — added back into predicted scores */
  avgPenalty: number;
};

const AUTO_REFRESH_MS = 60_000;

type TeamInfoLite = {
  teamNumber: number;
  teamName: string;
  rank: number;
  opr: number;
  auto: number;
  tele: number;
  endgame: number;
};

/* ---------------- data ---------------- */

function alliances(m: MatchInfo) {
  return [m.redAlliance, m.blueAlliance];
}

function buildRows(matches: MatchInfo[]): TeamRow[] {
  const qual = matches.filter((m) => m.matchType === 'QUALIFICATION');
  const oprAll = calculateAllOPRs(qual);
  const phase = (p: 'auto' | 'tele' | 'endgame') =>
    calculateAllOPRs(
      qual.map((m) => ({
        ...m,
        redAlliance: { ...m.redAlliance, totalPoints: ((m.redAlliance as any)[p] ?? 0) + (m.blueAlliance.penalty ?? 0) },
        blueAlliance: { ...m.blueAlliance, totalPoints: ((m.blueAlliance as any)[p] ?? 0) + (m.redAlliance.penalty ?? 0) },
      })) as MatchInfo[],
    );
  const oprAuto = phase('auto');
  const oprTele = phase('tele');
  const oprEnd = phase('endgame');

  const acc = new Map<number, { name: string; played: number; wins: number; form: boolean[] }>();
  // qual is date-ascending from the API; iterate reversed for "most recent first" form
  for (const m of [...qual].reverse()) {
    for (const a of alliances(m)) {
      for (const team of [a.team_1, a.team_2]) {
        if (!team?.teamNumber) continue;
        const cur = acc.get(team.teamNumber) ?? { name: team.teamName || `Team ${team.teamNumber}`, played: 0, wins: 0, form: [] };
        cur.played += 1;
        if (a.win) cur.wins += 1;
        if (cur.form.length < 4) cur.form.push(!!a.win);
        acc.set(team.teamNumber, cur);
      }
    }
  }

  return Array.from(acc.entries()).map(([teamNumber, v]) => ({
    teamNumber,
    teamName: v.name,
    opr: oprAll.get(teamNumber) ?? 0,
    auto: oprAuto.get(teamNumber) ?? 0,
    tele: oprTele.get(teamNumber) ?? 0,
    endgame: oprEnd.get(teamNumber) ?? 0,
    played: v.played,
    wins: v.wins,
    form: v.form,
  }));
}

/* ---------------- fit scoring ----------------
 *
 * Fit is a 0–100 blend of three sub-scores, each itself 0–100:
 *
 *   S  Strength    = the partner's overall-OPR percentile in this field.
 *   C  Complement  = how well the partner covers the phases YOU are weak in.
 *                    For each phase p:  need_p  = 1 − yourPercentile_p   (0 = you're best, 1 = worst)
 *                                       cover_p = partnerPercentile_p
 *                    C = Σ(need_p · cover_p) / Σ need_p        (a need-weighted average)
 *   F  Form        = the partner's win rate over its last few matches (0.5 if none played).
 *
 *   with your team:   Fit = 0.40·S + 0.40·C + 0.20·F
 *   without it:       Fit = 0.70·S + 0.30·F        (Complement can't be computed)
 */

export const FIT_WEIGHTS = { withYou: { S: 0.4, C: 0.4, F: 0.2 }, soloS: 0.7, soloF: 0.3 } as const;
const FIT_PHASES = ['auto', 'tele', 'endgame'] as const;

function pct(values: number[], v: number) {
  if (values.length === 0) return 0;
  const below = values.filter((x) => x <= v).length;
  return below / values.length;
}

const PHASE_LABEL = { auto: 'Auto', tele: 'TeleOp', endgame: 'Endgame' } as const;

type FitCtx = { opr: number[]; auto: number[]; tele: number[]; endgame: number[]; n: number };
type FitResult = { fit: number; S: number; C: number | null; F: number };

function computeFit(cand: TeamRow, you: TeamRow | null, ctx: FitCtx): FitResult {
  const S = pct(ctx.opr, cand.opr) * 100;
  const F = (cand.form.length ? cand.form.filter(Boolean).length / cand.form.length : 0.5) * 100;

  let C: number | null = null;
  if (you) {
    let needSum = 0;
    let coverSum = 0;
    for (const p of FIT_PHASES) {
      const need = 1 - pct(ctx[p], you[p]);
      const cover = pct(ctx[p], cand[p]);
      needSum += need;
      coverSum += need * cover;
    }
    C =
      (needSum > 0
        ? coverSum / needSum
        : FIT_PHASES.reduce((s, p) => s + pct(ctx[p], cand[p]), 0) / FIT_PHASES.length) * 100;
  }

  const w = FIT_WEIGHTS;
  const fit =
    C == null
      ? Math.round(w.soloS * S + w.soloF * F)
      : Math.round(w.withYou.S * S + w.withYou.C * C + w.withYou.F * F);

  return { fit: Math.max(0, Math.min(100, fit)), S, C, F };
}

/** The single phase this candidate best covers a weakness of yours ("covers your Endgame"). */
function coverReason(cand: TeamRow, you: TeamRow | null, ctx: FitCtx): string | null {
  if (!you) return null;
  let best: (typeof FIT_PHASES)[number] | null = null;
  let bestScore = -1;
  for (const p of FIT_PHASES) {
    const need = 1 - pct(ctx[p], you[p]);
    const cover = pct(ctx[p], cand[p]);
    const s = need * cover;
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return best && bestScore >= 0.16 ? `covers your ${PHASE_LABEL[best]}` : null;
}

/* ---------------- keyboard nav for the comboboxes ---------------- */

// Arrow-key + Escape nav for a dropdown. Enter is handled by the field's
// onSubmitEditing so it doesn't fire twice on web.
function useComboKeys(count: number, open: boolean, onClose: () => void) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    setActive(0);
  }, [count, open]);
  const onKeyPress = (e: any) => {
    const key = e?.nativeEvent?.key;
    if (!open || !key) return;
    if (key === 'ArrowDown') {
      e.preventDefault?.();
      setActive((a) => Math.min(count - 1, a + 1));
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setActive((a) => Math.max(0, a - 1));
    } else if (key === 'Escape') {
      onClose();
    }
  };
  return { active, setActive, onKeyPress };
}

/* ---------------- component ---------------- */

type SortKey = 'fit' | 'opr';

export default function ScoutSheetTemplate() {
  const t = useTheme();
  const { setPageTitleInfo } = usePageTitleContext();
  const { width } = useWindowDimensions();
  const twoCol = width > 980;
  const showATE = width > 1160;

  const [year, setYear] = useState<SupportedYear>(DEFAULT_SEASON);
  const [eventCode, setEventCode] = useState('');
  const [eventQuery, setEventQuery] = useState('');
  const [events, setEvents] = useState<BasicEventInfo[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [allTeams, setAllTeams] = useState<TeamInfoLite[]>([]);
  const [yourTeam, setYourTeam] = useState('');
  const [teamSugOpen, setTeamSugOpen] = useState(false);
  const [data, setData] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('fit');
  const [sortAsc, setSortAsc] = useState(false);
  const [fitOpen, setFitOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setPageTitleInfo({ customSuffix: 'ScoutSheet' }), [setPageTitleInfo]);

  // Load the season's events + teams so the boxes can search by name / number / location.
  useEffect(() => {
    let cancelled = false;
    getEventsBasic(year, true).then((list) => {
      if (!cancelled) setEvents(list ?? []);
    });
    getAllTeams(year).then((list) => {
      if (!cancelled) {
        setAllTeams(
          (list ?? []).map((tm: any) => ({
            teamNumber: Number(tm.teamNumber),
            teamName: tm.teamName ?? `Team ${tm.teamNumber}`,
            rank: tm.overallRank ?? 9999,
            opr: tm.overallOPR ?? 0,
            auto: tm.autoOPR ?? 0,
            tele: tm.teleOPR ?? 0,
            endgame: tm.endgameOPR ?? 0,
          })),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const suggestions = useMemo(() => {
    const q = eventQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return events
      .filter(
        (e) =>
          e.eventCode?.toLowerCase().includes(q) ||
          e.name?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [eventQuery, events]);

  // Smart substring: any team whose number OR name contains what you typed.
  const teamSug = useMemo(() => {
    const q = yourTeam.trim().toLowerCase();
    if (q.length < 1) return [];
    return allTeams
      .filter((tm) => String(tm.teamNumber).includes(q) || tm.teamName.toLowerCase().includes(q))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 8);
  }, [yourTeam, allTeams]);

  const run = useCallback(
    async (overrideCode?: string) => {
      const code = (overrideCode ?? eventCode).trim().toUpperCase();
      if (!code) {
        setError('Enter an event by code, name or city to build the board.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const ev = await getEventData(code, year);
        const rows = ev?.matches?.length ? buildRows(ev.matches) : [];
        if (rows.length === 0) {
          setData(null);
          setError(`No qualification matches for ${code} yet — check back once the event is underway.`);
        } else {
          const quals = ev.matches.filter((m) => m.matchType === 'QUALIFICATION');
          const pens: number[] = [];
          quals.forEach((m) => {
            pens.push(m.redAlliance.penalty ?? 0, m.blueAlliance.penalty ?? 0);
          });
          const avgPenalty = pens.length ? pens.reduce((a, b) => a + b, 0) / pens.length : 0;
          setData({
            eventName: ev.name || code,
            qualCount: quals.length,
            teams: rows.sort((a, b) => b.opr - a.opr),
            avgPenalty,
          });
        }
      } catch (err) {
        console.error('scoutsheet:', err);
        setData(null);
        setError('Could not load that event. Double-check the code and try again.');
      } finally {
        setLoading(false);
      }
    },
    [eventCode, year],
  );

  // auto-refresh while a live event is loaded
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh && data) {
      timerRef.current = setInterval(run, AUTO_REFRESH_MS);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, data, run]);

  const yourNo = useMemo(() => {
    const n = parseInt(yourTeam.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [yourTeam]);

  const you = useMemo(() => data?.teams.find((r) => r.teamNumber === yourNo) ?? null, [data, yourNo]);

  const fitCtx = useMemo<FitCtx>(() => {
    const all = data?.teams ?? [];
    return {
      n: all.length,
      opr: all.map((r) => r.opr),
      auto: all.map((r) => r.auto),
      tele: all.map((r) => r.tele),
      endgame: all.map((r) => r.endgame),
    };
  }, [data]);

  const ranked = useMemo(() => {
    if (!data) return [];
    const scored = data.teams
      .filter((r) => r.teamNumber !== yourNo && !picked.has(r.teamNumber))
      .map((r) => ({ row: r, reason: coverReason(r, you, fitCtx), ...computeFit(r, you, fitCtx) }));
    const dir = sortAsc ? 1 : -1;
    const val = (x: (typeof scored)[number]) => (sortKey === 'opr' ? x.row.opr : x.fit);
    return scored.sort((a, b) => (val(a) - val(b)) * dir || b.fit - a.fit);
  }, [data, you, yourNo, picked, fitCtx, sortKey, sortAsc]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(k);
      setSortAsc(false);
    }
  };

  // Your phase percentiles + "need" (1 − percentile), for the explainer.
  const yourNeeds = useMemo(() => {
    if (!you) return null;
    return FIT_PHASES.map((p) => {
      const pctl = Math.round(pct(fitCtx[p], you[p]) * 100);
      return { phase: p, value: you[p], pctl, need: 100 - pctl };
    });
  }, [you, fitCtx]);

  const togglePicked = (n: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  /* ---- match simulator ---- */
  const [simRed, setSimRed] = useState<[string, string]>(['', '']);
  const [simBlue, setSimBlue] = useState<[string, string]>(['', '']);
  const [openSim, setOpenSim] = useState<number | null>(null);
  const simFieldProps = (idx: number) => ({
    open: openSim === idx,
    onOpenChange: (o: boolean) => setOpenSim((prev) => (o ? idx : prev === idx ? null : prev)),
  });

  // Simulate against the event field when a board is built; otherwise fall back to
  // every team's season-long OPRs so you can run a matchup without an event code.
  const simPool = useMemo<TeamRow[]>(() => {
    if (data) return data.teams;
    return allTeams.map((tm) => ({
      teamNumber: tm.teamNumber,
      teamName: tm.teamName,
      opr: tm.opr,
      auto: tm.auto,
      tele: tm.tele,
      endgame: tm.endgame,
      played: 0,
      wins: 0,
      form: [],
    }));
  }, [data, allTeams]);

  const teamByNum = useMemo(() => {
    const m = new Map<number, TeamRow>();
    simPool.forEach((r) => m.set(r.teamNumber, r));
    return m;
  }, [simPool]);

  const oprSd = useMemo(() => {
    const xs = simPool.map((r) => r.opr).filter((n) => Number.isFinite(n) && n > 0);
    if (xs.length < 2) return 20;
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  }, [simPool]);

  const sim = useMemo(() => {
    // Two-team OPR sums slightly under-read real scores (no fouls conceded, playoff alliances play
    // cleaner than the qual average). Add the field's mean penalty back in — both sides get it, so
    // the margin and win probability are unchanged, only the printed scores rise.
    const pen = data?.avgPenalty ?? 0;
    const side = (nums: string[]) => {
      const ts = nums.map((s) => teamByNum.get(parseInt(s, 10))).filter(Boolean) as TeamRow[];
      return {
        teams: ts,
        total: ts.reduce((s, r) => s + r.opr, 0) + (ts.length ? pen : 0),
        auto: ts.reduce((s, r) => s + r.auto, 0),
        tele: ts.reduce((s, r) => s + r.tele, 0),
        endgame: ts.reduce((s, r) => s + r.endgame, 0),
      };
    };
    const red = side(simRed);
    const blue = side(simBlue);
    const sigma = Math.max(12, 2 * oprSd);
    const margin = red.total - blue.total;
    const ready = red.teams.length > 0 && blue.teams.length > 0;
    const pRed = ready ? 1 / (1 + Math.exp((-1.7 * margin) / sigma)) : null;
    return { red, blue, margin, sigma, pRed, ready };
  }, [simRed, simBlue, teamByNum, oprSd, data?.avgPenalty]);

  // Row tap drops the team into the first empty simulator slot — keeps you on the page.
  const addToSim = (n: number) => {
    const s = String(n);
    if ([...simRed, ...simBlue].includes(s)) return;
    if (!simRed[0]) return setSimRed([s, simRed[1]]);
    if (!simRed[1]) return setSimRed([simRed[0], s]);
    if (!simBlue[0]) return setSimBlue([s, simBlue[1]]);
    return setSimBlue([simBlue[0], s]);
  };

  const FormDots = ({ form }: { form: boolean[] }) => (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {form.length === 0 ? (
        <Text style={{ color: t.c.textFaint, fontSize: 11 }}>—</Text>
      ) : (
        form.map((w, i) => (
          <View key={i} style={[styles.formDot, { backgroundColor: w ? t.c.success : t.c.danger }]} />
        ))
      )}
    </View>
  );

  const RED = t.isDark ? '#F87171' : '#DC2626';
  const BLUE = t.isDark ? '#60A5FA' : '#2563EB';

  /* ---- combobox keyboard nav ---- */
  const chooseEvent = (i: number) => {
    const e = suggestions[i];
    if (!e) return;
    setEventQuery(e.name || e.eventCode);
    setEventCode(e.eventCode);
    setSugOpen(false);
    run(e.eventCode);
  };
  const eventKeys = useComboKeys(suggestions.length, sugOpen, () => setSugOpen(false));

  const chooseTeam = (i: number) => {
    const tm = teamSug[i];
    if (!tm) return;
    setYourTeam(String(tm.teamNumber));
    setTeamSugOpen(false);
  };
  const teamKeys = useComboKeys(teamSug.length, teamSugOpen, () => setTeamSugOpen(false));

  const pickedList = [...picked];

  /* ---- simulator panel (shared between one- and two-column layouts) ---- */
  const simulatorPanel = (
    <View>
      <SectionHeader title="Match simulator" style={{ marginTop: 0 }} />
      <View style={[styles.sim, { borderColor: t.c.border, backgroundColor: t.c.bgSubtle }]}>
        {you && (
          <Pressable
            onPress={() => setSimRed([String(you.teamNumber), ranked[0] ? String(ranked[0].row.teamNumber) : ''])}
            style={styles.simFill}
          >
            <Feather name="zap" size={12} color={t.c.accentText} />
            <Text style={{ color: t.c.accentText, fontSize: 12, fontWeight: '600' }}>Load my alliance (you + top pick)</Text>
          </Pressable>
        )}

        <View style={styles.simGrid}>
          <View style={[styles.simSide, { zIndex: openSim === 0 || openSim === 1 ? 30 : 1 }]}>
            <Text style={[styles.simSideLabel, { color: RED }]}>Red alliance</Text>
            <View style={styles.simInputs}>
              <SimTeamField value={simRed[0]} onChange={(v) => setSimRed([v, simRed[1]])} side="red" teams={simPool} {...simFieldProps(0)} />
              <SimTeamField value={simRed[1]} onChange={(v) => setSimRed([simRed[0], v])} side="red" teams={simPool} {...simFieldProps(1)} />
            </View>
          </View>
          <View style={[styles.simSide, { zIndex: openSim === 2 || openSim === 3 ? 30 : 1 }]}>
            <Text style={[styles.simSideLabel, { color: BLUE }]}>Blue alliance</Text>
            <View style={styles.simInputs}>
              <SimTeamField value={simBlue[0]} onChange={(v) => setSimBlue([v, simBlue[1]])} side="blue" teams={simPool} {...simFieldProps(2)} />
              <SimTeamField value={simBlue[1]} onChange={(v) => setSimBlue([simBlue[0], v])} side="blue" teams={simPool} {...simFieldProps(3)} />
            </View>
          </View>
        </View>

        {sim.ready ? (
          <View style={[styles.simResult, { borderColor: t.c.border, backgroundColor: t.c.surface }]}>
            <View style={styles.simScoreRow}>
              <Text style={[styles.simScore, { color: RED }]}>{sim.red.total.toFixed(0)}</Text>
              <Text style={{ color: t.c.textFaint, fontSize: 12, fontWeight: '600' }}>predicted</Text>
              <Text style={[styles.simScore, { color: BLUE }]}>{sim.blue.total.toFixed(0)}</Text>
            </View>
            <Text style={[styles.simMeta, { color: t.c.textMuted }]}>
              {sim.margin >= 0 ? 'Red' : 'Blue'} by {Math.abs(sim.margin).toFixed(0)} · Red win{' '}
              {Math.round((sim.pRed ?? 0) * 100)}%
            </Text>
            <View style={styles.simPhaseRow}>
              {(['auto', 'tele', 'endgame'] as const).map((p) => (
                <View key={p} style={styles.simPhase}>
                  <Text style={[styles.simPhaseK, { color: t.c.textFaint }]}>{PHASE_LABEL[p]}</Text>
                  <Text style={[styles.simPhaseV, { color: t.c.text }]}>
                    {sim.red[p].toFixed(0)} <Text style={{ color: t.c.textFaint }}>–</Text> {sim.blue[p].toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : simPool.length === 0 ? (
          <Text style={[styles.simHint, { color: t.c.textFaint }]}>Loading teams…</Text>
        ) : (
          <Text style={[styles.simHint, { color: t.c.textFaint }]}>
            Enter at least one team per alliance to see a prediction
            {data ? '.' : ' — using season-long OPRs until you build a board.'}
          </Text>
        )}

        <Text style={[styles.exNote, { color: t.c.textFaint }]}>
          Predicted alliance score = sum of the partners&apos; OPRs
          {data
            ? ` + the event's average penalty points (${data.avgPenalty.toFixed(0)})`
            : ' (each team’s season average)'}
          . Red win probability = logistic of the score margin over σ = 2·SD(team OPR) = {sim.sigma.toFixed(0)}.
        </Text>
      </View>
    </View>
  );

  const hiddenPanel = data ? (
    <View>
      <SectionHeader title="Hidden teams" count={picked.size || undefined} />
      <View style={[styles.hiddenBox, { borderColor: t.c.border, backgroundColor: t.c.bgSubtle }]}>
        {picked.size === 0 ? (
          <Text style={[styles.hiddenEmpty, { color: t.c.textFaint }]}>
            Nothing hidden. Use the eye-off button on a row to drop teams that are already picked, or that
            won&apos;t pick you back — they leave the recommendations and land here.
          </Text>
        ) : (
          <>
            {pickedList.map((n, idx) => {
              const tm = teamByNum.get(n);
              return (
                <View
                  key={n}
                  style={[
                    styles.hiddenRow,
                    { borderColor: t.c.hairline, borderBottomWidth: idx === pickedList.length - 1 ? 0 : 1 },
                  ]}
                >
                  <Text style={[styles.hiddenNum, { color: t.c.text }]}>{n}</Text>
                  <Text style={[styles.hiddenName, { color: t.c.textMuted }]} numberOfLines={1}>
                    {tm?.teamName ?? `Team ${n}`}
                  </Text>
                  <Pressable
                    onPress={() => togglePicked(n)}
                    style={[styles.showBtn, webTransition(), { borderColor: t.c.border }]}
                  >
                    <Feather name="corner-up-left" size={11} color={t.c.accentText} />
                    <Text style={[styles.showBtnText, { color: t.c.accentText }]}>Restore</Text>
                  </Pressable>
                </View>
              );
            })}
            <Pressable onPress={() => setPicked(new Set())} style={styles.showAll} hitSlop={6}>
              <Text style={[styles.showAllText, { color: t.c.accentText }]}>Restore all {picked.size} teams</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  ) : null;

  const fitPanel = (
  <View style={{ marginTop: 12 }}>
    <Pressable
      onPress={() => setFitOpen((o) => !o)}
      style={[styles.fitToggle, Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : null]}
    >
      <Feather name={fitOpen ? 'chevron-down' : 'chevron-right'} size={11} color={t.c.textFaint} />
      <Text style={[styles.fitToggleText, { color: t.c.textFaint }]}>How the Fit score is built</Text>
    </Pressable>
    {fitOpen && (
    <View style={[styles.explain, { borderColor: t.c.border, backgroundColor: t.c.bgSubtle }]}>
      <Text style={[styles.exLine, { color: t.c.textMuted }]}>
        Fit is a 0–100 blend of three sub-scores (each also 0–100)
        {fitCtx.n > 0 ? (
          <>
            , computed against the <Text style={{ color: t.c.text, fontWeight: '700' }}>{fitCtx.n}</Text> teams in
            this field
          </>
        ) : (
          <> — build the board above to run it against a real field</>
        )}
        :
      </Text>

      <View style={styles.exItem}>
        <Text style={[styles.exKey, { color: t.c.text }]}>S · Strength</Text>
        <Text style={[styles.exVal, { color: t.c.textMuted }]}>the partner&apos;s overall-OPR percentile in the field.</Text>
      </View>
      <View style={styles.exItem}>
        <Text style={[styles.exKey, { color: t.c.text }]}>C · Complement</Text>
        <Text style={[styles.exVal, { color: t.c.textMuted }]}>
          covers what you lack — a need-weighted average, so a phase you&apos;re weak in pulls harder.
        </Text>
      </View>
      <View style={styles.exItem}>
        <Text style={[styles.exKey, { color: t.c.text }]}>F · Form</Text>
        <Text style={[styles.exVal, { color: t.c.textMuted }]}>
          win rate over the partner&apos;s last {data ? Math.max(...data.teams.map((r) => r.form.length), 1) : 4}{' '}
          matches (0.5 if none played).
        </Text>
      </View>

      <View style={[styles.exEqns, { borderColor: t.c.border, backgroundColor: t.c.surface }]}>
        <MRow>
          <MV>Fit</MV>
          <MO> = </MO>
          {you ? (
            <>
              <MO>{FIT_WEIGHTS.withYou.S.toFixed(2)}</MO>
              <MO dim>·</MO>
              <MV>S</MV>
              <MO> + </MO>
              <MO>{FIT_WEIGHTS.withYou.C.toFixed(2)}</MO>
              <MO dim>·</MO>
              <MV>C</MV>
              <MO> + </MO>
              <MO>{FIT_WEIGHTS.withYou.F.toFixed(2)}</MO>
              <MO dim>·</MO>
              <MV>F</MV>
            </>
          ) : (
            <>
              <MO>{FIT_WEIGHTS.soloS.toFixed(2)}</MO>
              <MO dim>·</MO>
              <MV>S</MV>
              <MO> + </MO>
              <MO>{FIT_WEIGHTS.soloF.toFixed(2)}</MO>
              <MO dim>·</MO>
              <MV>F</MV>
              <MO dim>{'   (enter your team # for C)'}</MO>
            </>
          )}
        </MRow>

        <MRow>
          <MV>S</MV>
          <MO> = 100 </MO>
          <MO dim>·</MO>
          <MFrac num={<MO dim>|{'{ i : OPRᵢ ≤ OPRₚ }'}|</MO>} den={<MV>N</MV>} />
        </MRow>

        {you && (
          <>
            <MRow>
              <MV>C</MV>
              <MO> = </MO>
              <MFrac
                num={
                  <MRow style={{ marginVertical: 0 }}>
                    <MO>Σ</MO>
                    <MV>needₚ</MV>
                    <MO dim>·</MO>
                    <MV>coverₚ</MV>
                  </MRow>
                }
                den={
                  <MRow style={{ marginVertical: 0 }}>
                    <MO>Σ</MO>
                    <MV>needₚ</MV>
                  </MRow>
                }
              />
            </MRow>
            <MRow>
              <MV>needₚ</MV>
              <MO> = 1 − </MO>
              <MO dim>pctlₚ(you)</MO>
              <MO dim>{'  ,   '}</MO>
              <MV>coverₚ</MV>
              <MO> = </MO>
              <MO dim>pctlₚ(partner)</MO>
              <MO dim>{'  ,   p ∈ { auto, tele, endgame }'}</MO>
            </MRow>
          </>
        )}

        <MRow>
          <MV>F</MV>
          <MO> = </MO>
          <MFrac num={<MO dim>wins in last k</MO>} den={<MV>k</MV>} />
          <MO dim>{'   (0.5 if k = 0)'}</MO>
        </MRow>
      </View>

      {yourNeeds && you && (
        <View style={{ marginTop: 10, gap: 4 }}>
          <Text style={[styles.exLine, { color: t.c.textMuted }]}>
            Your team {you.teamNumber} right now — percentile (need) per phase:
          </Text>
          <View style={styles.needRow}>
            {yourNeeds.map((n) => (
              <View key={n.phase} style={[styles.needCell, { borderColor: t.c.border }]}>
                <Text style={[styles.needPhase, { color: t.c.textFaint }]}>{PHASE_LABEL[n.phase]}</Text>
                <Text style={[styles.needVal, { color: t.c.text }]}>
                  P{n.pctl} <Text style={{ color: t.c.textFaint, fontWeight: '600' }}>(need {n.need})</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={[styles.exNote, { color: t.c.textFaint }]}>
        Percentiles are share-of-field ≤ value. OPR = offensive power rating from a least-squares fit on this
        event&apos;s qualification matches. Fit is a descriptive scouting heuristic, not a win predictor.
      </Text>
    </View>
    )}
  </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="ScoutSheet" subtitle="Real-time alliance-partner finder for playoff selection" />
      <Text style={[styles.blurb, { color: t.c.textMuted }]}>
        Pick a live or completed event by code, name or city. ScoutSheet ranks every team in the field by a{' '}
        <Text style={{ color: t.c.text, fontWeight: '600' }}>Fit</Text> score that weighs raw OPR, how well a team
        covers the phases you&apos;re weak in, and recent form. Add your team number to unlock the complement term
        and the match simulator.
      </Text>

      {/* controls */}
      <View style={styles.form}>
        <View style={styles.eventField}>
          <View style={[styles.inputBox, { backgroundColor: t.c.field, borderColor: sugOpen ? t.c.accent : t.c.border }]}>
            <Feather name="map-pin" size={13} color={t.c.textMuted} />
            <TextInput
              style={[styles.inputText, { color: t.c.text }]}
              placeholder="Event code, name or city…"
              placeholderTextColor={t.c.textMuted}
              value={eventQuery}
              onChangeText={(v) => {
                setEventQuery(v);
                setEventCode(v.trim().toUpperCase());
                setSugOpen(true);
              }}
              onFocus={() => setSugOpen(true)}
              onBlur={() => setTimeout(() => setSugOpen(false), 150)}
              onKeyPress={eventKeys.onKeyPress}
              onSubmitEditing={() => (sugOpen && suggestions.length ? chooseEvent(eventKeys.active) : run())}
              blurOnSubmit={false}
              returnKeyType="go"
            />
            {eventQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setEventQuery('');
                  setEventCode('');
                }}
                hitSlop={8}
              >
                <Feather name="x" size={12} color={t.c.textMuted} />
              </Pressable>
            )}
          </View>
          {sugOpen && suggestions.length > 0 && (
            <View style={[styles.sug, t.shadow.pop, { backgroundColor: t.c.raised, borderColor: t.c.border }]}>
              <ScrollView style={styles.sugScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {suggestions.map((e, i) => (
                  <Pressable
                    key={e.eventCode}
                    onPress={() => chooseEvent(i)}
                    onHoverIn={() => eventKeys.setActive(i)}
                    style={[styles.sugItem, i === eventKeys.active && { backgroundColor: t.c.accentSoft }]}
                  >
                    <Text style={[styles.sugName, { color: t.c.text }]} numberOfLines={1}>
                      {e.name || e.eventCode}
                    </Text>
                    <Text style={[styles.sugMeta, { color: t.c.textFaint }]} numberOfLines={1}>
                      {e.eventCode} · {e.location || '—'}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.teamField}>
          <View style={[styles.inputBox, { backgroundColor: t.c.field, borderColor: teamSugOpen ? t.c.accent : t.c.border }]}>
            <Feather name="hash" size={13} color={t.c.textMuted} />
            <TextInput
              style={[styles.inputText, { color: t.c.text }]}
              placeholder="Your team # or name"
              placeholderTextColor={t.c.textMuted}
              value={yourTeam}
              onChangeText={(v) => {
                setYourTeam(v);
                setTeamSugOpen(true);
              }}
              onFocus={() => setTeamSugOpen(true)}
              onBlur={() => setTimeout(() => setTeamSugOpen(false), 150)}
              onKeyPress={teamKeys.onKeyPress}
              onSubmitEditing={() => (teamSugOpen && teamSug.length ? chooseTeam(teamKeys.active) : run())}
              blurOnSubmit={false}
              returnKeyType="go"
            />
            {yourTeam.length > 0 && (
              <Pressable onPress={() => setYourTeam('')} hitSlop={8}>
                <Feather name="x" size={12} color={t.c.textMuted} />
              </Pressable>
            )}
          </View>
          {teamSugOpen && teamSug.length > 0 && (
            <View style={[styles.sug, t.shadow.pop, { backgroundColor: t.c.raised, borderColor: t.c.border }]}>
              <ScrollView style={styles.sugScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {teamSug.map((tm, i) => (
                  <Pressable
                    key={tm.teamNumber}
                    onPress={() => chooseTeam(i)}
                    onHoverIn={() => teamKeys.setActive(i)}
                    style={[styles.sugItem, i === teamKeys.active && { backgroundColor: t.c.accentSoft }]}
                  >
                    <Text style={[styles.sugName, { color: t.c.text }]} numberOfLines={1}>
                      <Text style={{ color: t.c.accentText }}>{tm.teamNumber}</Text> · {tm.teamName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <Pressable onPress={() => run()} style={[styles.runBtn, webTransition(), { backgroundColor: t.c.accent }]}>
          <Feather name={loading ? 'loader' : data ? 'refresh-cw' : 'zap'} size={14} color="#fff" />
          <Text style={styles.runBtnText}>{loading ? 'Loading…' : data ? 'Refresh' : 'Build board'}</Text>
        </Pressable>
      </View>

      <View style={[styles.split, twoCol && styles.splitRow]}>
        {/* left — the board */}
        <View style={styles.mainCol}>
          <View style={styles.yearRow}>
            <YearSelector selectedYear={year} availableYears={SUPPORTED_YEARS} onYearChange={setYear} />
          </View>
          {!!error && <Text style={[styles.note, { color: t.c.danger }]}>{error}</Text>}
          {!data ? (
            <View style={[styles.placeholder, { borderColor: t.c.border, backgroundColor: t.c.bgSubtle }]}>
              <Feather name="clipboard" size={26} color={t.c.textFaint} />
              <Text style={{ color: t.c.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 340 }}>
                Choose an event above to rank its alliance partners. Data comes straight from that event&apos;s
                qualification matches.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.eventLine, { color: t.c.textFaint }]}>{data.eventName}</Text>

              <MetaRow
                items={[
                  { icon: 'users', label: 'Teams in field', value: data.teams.length },
                  { icon: 'grid', label: 'Qual matches', value: data.qualCount },
                  { icon: 'check-square', label: 'Shortlist', value: ranked.length },
                  ...(you
                    ? [
                        { icon: 'target' as const, label: `Team ${you.teamNumber} OPR`, value: you.opr, decimals: 1 },
                        { icon: 'zap' as const, label: 'Your Auto', value: you.auto, decimals: 1 },
                        { icon: 'radio' as const, label: 'Your TeleOp', value: you.tele, decimals: 1 },
                        { icon: 'flag' as const, label: 'Your Endgame', value: you.endgame, decimals: 1 },
                      ]
                    : yourNo
                      ? [{ icon: 'target' as const, label: `Team ${yourNo}`, value: 'not in field' }]
                      : []),
                ]}
              />

              <SectionHeader title="Recommended partners" count={ranked.length || undefined} />
              <TableShell>
                <TableHead>
                  <HeadCell label="#" width={38} align="right" />
                  <HeadCell label="Team" flex={1} />
                  <HeadCell
                    label="OPR"
                    width={54}
                    align="right"
                    sortable
                    active={sortKey === 'opr'}
                    dir={sortAsc ? 'asc' : 'desc'}
                    onPress={() => toggleSort('opr')}
                  />
                  {showATE && <HeadCell label="A / T / E" width={100} align="right" />}
                  <HeadCell
                    label="Fit"
                    width={44}
                    align="right"
                    sortable
                    active={sortKey === 'fit'}
                    dir={sortAsc ? 'asc' : 'desc'}
                    onPress={() => toggleSort('fit')}
                  />
                  <HeadCell label="" width={44} align="right" />
                </TableHead>

                {ranked.length === 0 ? (
                  <TableEmpty icon="check-circle" text="No teams left — everything is hidden or filtered out." />
                ) : (
                  ranked.map(({ row, fit, reason }, i) => (
                    <TableRow
                      key={row.teamNumber}
                      first={i === 0}
                      last={i === ranked.length - 1}
                      onPress={() => addToSim(row.teamNumber)}
                    >
                      <Cell width={38} align="right" numeric tone="faint">
                        {i + 1}
                      </Cell>
                      <CellView flex={1}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.teamNum, { color: t.c.accentText }]}>{row.teamNumber}</Text>
                            <Text style={[styles.teamName, { color: t.c.textMuted }]} numberOfLines={1}>
                              {row.teamName}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                            <FormDots form={row.form} />
                            {!!reason && (
                              <Text style={[styles.reason, { color: t.c.success }]} numberOfLines={1}>
                                {reason}
                              </Text>
                            )}
                          </View>
                        </View>
                      </CellView>
                      <Cell width={54} align="right" numeric>
                        {row.opr.toFixed(1)}
                      </Cell>
                      {showATE && (
                        <Cell width={100} align="right" numeric tone="muted" style={{ fontSize: 11.5 }}>
                          {row.auto.toFixed(0)} / {row.tele.toFixed(0)} / {row.endgame.toFixed(0)}
                        </Cell>
                      )}
                      <Cell width={44} align="right" numeric style={{ fontWeight: '800', color: fitFg(fit, t) }}>
                        {fit}
                      </Cell>
                      <CellView width={44} align="right">
                        <Pressable
                          onPress={() => togglePicked(row.teamNumber)}
                          hitSlop={8}
                          style={[styles.hideBtn, webTransition(), { borderColor: t.c.border }]}
                        >
                          <Feather name="eye-off" size={12} color={t.c.textFaint} />
                        </Pressable>
                      </CellView>
                    </TableRow>
                  ))
                )}
              </TableShell>

              <Text style={[styles.tableHint, { color: t.c.textFaint }]}>
                Tap a row to drop that team into the match simulator. The eye-off button hides a team you can&apos;t
                pick — it moves to Hidden teams, where one tap restores it.
              </Text>

              <Pressable onPress={() => setAutoRefresh((v) => !v)} style={styles.autoRow}>
                <Feather
                  name={autoRefresh ? 'check-square' : 'square'}
                  size={14}
                  color={autoRefresh ? t.c.accent : t.c.textFaint}
                />
                <Text style={{ color: t.c.textMuted, fontSize: 12 }}>Auto-refresh every 60s while the event is live</Text>
              </Pressable>
            </>
          )}

          {fitPanel}
        </View>

        {/* right — simulator + hidden teams, always visible */}
        <View style={[styles.sideCol, twoCol ? { width: 340 } : { width: '100%' }]}>
          {simulatorPanel}
          {hiddenPanel}
        </View>
      </View>
    </View>
  );
}

/* ---------------- tiny "LaTeX-ish" math typesetter (no dependency) ---------------- */

function MV({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.mVar, { color: t.c.text }]}>{children}</Text>;
}
function MO({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  const t = useTheme();
  return <Text style={[styles.mOp, { color: dim ? t.c.textMuted : t.c.text }]}>{children}</Text>;
}
function MRow({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.mRow, style]}>{children}</View>;
}
function MFrac({ num, den }: { num: React.ReactNode; den: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.frac}>
      <View style={styles.fracPart}>{num}</View>
      <View style={[styles.fracRule, { backgroundColor: t.c.textMuted }]} />
      <View style={styles.fracPart}>{den}</View>
    </View>
  );
}

/** Combobox for the match simulator — type a number/name or pick from the list (arrow keys work). */
function SimTeamField({
  value,
  onChange,
  side,
  teams,
  open,
  onOpenChange,
}: {
  value: string;
  onChange: (v: string) => void;
  side: 'red' | 'blue';
  teams: TeamRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  // `open` is controlled by the parent so it can lift this field's alliance above the other while the menu is up
  const setOpen = (v: boolean) => onOpenChange(v);
  const dot = side === 'red' ? (t.isDark ? '#F87171' : '#DC2626') : t.isDark ? '#60A5FA' : '#2563EB';

  const selected = teams.find((r) => String(r.teamNumber) === value) ?? null;
  const query = q.trim().toLowerCase();
  const list = useMemo(() => {
    const base = query
      ? teams.filter((r) => String(r.teamNumber).includes(query) || r.teamName.toLowerCase().includes(query))
      : teams;
    return [...base].sort((a, b) => b.opr - a.opr).slice(0, 8);
  }, [teams, query]);

  const choose = (i: number) => {
    const r = list[i];
    if (!r) return;
    onChange(String(r.teamNumber));
    setQ('');
    setOpen(false);
  };
  const keys = useComboKeys(list.length, open, () => setOpen(false));

  return (
    <View style={[styles.simCell, { zIndex: open ? 40 : 1 }]}>
      <View style={[styles.simInputBox, { backgroundColor: t.c.field, borderColor: open ? t.c.accent : t.c.border }]}>
        <View style={[styles.simDot, { backgroundColor: dot }]} />
        <TextInput
          style={[styles.simInput, { color: t.c.text }]}
          placeholder="Search team…"
          placeholderTextColor={t.c.textFaint}
          value={open ? q : selected ? `${selected.teamNumber}` : q}
          onChangeText={(v) => {
            setQ(v);
            setOpen(true);
            if (!v) onChange('');
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyPress={keys.onKeyPress}
          onSubmitEditing={() => choose(keys.active)}
          blurOnSubmit={false}
        />
        {selected || q ? (
          <Pressable
            onPress={() => {
              onChange('');
              setQ('');
            }}
            hitSlop={6}
          >
            <Feather name="x" size={12} color={t.c.textMuted} />
          </Pressable>
        ) : list.length > 0 ? (
          // only show the caret when there's actually a list to drop down
          <Feather name="chevron-down" size={13} color={t.c.textFaint} />
        ) : null}
      </View>

      {open && list.length > 0 && (
        <View style={[styles.simMenu, t.shadow.pop, { backgroundColor: t.c.raised, borderColor: t.c.border }]}>
          <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {list.map((r, i) => (
              <Pressable
                key={r.teamNumber}
                onPress={() => choose(i)}
                onHoverIn={() => keys.setActive(i)}
                style={[styles.simMenuItem, i === keys.active && { backgroundColor: t.c.accentSoft }]}
              >
                <Text style={[styles.simMenuNum, { color: t.c.accentText }]}>{r.teamNumber}</Text>
                <Text style={[styles.simMenuName, { color: t.c.textMuted }]} numberOfLines={1}>
                  {r.teamName}
                </Text>
                <Text style={[styles.simMenuOpr, { color: t.c.textFaint }]}>{r.opr.toFixed(0)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={[styles.simName, { color: selected ? t.c.textMuted : t.c.textFaint }]} numberOfLines={1}>
        {selected ? selected.teamName : value ? 'not in this field' : ' '}
      </Text>
    </View>
  );
}

function fitFg(fit: number, t: ReturnType<typeof useTheme>) {
  if (fit >= 70) return t.c.success;
  if (fit >= 45) return t.c.text;
  return t.c.danger;
}

const styles = StyleSheet.create({
  blurb: { fontSize: 13, lineHeight: 19, marginBottom: 16, maxWidth: 660 },
  form: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 8, alignItems: 'flex-start', zIndex: 20 },
  eventField: { flexGrow: 1, flexBasis: 260, position: 'relative', zIndex: 30 },
  teamField: { width: 190, flexGrow: 1, flexBasis: 150, position: 'relative', zIndex: 30 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  sug: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 50,
    overflow: 'hidden',
  },
  sugScroll: { maxHeight: 264 },
  sugItem: { paddingHorizontal: 12, paddingVertical: 8 },
  sugName: { fontSize: 13, fontWeight: '600' },
  sugMeta: { fontSize: 11, marginTop: 1 },
  runBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  runBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  yearRow: { marginTop: 0, marginBottom: 6 },
  note: { fontSize: 12, marginBottom: 8, marginTop: 4 },

  split: { marginTop: 8 },
  splitRow: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  mainCol: { flex: 1, minWidth: 0 },
  sideCol: { gap: 4 },

  eventLine: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 38,
    borderRadius: 16,
    borderWidth: 1,
  },
  teamNum: { fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  teamName: { fontSize: 11.5, flexShrink: 1 },
  reason: { fontSize: 10.5, fontWeight: '600' },
  formDot: { width: 6, height: 6, borderRadius: 3 },
  hideBtn: { padding: 5, borderRadius: 6, borderWidth: 1 },
  tableHint: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}) },

  hiddenBox: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 2 },
  hiddenEmpty: { fontSize: 11.5, lineHeight: 17 },
  hiddenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1 },
  hiddenNum: { fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  hiddenName: { fontSize: 12, flex: 1 },
  showBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  showBtnText: { fontSize: 11, fontWeight: '700' },
  showAll: { paddingTop: 8, ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}) },
  showAllText: { fontSize: 11.5, fontWeight: '600' },

  fitToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, alignSelf: 'flex-start' },
  fitToggleText: { fontSize: 11, fontWeight: '600' },
  explain: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 7, marginTop: 6 },
  exLine: { fontSize: 11.5, lineHeight: 16 },
  exItem: { gap: 1 },
  exKey: { fontSize: 11.5, fontWeight: '700' },
  exVal: { fontSize: 11.5, lineHeight: 16 },
  exEqns: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, marginTop: 2, gap: 1 },
  exNote: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  mRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginVertical: 2 },
  mVar: {
    fontSize: 12.5,
    fontStyle: 'italic',
    ...(Platform.OS === 'web' ? ({ fontFamily: 'Georgia, "Times New Roman", serif' } as any) : {}),
  },
  mOp: {
    fontSize: 11.5,
    ...(Platform.OS === 'web' ? ({ fontFamily: 'Georgia, "Times New Roman", serif' } as any) : {}),
  },
  frac: { alignItems: 'center', paddingHorizontal: 3, marginVertical: 1 },
  fracPart: { paddingHorizontal: 4 },
  fracRule: { height: 1, alignSelf: 'stretch', marginVertical: 2 },

  sim: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12, position: 'relative', zIndex: 20 },
  simFill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}) },
  simGrid: { gap: 14, position: 'relative', zIndex: 20 },
  simSide: { gap: 8, position: 'relative' },
  simSideLabel: { fontSize: 12, fontWeight: '700' },
  simInputs: { gap: 8 },
  simCell: { alignSelf: 'stretch', gap: 3 },
  simInputBox: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9, borderWidth: 1 },
  simDot: { width: 7, height: 7, borderRadius: 2 },
  simInput: { flex: 1, fontSize: 13, padding: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) },
  simName: { fontSize: 10.5, paddingHorizontal: 2, minHeight: 14 },
  simMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    zIndex: 200,
    elevation: 24,
    overflow: 'hidden',
  },
  simMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8 },
  simMenuNum: { fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  simMenuName: { fontSize: 12, flex: 1 },
  simMenuOpr: { fontSize: 11, fontVariant: ['tabular-nums'] },
  simResult: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 8, alignItems: 'center', position: 'relative', zIndex: 1 },
  simScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  simScore: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  simMeta: { fontSize: 12.5, fontWeight: '600' },
  simPhaseRow: { flexDirection: 'row', gap: 16, marginTop: 2, flexWrap: 'wrap', justifyContent: 'center' },
  simPhase: { alignItems: 'center' },
  simPhaseK: { fontSize: 10, fontWeight: '700' },
  simPhaseV: { fontSize: 13, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  simHint: { fontSize: 12 },
  needRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  needCell: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5, minWidth: 88 },
  needPhase: { fontSize: 10, fontWeight: '700' },
  needVal: { fontSize: 11.5, fontWeight: '700', marginTop: 1, fontVariant: ['tabular-nums'] },
});
