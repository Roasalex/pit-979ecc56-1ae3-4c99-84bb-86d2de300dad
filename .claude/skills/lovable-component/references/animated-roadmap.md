# Worked example: AnimatedRoadmap (21st.dev "hero-section-5")

A dashed route that draws itself as the visitor scrolls, with milestone pills popping in along it.

## Problems in the pasted version

1. File `hero-section-5.tsx` exports `AnimatedRoadmap` (the comment even says `animated-roadmap.tsx`).
2. `stroke="hsl(var(--primary))"`: invisible on Lovable sites (oklch tokens).
3. Demo `milestonesData` has `status: "complete"` as plain `string`: fails the `"complete" | "in-progress" | "pending"` type.
4. Delay uses `milestone.id * 0.3`: ids of 10+ wait seconds. Use the index.
5. Map image hotlinked from thiings.co. Use the client's image or none.
6. No reduced-motion handling.

## Fixed web version: `src/components/ui/animated-roadmap.tsx`

Needs `framer-motion`. `Button` is already in Lovable projects.

```tsx
import * as React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export type MilestoneStatus = "complete" | "in-progress" | "pending";

export interface Milestone {
  id: number;
  name: string;
  status: MilestoneStatus;
  position: { top?: string; left?: string; right?: string; bottom?: string };
}

interface AnimatedRoadmapProps extends React.HTMLAttributes<HTMLDivElement> {
  milestones: Milestone[];
  /** Optional background image (the client's own asset). */
  mapImageSrc?: string;
  mapImageAlt?: string;
}

const statusClasses: Record<MilestoneStatus, string> = {
  complete: "bg-green-500 border-green-700",
  "in-progress": "bg-primary border-primary animate-pulse",
  pending: "bg-muted border-border",
};

const MilestoneMarker = ({ milestone, index }: { milestone: Milestone; index: number }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.3, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.8 }}
      className="absolute flex items-center gap-4"
      style={milestone.position}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        <div className={cn("absolute h-3 w-3 rounded-full border-2", statusClasses[milestone.status])} />
        <div className="absolute h-full w-full rounded-full bg-primary/10" />
      </div>
      <div className="rounded-full border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm">
        {milestone.name}
      </div>
    </motion.div>
  );
};

export const AnimatedRoadmap = React.forwardRef<HTMLDivElement, AnimatedRoadmapProps>(
  ({ className, milestones, mapImageSrc, mapImageAlt = "", ...props }, ref) => {
    const targetRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => targetRef.current as HTMLDivElement);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start end", "end start"] });
    // Reduced motion: the route is fully drawn from the start.
    const pathLength = useTransform(scrollYProgress, [0.15, 0.7], reduce ? [1, 1] : [0, 1]);

    return (
      <div ref={targetRef} className={cn("relative mx-auto w-full max-w-4xl py-24", className)} {...props}>
        {mapImageSrc ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="absolute inset-0 top-10"
          >
            <img src={mapImageSrc} alt={mapImageAlt} className="h-full w-full object-contain" loading="lazy" />
          </motion.div>
        ) : null}
        <div className="relative h-[400px]">
          <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="none" className="absolute left-0 top-0" aria-hidden="true">
            <motion.path
              d="M 50 350 Q 200 50 400 200 T 750 100"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeDasharray="10 5"
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </svg>
          {milestones.map((m, i) => (
            <MilestoneMarker key={m.id} milestone={m} index={i} />
          ))}
        </div>
      </div>
    );
  },
);
AnimatedRoadmap.displayName = "AnimatedRoadmap";
```

The forwarded `ref` in the original was ignored (it used its own internal ref); `useImperativeHandle` makes it work.

## Using it on a page

```tsx
import { AnimatedRoadmap, type Milestone } from "@/components/ui/animated-roadmap";

const steps: Milestone[] = [
  { id: 1, name: "Free audit", status: "complete", position: { top: "70%", left: "5%" } },
  { id: 2, name: "Launch", status: "complete", position: { top: "15%", left: "20%" } },
  { id: 3, name: "Leads", status: "in-progress", position: { top: "45%", left: "55%" } },
  { id: 4, name: "Scale", status: "pending", position: { top: "10%", right: "10%" } },
];

<AnimatedRoadmap milestones={steps} aria-label="How working with us goes" />
```

Step names must come from the client's real process (their site or the user), not invented. On mobile the absolute
pill positions crowd under ~400px: shorten names or hide the route below `sm`.

## Video version

`src/shared/AnimatedRoadmap.tsx` in the video-editor repo: same route, drawn over `drawFrames` from `startFrame`,
milestones placed on the line by `at` (0-1) and popping in as the line reaches them. Sample: composition
`RoadmapSample`.
