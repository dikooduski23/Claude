// Doc Zap 2D overlay built from remocn components, rendered as a transparent
// 1080x1920 layer that compose.py lays over the three.js plates.
//   captions -> remocn CaptionActivePop (Doc Zap 1-2 word pages, Poppins Bold,
//               white with a dark stroke, spoken word pops)
//   labels   -> remocn Handwrite (Caveat 700) + InkArrow, optional ScribbleCircle
// All data comes in as props (overlay.json), so one composition serves every episode.
import type { Caption } from "@remotion/captions";
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptionActivePop } from "@/components/remocn/caption-active-pop";
import { Handwrite } from "@/components/remocn/handwrite";
import { InkArrow } from "@/components/remocn/ink-arrow";
import { ScribbleCircle } from "@/components/remocn/scribble-circle";

import { POPPINS } from "./fonts";

const INK = "#141418";
const WHITE = "#ffffff";

export type DocZapLabel = {
  text: string;
  start: number; // seconds
  end: number; // seconds
  x: number; // top-left of the label box, px
  y: number;
  w?: number;
  h?: number;
  vx?: number; // horizontal drift in px/s, follows a camera move (0 = still)
  driftAt?: number; // second at which the drift offset is 0
  tx?: number; // text centre inside the box
  ty?: number;
  arrowTo?: [number, number] | null; // arrow head inside the box
  curvature?: number;
  circle?: { x: number; y: number; w: number; h: number } | null; // red scribble circle, box coords
  fontSize?: number;
};

export type DocZapOverlayProps = {
  durationInFrames: number;
  captions: Caption[];
  labels: DocZapLabel[];
  captionY?: number; // centre line of the caption, px (STYLE.md: ~1342)
  captionSize?: number;
};

// White text with a dark outline: the stroke is painted under the fill so it
// never thins the letters. Both properties inherit into remocn's own spans.
const outlined = (px: number): React.CSSProperties => ({
  WebkitTextStroke: `${px}px ${INK}`,
  paintOrder: "stroke fill",
});

const Captions: React.FC<{ captions: Caption[]; y: number; size: number }> = ({ captions, y, size }) => (
  <AbsoluteFill>
    <div
      style={{
        position: "absolute",
        left: 90,
        right: 90,
        top: y,
        transform: "translateY(-50%)",
        display: "flex",
        justifyContent: "center",
        fontFamily: POPPINS,
        // Poppins' space is narrow; the popped word and the outline would cover it
        wordSpacing: "0.32em",
        ...outlined(Math.round(size * 0.12)),
      }}
    >
      <CaptionActivePop
        captions={captions}
        // pages are cut by pageBreakAfter from caps.py, never by time
        combineTokensWithinMilliseconds={60000}
        holdMs={350}
        fontSize={size}
        fontWeight={700}
        color={WHITE}
        activeColor={WHITE}
        popScale={1.1}
        shadow
      />
    </div>
  </AbsoluteFill>
);

const Label: React.FC<{ l: DocZapLabel }> = ({ l }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const w = l.w ?? 460;
  const h = l.h ?? 330;
  const tx = l.tx ?? w / 2;
  const ty = l.ty ?? 70;
  const size = l.fontSize ?? 96;
  const t = l.start + frame / fps;
  const dx = (l.vx ?? 0) * (t - (l.driftAt ?? (l.start + l.end) / 2));
  // the pen writes first, then draws the arrow (remocn delays are 30 fps frames)
  const PER_STEP = 2;
  const STEP = 2;
  const writeFrames = Math.ceil(l.text.length / PER_STEP) * STEP;
  return (
    <div style={{ position: "absolute", left: l.x + dx, top: l.y, width: w, height: h }}>
      {l.circle ? (
        <div style={{ position: "absolute", left: l.circle.x, top: l.circle.y }}>
          <ScribbleCircle width={l.circle.w} height={l.circle.h} color="#e5322d" strokeWidth={12} delay={writeFrames} />
        </div>
      ) : null}
      {l.arrowTo ? (
        <>
          {/* dark under-stroke, then the white pen line on top, same seed = same path.
              Each arrow gets its own absolute box: InkArrow is a block-level svg. */}
          {[{ color: INK, width: 16 }, { color: WHITE, width: 9 }].map((a) => (
            <div key={a.color} style={{ position: "absolute", left: 0, top: 0 }}>
              <InkArrow from={{ x: tx, y: ty + 60 }} to={{ x: l.arrowTo![0], y: l.arrowTo![1] }} curvature={l.curvature ?? 0.25}
                color={a.color} strokeWidth={a.width} pressure={0.6} grain={0} delay={writeFrames} drawDur={12} headSize={34} seed={l.text} />
            </div>
          ))}
        </>
      ) : null}
      <div style={{ position: "absolute", left: tx - 400, top: ty - 70, width: 800, height: 140, filter: "drop-shadow(0 4px 6px rgba(0,0,0,.55))", ...outlined(9) }}>
        <Handwrite text={l.text} fontSize={size} color={WHITE} weight={700} step={STEP} perStep={PER_STEP} />
      </div>
    </div>
  );
};

export const DocZapOverlay: React.FC<DocZapOverlayProps> = ({ captions, labels, captionY = 1342, captionSize = 60 }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      {labels.map((l, i) => (
        <Sequence key={i} from={Math.round(l.start * fps)} durationInFrames={Math.max(1, Math.round((l.end - l.start) * fps))} layout="none">
          <Label l={l} />
        </Sequence>
      ))}
      <Captions captions={captions} y={captionY} size={captionSize} />
    </AbsoluteFill>
  );
};
