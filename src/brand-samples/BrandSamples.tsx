// Sample frames for reviewing a brand sheet before its first edit: one panel per 30 frames.
// Render: npx remotion render src/index.ts BrandSamples-<Brand> "$TMPDIR/s" --sequence --frames=0-119
// Copy is taken from the brand's own past reels, never invented.
import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { BBCaption, EndCard as BBEnd, NoteCard, RedTags, StatementPanel } from "../../brand/bull-and-built/theme";
import { BigCaps, DRCaption, EndCard as DREnd, GlassCard, GoldWord } from "../../brand/daisy-rodriguez/theme";

const Panel: React.FC<{ i: number; children: React.ReactNode }> = ({ i, children }) => (
  <Sequence from={i * 30} durationInFrames={30}>{children}</Sequence>
);
// Plates are frames from the brand's own reels with their old graphics removed (B&B: delogo on the hook;
// Daisy: softened, since every frame of her reel carries a graphic).
const Footage: React.FC<{ src: string }> = ({ src }) => (
  <Img src={staticFile(`images/brand-samples/${src}`)} style={{ width: 1080, height: 1920, objectFit: "cover" }} />
);

export const BullAndBuiltSamples: React.FC = () => (
  <AbsoluteFill style={{ background: "black" }}>
    <Panel i={0}>
      <Footage src="bb-talking.png" />
      <RedTags lines={["one of these", "3 things"]} top={240} />
      <BBCaption words={["your", "main", "category", "should"]} emphasis={[1]} y={1215} />
    </Panel>
    <Panel i={1}>
      <Footage src="bb-talking.png" />
      <NoteCard label="01 · YOUR CATEGORY" lines={[{ text: "Contractor", mark: "cross" }, { text: "Concrete contractor", mark: "tick" }]} x={160} y={200} />
      <BBCaption words={["concrete", "contractor,", "not", "just", "contractor."]} emphasis={[0]} y={1215} />
    </Panel>
    <Panel i={2}>
      <StatementPanel lead="I know." lines={[{ bold: "The hard part", light: "isn't" }, { light: "the work." }, { light: "It's getting" }, { bold: "the phone" }]} />
    </Panel>
    <Panel i={3}>
      <BBEnd cta={'Comment "SITE"'} />
    </Panel>
  </AbsoluteFill>
);

export const DaisySamples: React.FC = () => (
  <AbsoluteFill style={{ background: "black" }}>
    <Panel i={0}>
      <Footage src="daisy-talking.png" />
      <GlassCard label="ADVERTISED" word="rate" footnote="*terms apply" x={110} y={280} />
      <DRCaption words={["isn't", "the", "rate", "you'll", "get."]} emphasis={[0]} y={1415} />
    </Panel>
    <Panel i={1}>
      <Footage src="daisy-talking.png" />
      <BigCaps lines={["HERE'S", "WHY"]} y={420} />
      <DRCaption words={["here's", "why"]} y={1415} />
    </Panel>
    <Panel i={2}>
      <Footage src="daisy-talking.png" />
      <GoldWord text="stop." y={560} />
      <DRCaption words={["stop", "Googling", "your", "interest", "rate"]} emphasis={[0]} y={1415} />
    </Panel>
    <Panel i={3}>
      <DREnd cta={'DM me "RATE"'} />
    </Panel>
  </AbsoluteFill>
);
