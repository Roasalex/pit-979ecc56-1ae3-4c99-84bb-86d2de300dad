"use client";

// Fixed, reusable version of 3d-testimonails.tsx (21st.dev) + its demo, for Lovable client sites.
// REAL REVIEWS ONLY: pass the client's actual reviews (e.g. from their Google Business Profile), with the reviewer's
// name as shown there. Never invented ones (FTC rule on fake reviews, 2024).
// Changes from the paste: reviews via props, with star rating and source; each review is in the page once for screen
// readers (the scrolling copies are aria-hidden; the paste put every review in the page 12 times and read it 12 times);
// edge fades sit outside the 3D tilt so they line up with the box; no keyboard tab stops on the moving columns;
// reduced motion stops it; the loop's extra copies are only added after load (server HTML: the list plus one copy
// per column, 5 with 4 columns, instead of 12).
// Needs the marquee keyframes (see 3d-testimonials.md) in src/styles.css, and lucide-react (in every Lovable project).
import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Review {
  name: string;
  body: string;
  /** 1-5 */
  rating?: number;
  /** Where it was left: "Google", "Facebook", "Yelp"... */
  source?: string;
  /** e.g. "March 2026" */
  date?: string;
  /** Reviewer photo, if the source shows one */
  img?: string;
}

interface TestimonialsWallProps {
  reviews: Review[];
  /** Visible heading for the section (also its accessible name). */
  title?: string;
  columns?: number;
  /** Seconds for one column to scroll through once. */
  duration?: number;
  /** Tilt the wall in 3D (the paste's look). */
  tilt?: boolean;
  className?: string;
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <figure className="bg-card text-card-foreground w-56 rounded-lg border p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        {r.img ? (
          <img src={r.img} alt="" className="size-9 rounded-full object-cover" loading="lazy" />
        ) : (
          <span className="bg-muted grid size-9 place-items-center rounded-full text-sm font-medium">{r.name[0]}</span>
        )}
        <div className="min-w-0">
          <figcaption className="truncate text-sm font-medium">{r.name}</figcaption>
          {r.source || r.date ? (
            <p className="text-muted-foreground text-xs">{[r.source, r.date].filter(Boolean).join(" · ")}</p>
          ) : null}
        </div>
      </div>
      {r.rating ? (
        <div className="mt-2 flex gap-0.5 text-amber-500">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={cn("size-3.5", i < r.rating! ? "fill-current" : "opacity-30")} />
          ))}
        </div>
      ) : null}
      <blockquote className="text-muted-foreground mt-2 text-sm leading-snug">{r.body}</blockquote>
    </figure>
  );
}

function Column({ reviews, reverse, duration, copies }: { reviews: Review[]; reverse: boolean; duration: number; copies: number }) {
  return (
    <div className="group flex flex-col gap-4 overflow-hidden p-2 [--gap:1rem]" style={{ ["--duration" as string]: `${duration}s` }}>
      {Array.from({ length: copies }, (_, c) => (
        <div
          key={c}
          aria-hidden
          className={cn(
            "animate-marquee-vertical flex shrink-0 flex-col gap-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none",
            reverse && "[animation-direction:reverse]",
          )}
        >
          {reviews.map((r, i) => (
            <ReviewCard key={i} r={r} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TestimonialsWall({ reviews, title, columns = 4, duration = 40, tilt = true, className }: TestimonialsWallProps) {
  // One copy in the server HTML; the extra copies the loop needs are added after load.
  const [copies, setCopies] = React.useState(1);
  React.useEffect(() => setCopies(3), []);
  // Spread the reviews across the columns so neighbouring columns don't show the same card side by side.
  const cols = Array.from({ length: columns }, (_, c) => reviews.map((_, i) => reviews[(i + c * 2) % reviews.length]));

  return (
    <section aria-label={title ?? "Reviews"} className={cn("relative w-full", className)}>
      {title ? <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">{title}</h2> : null}
      {/* what screen readers and search engines get: each review once */}
      <ul className="sr-only">
        {reviews.map((r, i) => (
          <li key={i}>
            {r.rating ? `${r.rating} out of 5 stars. ` : ""}
            {r.body} {r.name}
            {r.source ? `, ${r.source}` : ""}
          </li>
        ))}
      </ul>
      <div className="relative mx-auto flex h-96 w-full max-w-[800px] items-center justify-center overflow-hidden rounded-lg border [perspective:300px]">
        <div
          className="flex flex-row items-center gap-4"
          style={tilt ? { transform: "translateX(-100px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)" } : undefined}
        >
          {cols.map((col, i) => (
            <Column key={i} reviews={col} reverse={i % 2 === 1} duration={duration} copies={copies} />
          ))}
        </div>
        {/* fades on the box itself, not inside the tilted wall; z-10 because the tilted wall makes its own layer */}
        <div className="from-background pointer-events-none absolute z-10 inset-x-0 top-0 h-1/4 bg-gradient-to-b" />
        <div className="from-background pointer-events-none absolute z-10 inset-x-0 bottom-0 h-1/4 bg-gradient-to-t" />
        <div className="from-background pointer-events-none absolute z-10 inset-y-0 left-0 w-1/4 bg-gradient-to-r" />
        <div className="from-background pointer-events-none absolute z-10 inset-y-0 right-0 w-1/4 bg-gradient-to-l" />
      </div>
    </section>
  );
}

export default TestimonialsWall;
