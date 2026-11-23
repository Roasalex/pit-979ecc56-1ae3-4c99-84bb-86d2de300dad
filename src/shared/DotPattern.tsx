// prompts/components/dot-pattern-1.tsx for video: the same SVG pattern, typed, with a colour prop instead of
// Tailwind fill classes. Fills its nearest positioned parent.
import React, { useId } from "react";

export const DotPattern: React.FC<{
  gap?: number;
  dot?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ gap = 14, dot = 1.3, color = "rgba(100,116,139,0.6)", style }) => {
  const id = useId();
  return (
    <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", ...style }}>
      <defs>
        <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={gap / 2} cy={gap / 2} r={dot} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};
