// Doc Zap episode composition: base video (3D plates + whip blur + glossy glow + audio) with remocn captions on top.
// Render: npx remotion render src/index.ts Episode out.mp4 --props=public/episode.json
import React from 'react';
import { Composition, staticFile } from 'remotion';
import { Episode, EpisodeProps } from './Episode';
export const Root: React.FC = () => (
  <Composition id="Episode" component={Episode} width={1080} height={1920} fps={60} durationInFrames={2466}
    defaultProps={{ video: 'base.mp4', words: [], capY: 1342 } as EpisodeProps}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(((props.durationSec as number) || 41.1) * 60)) })} />
);
