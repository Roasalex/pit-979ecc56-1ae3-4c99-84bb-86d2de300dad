"use client";

// Fixed version of count-up.tsx (21st.dev). Same props and effects, but:
// - `duration` is a real duration: it eases from `from` to `to` and lands exactly on `to` (the original's spring took
//   ~11s to settle a 7-digit number, leaving half-rolled digits on screen);
// - the slide (odometer) effect handles decimals (the original showed 99.9 as "10.0");
// - it counts from `from` to `to` (count down with from={5} to={0}); `direction` is kept only for compatibility;
// - the final number is in the HTML for search engines and screen readers; the animated digits are aria-hidden;
// - reduced motion shows the final number straight away.
import * as React from "react";
import { animate, AnimatePresence, motion, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import useMeasure from "react-use-measure";

import { cn } from "@/lib/utils";

type DigitEffect = "none" | "fade" | "blur" | "slide";

interface CountUpProps {
  to: number;
  from?: number;
  /** Deprecated: the count always runs from `from` to `to`. "down" swaps them, as the original did. */
  direction?: "up" | "down";
  delay?: number;
  /** Seconds from start to landing exactly on the final number. */
  duration?: number;
  digitEffect?: DigitEffect;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  /** Text after the number, e.g. "+" or "%" (kept out of the animation, included in the accessible text). */
  suffix?: string;
  prefix?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

const decimalsOf = (n: number) => {
  const s = n.toString();
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
};

function OdometerDigit({ value, place }: { value: MotionValue<number>; place: number }) {
  const [ref, { height }] = useMeasure();
  // `value` is the number scaled to an integer (99.9 -> 999), so every place is a whole power of ten.
  // Like a real odometer, a digit only turns while everything below it rolls from 9 to 0; otherwise 999 would show
  // its hundreds digit 99% of the way to the next number.
  const y = useTransform(value, (v) => {
    if (!height) return 0;
    const a = Math.abs(v);
    const below = a % place;
    const turning = place === 1 ? below : Math.max(0, below - (place - 1));
    return -((Math.floor(a / place) % 10) + turning) * height;
  });
  return (
    <span aria-hidden style={{ position: "relative", display: "inline-block", width: "1ch", overflowY: "clip", lineHeight: 1 }}>
      <span ref={ref} style={{ visibility: "hidden", display: "block" }}>0</span>
      <motion.span style={{ y, position: "absolute", inset: "0 0 auto 0", display: "flex", flexDirection: "column" }}>
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: height || "1em" }}>
            {i % 10}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

const CHAR_VARIANTS = {
  fade: { initial: () => ({ opacity: 0, scale: 0.7 }), animate: { opacity: 1, scale: 1 }, duration: 0.14, overflow: "hidden" as const },
  blur: {
    initial: (up: boolean) => ({ opacity: 0, filter: "blur(8px)", y: up ? -8 : 8 }),
    animate: { opacity: 1, filter: "blur(0px)", y: 0 },
    duration: 0.18,
    overflow: "visible" as const,
  },
};

function CountUp({
  to: toProp,
  from: fromProp = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  digitEffect = "none",
  className,
  startWhen = true,
  separator = "",
  suffix = "",
  prefix = "",
  onStart,
  onEnd,
}: CountUpProps) {
  const [from, to] = direction === "down" ? [toProp, fromProp] : [fromProp, toProp];
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true });
  const decimals = Math.max(decimalsOf(from), decimalsOf(to));
  const value = useMotionValue(reduced ? to : from);
  const scaled = useTransform(value, (v) => Math.round(v * 10 ** decimals * 1000) / 1000);

  const format = React.useCallback(
    (n: number) => {
      const s = new Intl.NumberFormat("en-US", {
        useGrouping: !!separator,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(n);
      return separator ? s.replace(/,/g, separator) : s;
    },
    [decimals, separator],
  );

  const [text, setText] = React.useState(() => format(reduced ? to : from));
  React.useEffect(() => value.on("change", (v) => setText(format(v))), [value, format]);

  const cb = React.useRef({ onStart, onEnd });
  cb.current = { onStart, onEnd };
  React.useEffect(() => {
    if (!inView || !startWhen) return;
    if (reduced) {
      value.set(to);
      cb.current.onEnd?.();
      return;
    }
    cb.current.onStart?.();
    const controls = animate(value, to, { duration, delay, ease: [0.16, 1, 0.3, 1], onComplete: () => cb.current.onEnd?.() });
    return () => controls.stop();
  }, [inView, startWhen, reduced, to, duration, delay, value]);

  const finalText = prefix + format(to) + suffix;
  const up = to >= from;

  let visual: React.ReactNode;
  if (digitEffect === "slide") {
    const target = format(Math.max(Math.abs(from), Math.abs(to)));
    const digitCount = target.replace(/\D/g, "").length;
    let d = 0;
    visual = [...target].map((ch, i) => {
      if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
      const place = 10 ** (digitCount - 1 - d++);
      return <OdometerDigit key={i} value={scaled} place={place} />;
    });
  } else if (digitEffect === "none") {
    visual = text;
  } else {
    const v = CHAR_VARIANTS[digitEffect];
    visual = [...text].map((ch, i) =>
      /\d/.test(ch) ? (
        <span key={i} style={{ position: "relative", display: "inline-block", overflow: v.overflow }}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={`${i}-${ch}`} initial={v.initial(up)} animate={v.animate} transition={{ duration: v.duration, ease: "easeOut" }} style={{ display: "inline-block" }}>
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : (
        <span key={i} style={{ display: "inline-block" }}>{ch}</span>
      ),
    );
  }

  return (
    <span ref={ref} className={cn("inline-flex items-center", className)} style={{ fontVariantNumeric: "tabular-nums" }}>
      {/* what search engines, screen readers and copy-paste get: the final number */}
      <span className="sr-only">{finalText}</span>
      <span aria-hidden className="inline-flex items-center">
        {prefix}
        {visual}
        {suffix}
      </span>
    </span>
  );
}

export { CountUp, type CountUpProps, type DigitEffect };

export default CountUp;
