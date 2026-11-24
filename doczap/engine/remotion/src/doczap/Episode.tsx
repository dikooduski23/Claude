// Doc Zap episode: the three.js plates cut together with Remocn transitions, with the
// Remocn caption/label overlay on top. Rendered by engine/episode.py, which serves the
// work dir over http (platesUrl) so thousands of plates are never copied into the bundle.
//
// Each shot becomes one TransitionSeries scene. A transition of length L centred on a cut
// at frame c overlaps the last L/2 frames past the cut of shot A with the first L/2 frames
// before the cut of shot B. Those frames come from handles/<shot>/ (rendered with SHOT=<id>),
// everything else from plates/. Total length stays exactly TOTAL frames, so voice sync holds.
import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import React from "react";
import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { irisWipe } from "@/components/remocn/iris-wipe";
import { lensZoom } from "@/components/remocn/lens-zoom";
import { lightLeak } from "@/components/remocn/light-leak";
import { pushThrough } from "@/components/remocn/push-through";
import { warpDissolve } from "@/components/remocn/warp-dissolve";
import { whipPan } from "@/components/remocn/whip-pan";
import { DocZapOverlay, type DocZapOverlayProps } from "./Overlay";

export type DocZapShot = { id: string; a: number; b: number }; // 60 fps frames, b inclusive
export type DocZapTransition = { at: number; len: number; type: string; opts?: Record<string, unknown> }; // 60 fps frames

export type DocZapEpisodeProps = {
  durationInFrames: number;
  platesUrl: string;
  shots: DocZapShot[];
  transitions: DocZapTransition[];
  overlay: Omit<DocZapOverlayProps, "durationInFrames"> | null;
};

// type -> Remocn presentation. Doc Zap defaults: no camera shake (STYLE.md), warm light leak.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PRESENTATIONS: Record<string, (o: any) => TransitionPresentation<any>> = {
  "whip-pan": (o) => whipPan({ blur: 28, ...o }),
  "lens-zoom": (o) => lensZoom({ shakeAmount: 0, redScale: 1, greenScale: 1, blueScale: 1, ...o }),
  "push-through": (o) => pushThrough({ ...o }),
  "light-leak": (o) => lightLeak({ ...o }),
  "warp-dissolve": (o) => warpDissolve({ colors: ["#2a1a10", "#7a4a2a", "#1a1420", "#e0b070"], ...o }),
  "iris-wipe": (o) => irisWipe({ color: "#0d0b12", ...o }),
};

const pad = (n: number) => String(n).padStart(4, "0");

const Plates: React.FC<{ shot: DocZapShot; start: number; base: string }> = ({ shot, start, base }) => {
  const g = start + useCurrentFrame();
  const src = g >= shot.a && g <= shot.b ? `${base}/plates/f${pad(g)}.jpg` : `${base}/handles/${shot.id}/f${pad(g)}.jpg`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img src={src} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};

export function episodeScenes(shots: DocZapShot[], transitions: DocZapTransition[]) {
  const at = new Map(transitions.map((t) => [t.at, t]));
  return shots.map((s, k) => {
    const tin = at.get(s.a);
    const tout = k + 1 < shots.length ? at.get(shots[k + 1].a) : undefined;
    const start = s.a - (tin ? tin.len / 2 : 0);
    const end = s.b + 1 + (tout ? tout.len / 2 : 0);
    return { shot: s, start, duration: end - start, tout };
  });
}

export const DocZapEpisode: React.FC<DocZapEpisodeProps> = ({ durationInFrames, platesUrl, shots, transitions, overlay }) => {
  const scenes = episodeScenes(shots, transitions);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <TransitionSeries>
        {scenes.flatMap(({ shot, start, duration, tout }) => {
          const parts = [
            <TransitionSeries.Sequence key={shot.id} durationInFrames={duration}>
              <Plates shot={shot} start={start} base={platesUrl} />
            </TransitionSeries.Sequence>,
          ];
          if (tout) {
            const make = PRESENTATIONS[tout.type];
            if (!make) throw new Error(`Unknown Remocn transition "${tout.type}"`);
            parts.push(
              <TransitionSeries.Transition key={`t${tout.at}`} timing={linearTiming({ durationInFrames: tout.len })} presentation={make(tout.opts ?? {})} />,
            );
          }
          return parts;
        })}
      </TransitionSeries>
      {overlay ? <DocZapOverlay durationInFrames={durationInFrames} {...overlay} /> : null}
    </AbsoluteFill>
  );
};
