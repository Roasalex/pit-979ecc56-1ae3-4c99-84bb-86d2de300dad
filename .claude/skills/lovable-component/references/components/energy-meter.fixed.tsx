"use client";

// Fixed version of energy-meter.tsx (21st.dev). Changes, each seen in a browser first:
// - The % counter's animation was never cancelled: when `value` changed mid-animation (82 -> 20) the old loop kept
//   writing, and the meter ended up showing "82%" with 2 of 10 segments lit. Both animations now cancel and restart.
// - Screen readers got loose text ("Reactor Output 82%", or nothing without showValue). Now role="meter" with
//   aria-valuenow/min/max and the label as its name.
// - It fills when it scrolls into view (it used to finish on page load, before anyone saw it).
// - Reduced motion: no stagger, no counting, no pulse.
// - DON'T add the prompt's CSS snippet: it replaces the site's whole colour theme. This component needs no extra CSS.
import * as React from "react";
import { cn } from "@/lib/utils";

interface EnergyMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  segments?: number;
  label?: string;
  orientation?: "horizontal" | "vertical";
  showValue?: boolean;
}

function getVariant(value: number) {
  if (value < 30) return "critical";
  if (value <= 60) return "warning";
  return "primary";
}

const variantColors = {
  primary: {
    filled: "bg-primary shadow-[0_0_8px_var(--primary)]",
    text: "text-primary",
  },
  warning: {
    filled: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    text: "text-amber-500",
  },
  critical: {
    filled: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    text: "text-red-500",
  },
};

export function EnergyMeter({
  value,
  segments = 10,
  label,
  orientation = "horizontal",
  showValue = false,
  className,
  ...props
}: EnergyMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const filledCount = Math.round((clamped / 100) * segments);
  const variant = getVariant(clamped);
  const colors = variantColors[variant];
  const isVertical = orientation === "vertical";

  const rootRef = React.useRef<HTMLDivElement>(null);
  const [seen, setSeen] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Staggered segment fill animation
  const [visibleCount, setVisibleCount] = React.useState(0);

  React.useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setVisibleCount(filledCount);
      return;
    }
    if (filledCount === 0) {
      setVisibleCount(0);
      return;
    }
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= filledCount) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [filledCount, seen, reduced]);

  // Animate counter
  const [displayPercent, setDisplayPercent] = React.useState(0);
  React.useEffect(() => {
    if (!seen) return;
    if (reduced) {
      setDisplayPercent(clamped);
      return;
    }
    const duration = filledCount * 60 + 100;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercent(Math.round(clamped * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped, filledCount, seen, reduced]);

  return (
    <div
      ref={rootRef}
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      data-slot="tron-energy-meter"
      className={cn(
        "relative overflow-hidden rounded border border-primary/30 bg-card/80 p-3 backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]" />

      {/* Label + Value header */}
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <span aria-hidden className="text-[10px] uppercase tracking-widest text-foreground/80">
              {label}
            </span>
          )}
          {showValue && (
            <span
              aria-hidden
              className={cn(
                "font-mono text-sm font-bold tabular-nums",
                colors.text,
              )}
            >
              {displayPercent}%
            </span>
          )}
        </div>
      )}

      {/* Segments */}
      <div
        className={cn(
          "flex gap-1",
          isVertical && "flex-col-reverse items-center",
        )}
      >
        {Array.from({ length: segments }, (_, i) => {
          const isFilled = i < visibleCount;
          const isLast = i === visibleCount - 1;
          return (
            <div
              key={i}
              className={cn(
                "rounded-sm transition-all",
                isVertical ? "h-2 w-full" : "h-6 flex-1",
                isFilled
                  ? cn(colors.filled, "duration-150")
                  : "bg-foreground/10 duration-300",
                isFilled && variant === "critical" && "animate-pulse motion-reduce:animate-none",
                isLast && "scale-y-110",
              )}
            />
          );
        })}
      </div>

      {/* Corner decorations */}
      <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-primary/50" />
      <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-primary/50" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-primary/50" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-primary/50" />
    </div>
  );
}

export default EnergyMeter;
