// Shape of work/<project>/plan.json. Claude writes this file; render.mjs passes it in as props.

export type Word = { text: string; startMs: number; endMs: number };

export type Overlay =
  | { type: "hook"; startMs: number; endMs: number; text: string }
  | { type: "lowerThird"; startMs: number; endMs: number; text: string; subtext?: string }
  | { type: "callout"; startMs: number; endMs: number; text: string; position?: "top" | "middle" }
  | { type: "zoom"; startMs: number; endMs: number; scale?: number }
  | { type: "broll"; startMs: number; endMs: number; src: string; fit?: "cover" | "contain" };

export type Brand = {
  name: string;
  colors: { primary: string; accent: string; text: string; background: string };
  fontFamily: string;
  fontFile?: string;
  captions: {
    wordsPerPage: number;
    fontSize: number;
    fontWeight: number;
    uppercase: boolean;
    activeColor: string;
    color: string;
    strokeColor: string;
    position: "lower" | "middle";
  };
  progressBar: boolean;
};

export type ReelProps = {
  video: string;
  durationMs: number;
  words: Word[];
  music?: string;
  musicVolume?: number;
  overlays: Overlay[];
  brand: Brand;
};
