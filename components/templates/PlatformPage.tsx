import { usePageTitleContext } from '@/app/_layout';
import { Reveal, webTransition } from '@/components/shared/motion';
import { useTheme } from '@/components/shared/theme';
import { SectionHeader } from '@/components/shared/ui';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export type PlatformItem = {
  id: string;
  title: string;
  description: string;
  usage: string;
  icon: keyof typeof Feather.glyphMap;
};

export type PlatformStep = {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
};

type Props = {
  pageKey: string;
  badgeIcon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  itemsTitle: string;
  items: PlatformItem[];
  steps: PlatformStep[];
  /** render each item's `usage` in a monospace chip (for slash commands) */
  monoUsage?: boolean;
};

export default function PlatformPage({
  pageKey,
  badgeIcon,
  title,
  description,
  ctaLabel,
  ctaHref,
  itemsTitle,
  items,
  steps,
  monoUsage = false,
}: Props) {
  const t = useTheme();
  const { setPageTitleInfo } = usePageTitleContext();
  useEffect(() => setPageTitleInfo({ customSuffix: undefined }), [setPageTitleInfo, pageKey]);

  return (
    <View style={{ flex: 1 }}>
      {/* Hero — no box; an oversized ghost glyph gives it depth */}
      <View style={styles.heroWrap}>
        <Feather name={badgeIcon} size={220} color={t.c.text} style={styles.heroGhost} />
        <Reveal offset={30}>
          <View style={styles.hero}>
            <View style={[styles.heroIcon, { borderColor: t.c.border, backgroundColor: t.c.bgSubtle }]}>
              <Feather name={badgeIcon} size={20} color={t.c.accent} />
            </View>
            <Text style={[styles.heroTitle, { color: t.c.text }]}>{title}</Text>
            <Text style={[styles.heroDesc, { color: t.c.textMuted }]}>{description}</Text>
            <CtaButton label={ctaLabel} onPress={() => Linking.openURL(ctaHref)} />
          </View>
        </Reveal>
      </View>

      {/* Items — one flat list, staggered in as you scroll */}
      <Reveal>
        <SectionHeader title={itemsTitle} count={items.length} />
      </Reveal>
      <View style={[styles.list, { borderColor: t.c.border }]}>
        {items.map((it, i) => (
          <Reveal key={it.id} delay={Math.min(i, 6) * 70} offset={26}>
            <ItemRow item={it} monoUsage={monoUsage} last={i === items.length - 1} />
          </Reveal>
        ))}
      </View>

      {/* Steps — a connector line runs down the numbers */}
      <Reveal>
        <SectionHeader title="How it works" />
      </Reveal>
      <View style={[styles.steps, { backgroundColor: t.c.bgSubtle, borderColor: t.c.border }]}>
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={Math.min(i, 6) * 80} offset={20}>
            <View style={[styles.step, { borderTopColor: t.c.hairline, borderTopWidth: i === 0 ? 0 : 1 }]}>
              <View style={styles.stepNumCol}>
                {i > 0 && <View style={[styles.stepLine, { backgroundColor: t.c.border }]} />}
                <View style={[styles.stepNum, { backgroundColor: t.c.accentSoft }]}>
                  <Text style={[styles.stepNumText, { color: t.c.accentText }]}>{i + 1}</Text>
                </View>
                {i < steps.length - 1 && <View style={[styles.stepLine, { backgroundColor: t.c.border }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: t.c.text }]}>{s.title}</Text>
                <Text style={[styles.stepDesc, { color: t.c.textMuted }]}>{s.description}</Text>
              </View>
              <Feather name={s.icon} size={16} color={t.c.textFaint} />
            </View>
          </Reveal>
        ))}
      </View>
    </View>
  );
}

function CtaButton({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[styles.cta, webTransition(), { backgroundColor: hover ? t.c.accentHover : t.c.accent }]}
    >
      <Text style={styles.ctaText}>{label}</Text>
      <Feather name="arrow-right" size={14} color="#fff" />
    </Pressable>
  );
}

function ItemRow({ item, monoUsage, last }: { item: PlatformItem; monoUsage: boolean; last: boolean }) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[
        styles.itemRow,
        webTransition('background-color'),
        { borderBottomColor: t.c.hairline, borderBottomWidth: last ? 0 : 1 },
        hover && { backgroundColor: t.c.rowHover },
      ]}
    >
      <Feather name={item.icon} size={16} color={hover ? t.c.accent : t.c.textFaint} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.itemTitle, { color: t.c.text }]}>{item.title}</Text>
        <Text style={[styles.itemDesc, { color: t.c.textMuted }]}>{item.description}</Text>
        <Text
          style={[
            styles.itemUsage,
            { color: t.c.textFaint },
            monoUsage && { fontFamily: Platform.OS === 'web' ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'monospace' },
          ]}
        >
          {item.usage}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroWrap: { position: 'relative', overflow: 'hidden', marginBottom: 4 },
  heroGhost: {
    position: 'absolute',
    right: -46,
    top: -40,
    opacity: 0.05,
    ...(Platform.OS === 'web' ? ({ pointerEvents: 'none' } as any) : {}),
  },
  hero: { alignItems: 'flex-start', gap: 14, maxWidth: 640, paddingTop: 6, paddingBottom: 10 },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  heroDesc: { fontSize: 14.5, lineHeight: 22, maxWidth: 560 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 11,
    marginTop: 4,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  list: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemDesc: { fontSize: 12.5, lineHeight: 18 },
  itemUsage: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  steps: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  stepNumCol: { width: 26, alignItems: 'center', alignSelf: 'stretch' },
  stepLine: { width: 2, flex: 1, minHeight: 8 },
  stepNum: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '800' },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepDesc: { fontSize: 12.5, lineHeight: 18, marginTop: 2 },
});
