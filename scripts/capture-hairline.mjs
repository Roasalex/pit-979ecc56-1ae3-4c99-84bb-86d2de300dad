// Record one Hairline figure (@lucasmarkes/hairline, 33 line drawings that answer the pointer) as a video clip for
// an edit. Its engine runs on the browser clock, so it can't be rendered frame by frame inside Remotion; instead we
// play it in a headless browser under Playwright's fake clock, which makes every frame exactly 1/30 s apart.
//
//   node scripts/capture-hairline.mjs Elevator --seconds 8 [--intensity 0.7] [--light] [--width 1080]
//
// Writes public/hairline/<figure>.mp4 (5:4, 1080x864 by default), playing the figure's own tour on a loop.
// Thicker, brighter strokes than the web defaults so the lines survive phone screens and compression.
import { build } from "esbuild";
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const figure = args[0];
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
if (!figure || figure.startsWith("--")) {
  console.error("Usage: node scripts/capture-hairline.mjs <Figure> [--seconds 8] [--intensity 0.5] [--light] [--width 1080]");
  process.exit(1);
}
const seconds = Number(opt("seconds", 8));
const width = Number(opt("width", 1080));
const height = Math.round((width * 4) / 5);
const light = args.includes("--light");
const intensity = Number(opt("intensity", 0.5));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hairline-"));
// Video-weight theme: the web defaults are 0.9px hairlines in low-contrast greys.
const vars = light
  ? { "--hairline-plate": "#ffffff", "--hairline-hi": "#09090b", "--hairline-edge": "#3f3f46", "--hairline-mid": "#71717a", "--hairline-lo": "#d4d4d8" }
  : { "--hairline-plate": "#0b0b0f", "--hairline-hi": "#ffffff", "--hairline-edge": "#d4d4d8", "--hairline-mid": "#8b8b95", "--hairline-lo": "#3f3f46" };
fs.writeFileSync(
  path.join(tmp, "entry.jsx"),
  `import { createRoot } from "react-dom/client";
import * as H from "@lucasmarkes/hairline/react";
const Fig = H[${JSON.stringify(figure)}];
if (!Fig) throw new Error("No figure named ${figure}");
createRoot(document.getElementById("root")).render(
  <Fig id="fig" play theme=${JSON.stringify(light ? "light" : "dark")} intensity={${intensity}}
    style={{ width: ${width}, ${Object.entries(vars).map(([k, v]) => `"${k}": "${v}"`).join(", ")}, "--hairline-stroke": ${(2.6 * width) / 1080} }} />
);`,
);
await build({
  entryPoints: [path.join(tmp, "entry.jsx")],
  bundle: true,
  outfile: path.join(tmp, "app.js"),
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  nodePaths: [path.join(root, "node_modules")],
  logLevel: "error",
});
fs.writeFileSync(
  path.join(tmp, "index.html"),
  `<!doctype html><html><body style="margin:0;background:${vars["--hairline-plate"]}"><div id="root"></div><script src="app.js"></script></body></html>`,
);

const frames = path.join(tmp, "frames");
fs.mkdirSync(frames);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
await page.clock.install({ time: 0 });
await page.goto("file://" + path.join(tmp, "index.html"));
await page.clock.runFor(100);
const el = page.locator("#fig");
const total = Math.round(seconds * 30);
for (let i = 0; i < total; i++) {
  await el.screenshot({ path: path.join(frames, `f${String(i).padStart(5, "0")}.png`) });
  await page.clock.runFor(1000 / 30);
  if (i % 30 === 0) process.stdout.write(`\r${figure}: ${i}/${total} frames`);
}
await browser.close();

const out = path.join(root, "public", "hairline", `${figure.toLowerCase()}${light ? "-light" : ""}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-i", path.join(frames, "f%05d.png"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-r", "30", out]);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nWrote ${path.relative(root, out)} (${width}x${height}, ${total} frames)`);
