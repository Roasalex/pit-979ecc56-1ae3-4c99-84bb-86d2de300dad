// Sample of QuoteFrame with the dot-pattern demo's own placeholder quote. In an edit, each word's `at` is the frame
// the creator says it (from the transcript), and the quote is something they actually said.
import { AbsoluteFill } from "remotion";
import { QuoteFrame, type QuoteWord } from "../shared/QuoteFrame";

const raw: [string, boolean, boolean?][] = [
  ['"Design', true], ["should", true], ["be", true], ["easy", false, true], ["to", false],
  ["understand", false, true], ["because", true, true], ["simple", false, true], ["ideas", false],
  ["are", true, true], ["quicker", true], ["to", true], ['grasp..."', true, true],
];
const WORDS: QuoteWord[] = raw.map(([text, bold, br], i) => ({ text, bold, br, at: 14 + i * 6 }));

export const QuoteFrameSample: React.FC = () => (
  <AbsoluteFill style={{ background: "#F4F4F5" }}>
    <QuoteFrame kicker="I believe" words={WORDS} startFrame={2} />
  </AbsoluteFill>
);
