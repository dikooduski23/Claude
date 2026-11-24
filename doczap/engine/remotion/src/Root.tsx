import { Composition } from "remotion";
import { DocZapEpisode, type DocZapEpisodeProps } from "./doczap/Episode";
import { DocZapOverlay, type DocZapOverlayProps } from "./doczap/Overlay";

// Real data comes from engine/overlay.py and engine/episode.py via --props; these are tiny demos.
const demo: DocZapOverlayProps = {
  durationInFrames: 240,
  captions: [
    { text: "This", startMs: 130, endMs: 400, timestampMs: 265, confidence: 1 },
    { text: " man", startMs: 400, endMs: 670, timestampMs: 535, confidence: 1, pageBreakAfter: true } as never,
    { text: "won", startMs: 670, endMs: 910, timestampMs: 790, confidence: 1 },
  ],
  labels: [{ text: "jackpot", start: 1, end: 3.5, x: 40, y: 620, tx: 230, arrowTo: [150, 300] }],
};

const demoEpisode: DocZapEpisodeProps = {
  durationInFrames: 240,
  platesUrl: "http://localhost:8765",
  shots: [
    { id: "a", a: 0, b: 119 },
    { id: "b", a: 120, b: 239 },
  ],
  transitions: [{ at: 120, len: 52, type: "whip-pan" }],
  overlay: null,
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="DocZapOverlay"
      component={DocZapOverlay}
      fps={60}
      width={1080}
      height={1920}
      durationInFrames={240}
      defaultProps={demo}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
    />
    <Composition
      id="DocZapEpisode"
      component={DocZapEpisode}
      fps={60}
      width={1080}
      height={1920}
      durationInFrames={240}
      defaultProps={demoEpisode}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationInFrames })}
    />
  </>
);
