// Fixed, reusable version of orbiting-skills.tsx (21st.dev) for Lovable sites.
// Changes: items come from props (any icon + label) instead of hard-coded dev logos; the orbit runs on CSS
// animations instead of a React state update every frame; it scales down to fit phones; it is a <section>
// (pages already have a <main>) and its background stays inside it; reduced motion stops it; hover pauses it.
import * as React from "react";
import { cn } from "@/lib/utils";

export interface OrbitItem {
  id: string;
  /** Any icon: a lucide-react icon, an <img> of a logo, an inline SVG. */
  icon: React.ReactNode;
  label: string;
  /** 0 = inner ring, 1 = outer ring. */
  ring: 0 | 1;
}

interface OrbitingItemsProps {
  items: OrbitItem[];
  /** What sits in the middle (a logo, an icon). */
  center?: React.ReactNode;
  /** Seconds per full turn for the inner and outer rings (outer turns the other way). */
  speeds?: [number, number];
  className?: string;
}

// Ring radii as a share of the half-width (the original's 100px and 180px in a 450px box).
const RADII = [100 / 225, 180 / 225];

export function OrbitingItems({ items, center, speeds = [24, 40], className }: OrbitingItemsProps) {
  return (
    <section className={cn("relative isolate flex w-full items-center justify-center overflow-hidden py-12", className)}>
      <div className="group relative aspect-square w-[min(450px,calc(100vw-56px))]">
        {[0, 1].map((ring) => {
          const onRing = items.filter((it) => it.ring === ring);
          const size = `${RADII[ring] * 100}%`;
          const duration = `${speeds[ring]}s`;
          const direction = ring === 1 ? "reverse" : "normal";
          return (
            <div key={ring} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
              {/* the ring itself */}
              <div className="absolute inset-0 rounded-full border border-primary/30 shadow-[0_0_40px_-8px_var(--primary),inset_0_0_30px_-12px_var(--primary)]" />
              {/* the spinning carrier; each item counter-spins so icons stay upright */}
              <div
                className="absolute inset-0 animate-spin group-hover:[animation-play-state:paused] motion-reduce:animate-none"
                style={{ animationDuration: duration, animationDirection: direction, animationTimingFunction: "linear" }}
              >
                {onRing.map((item, i) => (
                  <div key={item.id} className="absolute inset-0" style={{ transform: `rotate(${(360 / onRing.length) * i}deg)` }}>
                    <div className="absolute left-full top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, -50%) rotate(${(-360 / onRing.length) * i}deg)` }}>
                      <div
                        className="animate-spin group-hover:[animation-play-state:paused] motion-reduce:animate-none"
                        style={{ animationDuration: duration, animationDirection: direction === "reverse" ? "normal" : "reverse", animationTimingFunction: "linear" }}
                      >
                        <div className="peer flex size-11 items-center justify-center rounded-full bg-card p-2.5 text-primary shadow-lg ring-1 ring-border transition-transform duration-300 hover:scale-125 sm:size-12">
                          {item.icon}
                        </div>
                        <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity peer-hover:opacity-100">
                          {item.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {center ? (
          <div className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card sm:size-20 text-primary shadow-2xl ring-1 ring-border">
            {center}
          </div>
        ) : null}
        {/* screen readers get a plain list instead of moving icons */}
        <ul className="sr-only">
          {items.map((it) => (
            <li key={it.id}>{it.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default OrbitingItems;
