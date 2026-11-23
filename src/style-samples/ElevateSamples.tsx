// Sample frames for approving the Elevate brand sheet (brand/elevate/BRAND.md): caption over a cartoon scene, a proof
// card (a number published on elevate-mk-tg.com) and a pricing card (from the ad script). One panel per 30 frames.
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { EL, EL_FONT } from "../../brand/elevate/theme";

const Scene: React.FC<{ src: string; pos?: string }> = ({ src, pos = "center" }) => (
  <AbsoluteFill style={{ background: EL.ink }}>
    {/* 4:5 art in a 9:16 frame: a blurred copy fills the frame, the art sits full width */}
    <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(40px) brightness(0.55)", transform: "scale(1.15)" }} />
    <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 285, width: 1080, height: 1350, objectFit: "cover", objectPosition: pos }} />
  </AbsoluteFill>
);

const Caption: React.FC<{ words: string[]; red?: number[]; y?: number }> = ({ words, red = [], y = 1400 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <text x={540} y={y} textAnchor="middle" fontFamily={EL_FONT} fontWeight={800} fontSize={86} letterSpacing={-2} stroke="#000" strokeWidth={12} style={{ paintOrder: "stroke" }}>
      {words.map((w, i) => (
        <tspan key={i} fill={red.includes(i) ? EL.red : "#fff"}>{w}{i < words.length - 1 ? " " : ""}</tspan>
      ))}
    </text>
  </svg>
);

const Card: React.FC<{ kicker: string; big: string; small: string; foot?: string }> = ({ kicker, big, small, foot }) => (
  <div style={{ position: "absolute", left: 90, right: 90, top: 640, background: EL.card, borderTop: `6px solid ${EL.red}`, borderRadius: 18,
    padding: "56px 60px", fontFamily: EL_FONT, color: EL.paper, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
    <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: EL.grey }}>{kicker}</div>
    <div style={{ fontWeight: 800, fontSize: 150, letterSpacing: -6, lineHeight: 1, marginTop: 24 }}>{big}</div>
    <div style={{ fontWeight: 500, fontSize: 46, marginTop: 18, lineHeight: 1.25 }}>{small}</div>
    {foot ? <div style={{ fontWeight: 500, fontSize: 28, marginTop: 30, color: EL.grey }}>{foot}</div> : null}
  </div>
);

export const ElevateSamples: React.FC = () => (
  <AbsoluteFill style={{ background: EL.ink }}>
    <Sequence from={0} durationInFrames={30}>
      <Scene src="images/elevate-vsl/scene-2.webp" pos="30% center" />
      <Caption words={["give", "me", "two", "minutes"]} red={[2, 3]} />
    </Sequence>
    <Sequence from={30} durationInFrames={30}>
      <Scene src="images/elevate-vsl/scene-1.webp" />
      <Card kicker="Precision Tintz · Aurora, CO" big="75" small="booked jobs in 60 days" foot="as published on elevate-mk-tg.com" />
    </Sequence>
    <Sequence from={60} durationInFrames={30}>
      <AbsoluteFill style={{ background: EL.ink }} />
      <Card kicker="Plan 1 · Leads" big="$900/mo" small="+ $600 setup · month to month · you answer your own leads" />
    </Sequence>
  </AbsoluteFill>
);
