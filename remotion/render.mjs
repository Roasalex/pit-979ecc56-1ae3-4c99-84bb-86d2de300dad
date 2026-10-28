// Usage: node render.mjs <path/to/plan.json> [out.mp4]
//        node render.mjs <path/to/plan.json> --storyboard   (stills + storyboard.html next to plan.json, no video)
// Paths inside plan.json (video, captions, music, broll src, brand fontFile) are relative to the repo root.
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const args = process.argv.slice(2);
const storyboard = args.includes("--storyboard");
const [planArg, outArg] = args.filter((a) => a !== "--storyboard");
if (!planArg) {
  console.error("Usage: node render.mjs <plan.json> [out.mp4]");
  process.exit(1);
}

const planPath = path.resolve(process.cwd(), planArg);
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const brand = JSON.parse(fs.readFileSync(path.join(root, plan.brand ?? "brand/brand.json"), "utf8"));
const words = plan.words ?? (plan.captions ? JSON.parse(fs.readFileSync(path.join(root, plan.captions), "utf8")) : []);

// Stage only the files this render needs into a temp public dir, so the bundle never copies raw-footage/.
// Hard links when possible (same disk, no extra space); the bundler doesn't follow symlinks.
fs.mkdirSync(path.join(root, "work"), { recursive: true });
const publicDir = fs.mkdtempSync(path.join(root, "work", ".render-public-"));
const stage = (rel) => {
  if (!rel) return undefined;
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) throw new Error(`Missing file referenced in plan: ${rel}`);
  const name = `${fs.readdirSync(publicDir).length}-${path.basename(rel)}`;
  try {
    fs.linkSync(abs, path.join(publicDir, name));
  } catch {
    fs.copyFileSync(abs, path.join(publicDir, name));
  }
  return name;
};

const probeMs = (rel) =>
  Math.round(
    parseFloat(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(root, rel)]).toString(),
    ) * 1000,
  );

const inputProps = {
  video: stage(plan.video),
  durationMs: plan.durationMs ?? probeMs(plan.video),
  words,
  music: stage(plan.music),
  musicVolume: plan.musicVolume,
  overlays: (plan.overlays ?? []).map((o) => (o.type === "broll" ? { ...o, src: stage(o.src) } : o)),
  brand: { ...brand, fontFile: stage(brand.fontFile) },
};

const msToClock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 100))}`;
const escapeHtml = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// One beat per overlay start (+ a frame just inside it so the animation has landed), plus one every 3s to fill gaps.
const storyboardBeats = (props) => {
  const times = new Set();
  for (const o of props.overlays) times.add(Math.min(o.startMs + 400, o.endMs - 1));
  for (let t = 0; t < props.durationMs; t += 3000) times.add(t + 200);
  return [...times].filter((t) => t < props.durationMs).sort((a, b) => a - b);
};

const renderStoryboard = async (serveUrl, composition) => {
  const dir = path.join(path.dirname(planPath), "storyboard");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const rows = [];
  for (const t of storyboardBeats(inputProps)) {
    const frame = Math.min(composition.durationInFrames - 1, Math.round((t / 1000) * composition.fps));
    const file = `beat-${String(frame).padStart(5, "0")}.jpg`;
    await renderStill({ composition, serveUrl, inputProps, browserExecutable, frame, output: path.join(dir, file), imageFormat: "jpeg", scale: 0.4 });
    const said = inputProps.words.filter((w) => w.startMs <= t + 1500 && w.endMs >= t - 1500).map((w) => w.text).join(" ");
    const active = inputProps.overlays.filter((o) => o.startMs <= t && o.endMs > t).map((o) => `${o.type}${o.text ? `: ${o.text}` : ""}`);
    rows.push({ t, file, said, active });
    process.stdout.write(`\rStill ${rows.length}`);
  }
  const html = `<!doctype html><meta charset="utf-8"><title>Storyboard - ${escapeHtml(path.basename(path.dirname(planPath)))}</title>
<style>body{font:15px/1.4 system-ui,sans-serif;background:#111;color:#eee;margin:24px}h1{font-size:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
figure{margin:0;background:#1c1c1c;border-radius:10px;overflow:hidden}img{width:100%;display:block}
figcaption{padding:10px}.t{font-weight:700;color:#ffd400}.o{color:#8fd3ff;font-size:13px}.s{color:#bbb;font-size:13px;margin-top:4px}</style>
<h1>Storyboard: ${escapeHtml(path.basename(path.dirname(planPath)))} (${msToClock(inputProps.durationMs)} total, ${inputProps.overlays.length} graphics, music: ${escapeHtml(plan.music ?? "none")})</h1>
<div class="grid">${rows.map((r) => `<figure><img src="${r.file}"><figcaption><div class="t">${msToClock(r.t)}</div>${r.active.map((a) => `<div class="o">${escapeHtml(a)}</div>`).join("")}<div class="s">"${escapeHtml(r.said)}"</div></figcaption></figure>`).join("")}</div>`;
  fs.writeFileSync(path.join(dir, "storyboard.html"), html);
  console.log(`\nStoryboard: ${path.relative(root, path.join(dir, "storyboard.html"))}`);
};

const out = path.resolve(process.cwd(), outArg ?? path.join(root, "exports", `${path.basename(path.dirname(planPath))}.mp4`));
const browserExecutable = process.env.REMOTION_BROWSER ?? null;

console.log("Bundling...");
const serveUrl = await bundle({ entryPoint: path.join(here, "src/index.ts"), publicDir });
const composition = await selectComposition({ serveUrl, id: "Reel", inputProps, browserExecutable });
if (storyboard) {
  await renderStoryboard(serveUrl, composition);
  fs.rmSync(publicDir, { recursive: true, force: true });
  process.exit(0);
}
console.log(`Rendering ${composition.durationInFrames} frames -> ${out}`);
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: out,
  inputProps,
  browserExecutable,
  crf: 18,
  onProgress: ({ progress }) => process.stdout.write(`\r${Math.round(progress * 100)}%`),
});
console.log(`\nDone: ${out}`);
fs.rmSync(publicDir, { recursive: true, force: true });
