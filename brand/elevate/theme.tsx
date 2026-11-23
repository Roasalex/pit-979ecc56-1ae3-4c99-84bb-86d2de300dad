// Elevate theme (draft): colours from elevate-mk-tg.com's CSS variables; Inter stands in for Helvetica Neue.
import { fontFamily } from "../../styles/fonts";
import inter500 from "@fontsource/inter/files/inter-latin-500-normal.woff2";
import inter700 from "@fontsource/inter/files/inter-latin-700-normal.woff2";
import inter800 from "@fontsource/inter/files/inter-latin-800-normal.woff2";

export const EL = {
  ink: "#030303",
  card: "#0F0F0F",
  paper: "#F5F3F0",
  red: "#F52F39",
  grey: "#989898",
};

export const EL_FONT = fontFamily("Elevate Inter", [
  { url: inter500, weight: "500" },
  { url: inter700, weight: "700" },
  { url: inter800, weight: "800" },
]);
