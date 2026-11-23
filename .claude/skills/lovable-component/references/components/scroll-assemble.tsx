"use client";

// Fixed, reusable version of text-scroll-animation.tsx (21st.dev "Skiper31") for Lovable sites.
// The letters (or icons) start spread out and tilted and fly together as the section scrolls into place.
// Changes: your own text or images via props; no Lenis (the original took over the whole page's scrolling);
// one contained <section> (sticky stage, ~1.6 screens of scroll instead of ~4.4); the hint stays inside it;
// screen readers and search engines get the plain text; reduced motion shows it assembled.
import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "tilt" | "rise" | "spin";

interface ScrollAssembleProps {
  /** Text that assembles letter by letter. */
  text?: string;
  /** Or images (logos, icons) that assemble: the client's own files, with alt text. */
  images?: { src: string; alt: string }[];
  /** Line above the images (or the text). */
  caption?: string;
  variant?: Variant;
  /** Section height; the extra over 100svh is how much scrolling the animation takes. */
  height?: string;
  hint?: string;
  className?: string;
  textClassName?: string;
}

function Piece({ i, center, progress, variant, children }: { i: number; center: number; progress: MotionValue<number>; variant: Variant; children: React.ReactNode }) {
  const d = i - center;
  const spread = variant === "spin" ? 90 : 50;
  const x = useTransform(progress, [0, 1], [d * spread, 0]);
  const rotateX = useTransform(progress, [0, 1], [variant === "tilt" ? d * 50 : 0, 0]);
  const rotate = useTransform(progress, [0, 1], [variant === "spin" ? d * 50 : 0, 0]);
  const y = useTransform(progress, [0, 1], [variant === "rise" ? Math.abs(d) * 50 : variant === "spin" ? -Math.abs(d) * 20 : 0, 0]);
  const scale = useTransform(progress, [0, 1], [variant === "tilt" ? 1 : 0.75, 1]);
  return (
    <motion.span aria-hidden className="inline-block will-change-transform" style={{ x, y, rotateX, rotate, scale }}>
      {children}
    </motion.span>
  );
}

export function ScrollAssemble({
  text,
  images,
  caption,
  variant = "tilt",
  height = "160svh",
  hint,
  className,
  textClassName,
}: ScrollAssembleProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  // assembled by the time the stage is pinned; reduced motion: already assembled
  const progress = useTransform(scrollYProgress, [0.25, 0.85], reduced ? [1, 1] : [0, 1], { clamp: true });
  const hintOpacity = useTransform(scrollYProgress, [0.2, 0.4], [1, 0]);

  // Words wrap as units (letters never split across lines on phones); spaces stay real, breakable spaces.
  const words = text ? text.split(" ") : [];
  const total = text ? text.length : 0;
  return (
    <section ref={ref} className={cn("relative isolate", className)} style={{ height }}>
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-8 overflow-hidden px-4">
        {caption ? <p className="text-center text-xl font-medium tracking-tight md:text-2xl">{caption}</p> : null}
        {text ? (
          <p className={cn("text-center text-5xl font-bold uppercase tracking-tighter md:text-7xl", textClassName)} style={{ perspective: "500px" }}>
            <span className="sr-only">{text}</span>
            {words.map((word, w) => {
              const offset = words.slice(0, w).reduce((n, x) => n + x.length + 1, 0);
              return (
                <React.Fragment key={w}>
                  {w > 0 ? " " : null}
                  <span aria-hidden className="inline-block whitespace-nowrap">
                    {[...word].map((c, i) => (
                      <Piece key={i} i={offset + i} center={Math.floor(total / 2)} progress={progress} variant={variant}>
                        {c}
                      </Piece>
                    ))}
                  </span>
                </React.Fragment>
              );
            })}
          </p>
        ) : null}
        {images?.length ? (
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8" style={{ perspective: "500px" }}>
            {images.map((img, i) => (
              <Piece key={img.src} i={i} center={Math.floor(images.length / 2)} progress={progress} variant={variant === "tilt" ? "rise" : variant}>
                <img src={img.src} alt={img.alt} className="size-12 object-contain md:size-16" loading="lazy" />
              </Piece>
            ))}
          </div>
        ) : null}
        {hint ? (
          <motion.span aria-hidden className="absolute bottom-8 text-xs uppercase tracking-widest opacity-40" style={{ opacity: hintOpacity }}>
            {hint}
          </motion.span>
        ) : null}
      </div>
    </section>
  );
}

export default ScrollAssemble;
