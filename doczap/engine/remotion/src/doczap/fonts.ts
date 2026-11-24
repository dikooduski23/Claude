// Fonts are bundled in public/fonts so renders work offline and behind proxies
// (the render browser never fetches Google Fonts).
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const POPPINS = "DocZap Poppins";
export const CAVEAT = "DocZap Caveat";

loadFont({ family: POPPINS, url: staticFile("fonts/poppins-latin-700.woff2"), weight: "700" });
// Caveat ships as one variable-weight file (400-700)
loadFont({ family: CAVEAT, url: staticFile("fonts/caveat-latin-wght.woff2"), weight: "400 700" });
