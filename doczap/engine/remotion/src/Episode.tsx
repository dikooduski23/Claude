// Captions follow STYLE.md: 1 word at a time (remocn caption-word-pop springs it in as it is spoken), Poppins Bold, white, dark stroke, sentence case, centred at y≈1342.
import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, continueRender, delayRender } from 'remotion';
import type { Caption } from '@remotion/captions';
import { CaptionWordPop } from '@/components/remocn/caption-word-pop';
export type Word = { w: string; s: number; e: number };
export type EpisodeProps = { video: string; words: Word[]; capY?: number; durationSec?: number; fontSize?: number };
const font = new FontFace('Poppins', `url(${staticFile('fonts/Poppins-Bold.ttf')})`, { weight: '700' });
const h = delayRender('font'); font.load().then((f) => { document.fonts.add(f); continueRender(h); });
const clean = (w: string) => w.replace(/\.\.\.$/, '').replace(/…/g, '');
export const Episode: React.FC<EpisodeProps> = ({ video, words, capY = 1342, fontSize = 74 }) => {
  const captions: Caption[] = words.map((x, i) => ({ text: (i ? ' ' : '') + clean(x.w), startMs: x.s * 1000, endMs: x.e * 1000, timestampMs: ((x.s + x.e) / 2) * 1000, confidence: 1 }));
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <OffthreadVideo src={staticFile(video)} />
      <AbsoluteFill style={{ top: capY - 60, height: 120, bottom: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Poppins', WebkitTextStroke: '6px #141418', paintOrder: 'stroke fill', textShadow: '0 4px 14px rgba(0,0,0,.55)' } as React.CSSProperties}>
          <CaptionWordPop captions={captions} fontSize={fontSize} fontWeight={700} color="#ffffff" popScale={0.55} holdMs={250} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
