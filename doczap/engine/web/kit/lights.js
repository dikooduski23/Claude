// Doc Zap lighting presets (Nov 2026). Spread one into story.js LIGHTS:  import { LP } from './kit/lights.js';  LIGHTS = { room: LP.candle, out: LP.sunset }
// Fields are read by main.js applyLight/placeSun/post: hemi sky/ground, sun (key light) colour/intensity/azimuth/elevation,
// fog = depth haze (colour + near/far in metres), sky gradient, grading (sat/con/gain/lift/vig), bloom on real light sources,
// rim light on characters, ambient occlusion. Tweak per shot with withHaze()/tint().
const BASE = { az: 135, el: 50, sky: '#cfe2ff', ground: '#b09a78', hemi: 1.1, sun: '#fff3dc', sunI: 1.0, fog: '#d4e6ff', fogNear: 80, fogFar: 900, skyTop: '#2f7ce0', skyHor: '#bfe0ff', sat: 1.28, vig: 0.22, shadowExt: 8, noClouds: true, ink: 3.4, con: 1.06, gain: '#fffaf2', bloom: 0.85, bthr: 0.84, rim: 0.24, rimCol: '#ffe0b8', rimDir: [-0.8, 0.5], ao: 0.26 };
export const LP = {
  /** bright midday: warm sun, blue sky, light-blue haze far away */
  day: { ...BASE, sky: '#dcecff', ground: '#9a8a6a', hemi: 1.15, sun: '#fff1d6', sunI: 1.25, az: 125, el: 55, fog: '#cfe2f6', fogNear: 18, fogFar: 160, skyTop: '#3a86e8', skyHor: '#cfe8ff', sat: 1.16, vig: 0.2, gain: '#fffaf0', bloom: 0.45, bthr: 0.98, rim: 0.22, rimCol: '#fff4d8', sunDisc: '#fff8e0', sunSize: 0.012, sat: 1.3, bloom: 0.85, bthr: 0.84, /* rich look (Nov 25 2026) */ },
  /** golden hour / sunset: low orange key, purple-pink sky, warm pink haze */
  sunset: { ...BASE, sky: '#ffb890', ground: '#5a3a4a', hemi: 0.85, sun: '#ff9a50', sunI: 1.35, az: 200, el: 9, fog: '#e89a8a', fogNear: 10, fogFar: 90, skyTop: '#4a3a8a', skyHor: '#ff9a6a', sat: 1.24, vig: 0.32, gain: '#fff0e0', lift: '#140808', bloom: 0.7, bthr: 0.9, rim: 0.42, rimCol: '#ffb070', rimDir: [0.85, 0.4], ao: 0.3, shadowExt: 10, sunDisc: '#ffd8a0', sunSize: 0.03, sat: 1.36, bloom: 1.05, bthr: 0.8, /* rich look (Nov 25 2026) */ },
  /** outdoor night: blue moonlight key, deep blue haze close in, torches bloom */
  night: { ...BASE, sky: '#3a4a8a', ground: '#1a1620', hemi: 0.42, sun: '#8aa4ff', sunI: 0.38, az: 60, el: 38, fog: '#101834', fogNear: 4, fogFar: 22, skyTop: '#060c26', skyHor: '#1e2c64', sat: 1.2, vig: 0.4, con: 1.1, gain: '#f4f0ff', bloom: 0.8, bthr: 0.82, rim: 0.36, rimCol: '#8aa8ff', rimDir: [0.8, 0.5], ao: 0.3, shadowExt: 6, sat: 1.3, bloom: 1.0, bthr: 0.78, hemi: 0.52, /* rich look (Nov 25 2026) */ },
  /** indoor at night lit by candles/torches: dim warm ambient, brown haze, strong bloom; add K.prop.torch/candle lights */
  candle: { ...BASE, sky: '#7a7088', ground: '#2a1e18', hemi: 0.38, sun: '#ffd8b0', sunI: 0.12, az: 110, el: 60, fog: '#22160f', fogNear: 3.5, fogFar: 16, skyTop: '#0a0810', skyHor: '#1a1018', sat: 1.1, vig: 0.42, con: 1.1, gain: '#fff0dc', lift: '#0a0604', bloom: 0.85, bthr: 0.8, rim: 0.38, rimCol: '#ffb060', rimDir: [-0.8, 0.5], ao: 0.32, shadowExt: 5, sat: 1.3, bloom: 1.0, bthr: 0.78, hemi: 0.48, /* rich look (Nov 25 2026) */ },
  /** indoor by day: soft window light, warm bounce */
  indoor: { ...BASE, sky: '#fff1dc', ground: '#7a6450', hemi: 1.0, sun: '#ffe2b8', sunI: 0.9, az: 120, el: 50, fog: '#c09a78', fogNear: 6, fogFar: 30, sat: 1.18, vig: 0.3, gain: '#fff4e6', bloom: 0.6, bthr: 0.92, rim: 0.3, rimCol: '#ffc878', ao: 0.28, shadowExt: 6, sat: 1.3, bloom: 0.85, bthr: 0.84, /* rich look (Nov 25 2026) */ },
};
/** stronger/weaker depth haze: k > 1 pulls the fog closer */
export const withHaze = (L, k = 1, col) => ({ ...L, fogNear: L.fogNear / k, fogFar: L.fogFar / k, fog: col || L.fog });
/** override any fields (e.g. tint(LP.night, { sunI: 0.2 })) */
export const tint = (L, o) => ({ ...L, ...o });
