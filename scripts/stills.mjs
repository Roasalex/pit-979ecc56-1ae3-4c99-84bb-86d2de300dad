// Render many stills from one bundle: node scripts/stills.mjs <outDir> <scale> <Comp> <frame...> [-- <Comp> <frame...>]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const [outDir, scale, ...rest] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const groups = rest.join(" ").split(" -- ").map((g) => g.trim().split(/\s+/));
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER;
for (const [id, ...frames] of groups) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  for (const f of frames) {
    await renderStill({ serveUrl, composition, frame: Math.min(+f, composition.durationInFrames - 1), output: `${outDir}/${id}-${f}.png`, scale: +scale, browserExecutable });
  }
}
console.log("done");
