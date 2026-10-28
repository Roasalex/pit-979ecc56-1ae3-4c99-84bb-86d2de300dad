import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEffect, useState } from "react";
import { Captions } from "./Captions";
import { Callout, Hook, LowerThird } from "./Overlays";
import type { Overlay, ReelProps } from "./types";

const msToFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);

// Punch-in zooms: eases into the zoom over 6 frames and back out at the end of each range.
const useZoom = (overlays: Overlay[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let scale = 1;
  for (const o of overlays) {
    if (o.type !== "zoom") continue;
    const s = msToFrame(o.startMs, fps);
    const e = msToFrame(o.endMs, fps);
    if (frame < s || frame > e) continue;
    const target = o.scale ?? 1.15;
    scale = interpolate(frame, [s, s + 6, e - 6, e], [1, target, target, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return scale;
};

const useBrandFont = (fontFamily: string, fontFile?: string) => {
  const [handle] = useState(() => (fontFile ? delayRender("Loading brand font") : null));
  useEffect(() => {
    if (!fontFile || handle === null) return;
    const face = new FontFace(fontFamily, `url(${staticFile(fontFile)})`);
    face
      .load()
      .then((loaded) => document.fonts.add(loaded))
      .catch((err) => console.error("Brand font failed to load, falling back", err))
      .finally(() => continueRender(handle));
  }, [fontFamily, fontFile, handle]);
};

const ProgressBar: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start" }}>
      <div style={{ height: 10, width: `${(frame / durationInFrames) * 100}%`, background: color }} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC<ReelProps> = ({ video, words, music, musicVolume, overlays, brand }) => {
  const { fps } = useVideoConfig();
  const scale = useZoom(overlays);
  useBrandFont(brand.fontFamily, brand.fontFile);

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.background, fontFamily: `'${brand.fontFamily}', Inter, Helvetica, Arial, sans-serif` }}>
      {video ? (
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
          <OffthreadVideo src={staticFile(video)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      ) : null}

      {overlays.map((o, i) => {
        if (o.type === "zoom") return null;
        const from = msToFrame(o.startMs, fps);
        const duration = Math.max(1, msToFrame(o.endMs, fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            {o.type === "hook" && <Hook text={o.text} brand={brand} />}
            {o.type === "lowerThird" && <LowerThird text={o.text} subtext={o.subtext} brand={brand} />}
            {o.type === "callout" && <Callout text={o.text} position={o.position} brand={brand} />}
            {o.type === "broll" && (
              <AbsoluteFill style={{ backgroundColor: brand.colors.background }}>
                <OffthreadVideo muted src={staticFile(o.src)} style={{ width: "100%", height: "100%", objectFit: o.fit ?? "cover" }} />
              </AbsoluteFill>
            )}
          </Sequence>
        );
      })}

      <Captions words={words} brand={brand} />
      {brand.progressBar && <ProgressBar color={brand.colors.accent} />}
      {music ? <Audio src={staticFile(music)} volume={musicVolume ?? 0.12} loop /> : null}
    </AbsoluteFill>
  );
};
