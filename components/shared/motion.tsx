import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, ViewProps } from 'react-native';

/**
 * Shared micro-interaction helpers so hover / reveal / count-up behaviour
 * stays consistent across the site. Web-only niceties degrade to no-ops
 * on native.
 */

const isWeb = Platform.OS === 'web';

/**
 * Drop into a style array to get smooth CSS transitions on web.
 * NOTE: `box-shadow` is deliberately NOT in the default set — transitioning it
 * on containers causes a one-off "shadow sweep" whenever the element re-renders
 * (e.g. a child's hover state changes). Pass it explicitly only on small
 * elements that truly need an animated shadow.
 */
export const webTransition = (
  properties = 'transform, background-color, border-color, color, opacity',
  duration = 200,
) =>
  isWeb
    ? ({
        transitionProperty: properties,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      } as any)
    : null;

/**
 * Animates a number from 0 -> target once, using rAF easing.
 * Returns the current value (already rounded to `decimals`).
 */
export function useCountUp(target: number, { duration = 1100, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!isWeb || !Number.isFinite(target) || target === 0) {
      setValue(target || 0);
      return;
    }
    startedAt.current = null;
    const factor = Math.pow(10, decimals);
    const tick = (now: number) => {
      if (startedAt.current == null) startedAt.current = now;
      const t = Math.min(1, (now - startedAt.current) / duration);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(target * eased * factor) / factor);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, decimals]);

  return value;
}

type RevealProps = ViewProps & {
  /** Stagger delay in ms before the element eases in. */
  delay?: number;
  /** Distance in px the element travels up as it appears. */
  offset?: number;
  children: React.ReactNode;
};

/**
 * Fades + lifts its children into view the first time they enter the
 * viewport. On native it just renders the children.
 */
export function Reveal({ delay = 0, offset = 22, style, children, ...rest }: RevealProps) {
  const ref = useRef<any>(null);
  const [shown, setShown] = useState(!isWeb);

  useEffect(() => {
    if (!isWeb) return;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <View
      ref={ref}
      style={[
        {
          opacity: shown ? 1 : 0,
          transform: [{ translateY: shown ? 0 : offset }],
        },
        isWeb
          ? ({
              transitionProperty: 'opacity, transform',
              transitionDuration: '640ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: `${delay}ms`,
              willChange: 'opacity, transform',
            } as any)
          : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
