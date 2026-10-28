// Word-level transcript of a take with whisper.cpp.
//   node scripts/transcribe.mjs public/recordings/name.mp4 [public/recordings/name.words.json]
// Writes [{ text, startMs, endMs }]. Don't re-run on an unchanged file: whisper jitters between
// runs and every beat anchored to a word would drift (see the remotion-reel skill).
// Env: WHISPER_MODEL (default bin/whisper.cpp/models/ggml-base.en.bin), WHISPER_LANG (default en).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [input, outArg] = process.argv.slice(2);
if (!input) {
  console.error("Usage: node scripts/transcribe.mjs <video.mp4> [out.words.json]");
  process.exit(1);
}
const out = outArg ?? input.replace(/\.[^.]+$/, "") + ".words.json";
const whisper = process.env.WHISPER_CLI ?? path.join(root, "bin/whisper.cpp/build/bin/whisper-cli");
const model = process.env.WHISPER_MODEL ?? path.join(root, "bin/whisper.cpp/models/ggml-base.en.bin");
for (const f of [whisper, model]) {
  if (!fs.existsSync(f)) {
    console.error(`Missing ${path.relative(root, f)}. Run scripts/setup.sh first.`);
    process.exit(1);
  }
}

// DTW token timestamps are noticeably tighter than the default; the preset name comes from the model file.
const dtw = path.basename(model).match(/^ggml-(tiny|base|small|medium|large-v[123](?:-turbo)?)(\.en)?\.bin$/);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "transcribe-"));
const wav = path.join(tmp, "audio.wav");
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", input, "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
execFileSync(
  whisper,
  ["-m", model, "-f", wav, "-l", process.env.WHISPER_LANG ?? "en", "-ml", "1", "-sow", "-oj", "-of", path.join(tmp, "out"), "-np",
    ...(dtw ? ["-dtw", dtw[1] + (dtw[2] ?? "")] : [])],
  { stdio: ["ignore", "ignore", "inherit"] },
);

const segments = JSON.parse(fs.readFileSync(path.join(tmp, "out.json"), "utf8")).transcription;
const words = [];
for (const s of segments) {
  const text = s.text.trim();
  if (!text || /^\[.*\]$/.test(text)) continue; // [BLANK_AUDIO], [Music]
  // Standalone punctuation joins the previous word instead of becoming a caption word.
  if (!/[\p{L}\p{N}]/u.test(text)) {
    if (words.length) words[words.length - 1].text += text;
    continue;
  }
  words.push({ text, startMs: s.offsets.from, endMs: Math.max(s.offsets.to, s.offsets.from + 1) });
}
fs.writeFileSync(out, JSON.stringify(words, null, 1));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${words.length} words -> ${out}`);
