// Doc Zap episode = base video (3D plates with hard cuts, glossy glow, audio) cut into shots and re-joined with remocn
// transitions centred on every cut, plus remocn captions on top.
// - Transitions: remocn whip-pan (main), zoom-blur (punch-in), focus-pull (rack focus into a cutaway). Each one is
//   centred on its cut; the shots get freeze-frame handles of T/2 so the total length (and audio sync) never changes.
// - Captions follow STYLE.md: remocn caption-word-pop, one word at a time, Poppins Bold, white, dark stroke, y≈1342.
import React from 'react';
import { AbsoluteFill, Audio, Freeze, OffthreadVideo, staticFile, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import type { Caption } from '@remotion/captions';
import { CaptionWordPop } from '@/components/remocn/caption-word-pop';
import { whipPan } from '@/components/remocn/whip-pan';
import { zoomBlur } from '@/components/remocn/zoom-blur';
import { focusPull } from '@/components/remocn/focus-pull';
export type Word = { w: string; s: number; e: number };
export type Cut = { at: number; type?: 'whip' | 'zoom' | 'focus' | 'cut'; dir?: 'left' | 'right' | 'up' | 'down'; len?: number };
export type EpisodeProps = { video: string; words: Word[]; cuts?: Cut[]; capY?: number; durationSec?: number; fontSize?: number; frames?: number };
const font = new FontFace('Poppins', `url(${staticFile('fonts/Poppins-Bold.ttf')})`, { weight: '700' });
const h = delayRender('font'); font.load().then((f) => { document.fonts.add(f); continueRender(h); });
const clean = (w: string) => w.replace(/\.\.\.$/, '').replace(/…/g, '');
const presentation = (c: Cut, i: number) => c.type === 'zoom' ? zoomBlur({ blur: 18 }) : c.type === 'focus' ? focusPull({ blur: 22 }) : whipPan({ direction: c.dir || (i % 2 ? 'right' : 'left'), blur: 28 });
/** one shot: plays base frames [from, to], frozen on its first/last frame inside the transition handles */
const Shot: React.FC<{ video: string; start: number; from: number; to: number }> = ({ video, start, from, to }) => {
  const f = useCurrentFrame(), src = Math.min(to, Math.max(from, start + f));
  return <Freeze frame={src}><OffthreadVideo src={staticFile(video)} muted /></Freeze>;
};
export const Episode: React.FC<EpisodeProps> = ({ video, words, cuts = [], capY = 1342, fontSize = 74, durationSec = 41.1 }) => {
  const N = Math.round(durationSec * 60), C = [...cuts].filter((c) => c.at > 0 && c.at < N).sort((a, b) => a.at - b.at);
  const T = (c?: Cut) => (c && c.type !== 'cut' ? (c.len ?? 20) : 0);
  const bounds = [0, ...C.map((c) => c.at), N];
  const captions: Caption[] = words.map((x, i) => ({ text: (i ? ' ' : '') + clean(x.w), startMs: x.s * 1000, endMs: x.e * 1000, timestampMs: ((x.s + x.e) / 2) * 1000, confidence: 1 }));
  const items: React.ReactNode[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const head = Math.floor(T(C[i - 1]) / 2), tail = Math.ceil(T(C[i]) / 2), a = bounds[i], b = bounds[i + 1] - 1;
    items.push(<TransitionSeries.Sequence key={'s' + i} durationInFrames={b - a + 1 + head + tail}><Shot video={video} start={a - head} from={a} to={b} /></TransitionSeries.Sequence>);
    if (i < C.length && T(C[i]) > 0) items.push(<TransitionSeries.Transition key={'t' + i} presentation={presentation(C[i], i) as any} timing={linearTiming({ durationInFrames: T(C[i]) })} />);
  }
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>{items}</TransitionSeries>
      <Audio src={staticFile(video)} />
      <AbsoluteFill style={{ top: capY - 60, height: 120, bottom: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Poppins', WebkitTextStroke: '6px #141418', paintOrder: 'stroke fill', textShadow: '0 4px 14px rgba(0,0,0,.55)' } as React.CSSProperties}>
          <CaptionWordPop captions={captions} fontSize={fontSize} fontWeight={700} color="#ffffff" popScale={0.55} holdMs={250} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
