// Self-hosted brand fonts: the files ship in node_modules (@fontsource/*), so renders never wait on the network.
import { loadFont } from "@remotion/fonts";

type Face = { url: string; weight: string; style?: "normal" | "italic" };

export const fontFamily = (family: string, faces: Face[]) => {
  for (const f of faces) loadFont({ family, url: f.url, weight: f.weight, style: f.style ?? "normal" });
  return family;
};
