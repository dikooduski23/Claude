import { Composition } from "remotion";
import { DocZapOverlay, type DocZapOverlayProps } from "./doczap/Overlay";

const demo: DocZapOverlayProps = {
  durationInFrames: 240,
  captions: [
    { text: "This", startMs: 130, endMs: 400, timestampMs: 265, confidence: 1 },
    { text: " man", startMs: 400, endMs: 670, timestampMs: 535, confidence: 1, pageBreakAfter: true } as never,
    { text: "won", startMs: 670, endMs: 910, timestampMs: 790, confidence: 1 },
  ],
  labels: [{ text: "jackpot", start: 1, end: 3.5, x: 40, y: 620, tx: 230, arrowTo: [150, 300] }],
};

export const RemotionRoot: React.FC = () => (
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
);
