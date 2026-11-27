# Doc Zap style guide

Current style: the **reference style**, from 9 reels Diyar sent on Nov 23 2026. They were Rick's Clips (mason's crooked stairs, sheriff's sixth bullet, the flying-thunder samurai bomb, the candlemaker's forever candle, the prisoner pouring water on a wall, the chickens rich/poor parable) and Segment Zero (the Russian guard of the snowdrop, Simo Häyhä the no-scope sniper), plus a flat-2D brain-upload reel. He wants Doc Zap to be **exactly** that style: camera movement, story idea, everything. Approved test: the Lottery Man rebuild (`doczap/episodes/lottery-man`).

## Story
- **Formula:** someone did something that looked stupid or crazy **on purpose** → everyone laughs or doubts → time passes, a crisis → the hidden trick pays off → **"You see,"** + the mechanism shown in a cutaway → an ironic punchline.
- History legends, loopholes, paradoxes, backfires and "what if" science all fit. It must be **true, little-known** and fact-checked (2+ sources). It must not repeat an earlier episode (check `doczap/episodes/`).
- The **spoken first line names the strange act** ("He built the king's stairs crooked on purpose.").
- Third-person storyteller, short punchy sentences, 1-2 dialogue lines for humour ("Son, real snipers use a scope.").
- Link beats with **But / So**, never "and then". Rehook at the halfway point.
- **30-45 s** (Diyar confirmed this; the references run 50-70 s, but don't use that).
- **No "comment yes or no" CTA.** The last line flows straight into line 1, so the video loops.

## Hook (first 1-3 s)
- **No title-text card.** Frame 1 shows the real thing already in motion: a close-up of the character doing the strange act, or a **macro slow-mo** of the key object passing the lens (shallow depth of field) with a focus pull to the character.
- The text, spoken and visual hooks must agree. Show proof or stakes early (big numbers).

## Camera
- **Always moving:** push-ins, slow arcs/orbits, the camera **following the object** (a rolling bomb, a poured cup, a falling ticket), **POV** shots (sights, scope), low angles, top-down reveals, over-the-shoulder foreground props.
- **Close/medium framing:** the face about half the frame height, the full head in frame, faces above the caption line.
- **A new angle every ~1.3-3 s.**
- **Whip-pans** (fast ~55° yaw over ~8 units at 30 fps, alternating direction) are the main transition, blurred in post with `tmix=frames=7`. Use hard cuts rarely.
- Never shake, punch-in zoom or handheld sway.
- **Depth of field:** close-ups cinf ~11-13, macro ~30+.

## Characters
- Big **white round heads**, black outlines, stick limbs, bright clothes, egg-shaped bodies.
- **Very expressive faces:** smug, wink, eureka, laugh, grin, shock, nervous with sweat, sick, stern, toothy anger. The face turns red/purple when angry.
- **Emotes** pop in with a bounce: a lightbulb, ?, !, heart, Zzz.
- Hats, helmets, crowns, moustaches and beards are welcome. Hats must sit above the brows.
- Characters act and react (pointing, laughing at the hero, shrugging, jumping). Show time passing with beard growth, tally marks, sun/moon icons or seasons.

## Worlds and light
- **Textured, detailed sets:** stone, brick, planks, rugs (canvas textures `P.stone`, `P.planks`), real props, foreground depth.
- **Warm motivated light:** torches, lamps, candles, sunbeams through windows. Moonlit night windows, sunsets, snow, depth haze.
- **Selective HDR bloom** only on real light sources. Faces and outlines stay sharp.

## Mechanism / reveal
- An **in-world cutaway:** a transparent/glass object, a cross-section, a simple diagram with arrows, a chalkboard, a balance scale.
- **Handwritten labels** (Caveat 700, white with a dark outline) with a hand-drawn arrow or red circle. Keep them few.

## Captions and on-screen text
- 1-2 words (≤12 characters), **Poppins Bold ~60 px**, white with a thin dark stroke and a soft shadow, **sentence case with punctuation** (not ALL CAPS), centred at y≈1342.
- Years and money as digits ("1992," "$27 million.").
- No watermark, username, episode number, progress bar, border, counters, stamps or pills. Only essential in-world signs (a newspaper, a jackpot board).

## Sound
- A distinct SFX on every action, a whoosh on each whip-pan, a music bed that dips on the shock beat, the voice on top, loudnorm to **-14 LUFS**.

## Posting kit
- Title, caption (a share ask), pinned comment (a save ask), YouTube description, tags and sources.
- Cover: a clean frame with the face visible, text off the face.

## Older lessons Diyar asked to keep
- Triple hook (context, lean-in, contrarian snapback). Stakes early; rehook every ~8-10 s; minimal pauses.
- Hooks need a clear topic, a reason to care and a curiosity gap in 1-2 s. Speak to the viewer; 6th-grade reading level; active voice.
- The idea is ~95% of performance: judge topic and angle before writing.
- Consistent format beats volume: treat the channel like a TV show.
- Shares get views, saves get followers.
- First frame matters more than words: show the real thing happening live, never a blank title card.

## Lessons from the Version 6 animated-shorts kit (studied Nov 26 2026)
Diyar sent the kit's master prompt and skill. It was built by copying the same channel (Ricks Clips), so its measured rules apply to us directly. Where it disagrees with Diyar's own rules, his rules win (no dissolves; music about 20 dB under the voice).
- **Don't ask, measure.** Never judge the look by opinion. Measure our frames against the reference frames with `doczap/tools/measure.py` (brightness, shadow area, saturation, white balance, outlines, sharpness, cuts, camera motion, loudness). Fix only the biggest gap, then measure again. Keep every version (v1, v2 …) and compare the same moment before and after.
- **Find the cause, not just a fix.** When a fix doesn't move the number, something else is overriding it. (Nov 26: a second `expo` later in the same light object cancelled the exposure change.)
- **Story details:** a one-sentence hook built on a contradiction (strange action, paradox fact, or conditional promise). Small exact numbers ("every 12 feet", "three years"), never statistics. Grow things in threes ("One dropped. Then another. Then all eight."). Show the result first, then the reason, with an everyday analogy. End 0.1-0.5 s after the last word.
- **Camera grammar (measured on Ricks Clips):**
  - The camera moves about 77 % of the time and drifts almost always (10-40 % of the frame per second). Pure holds last about 0.4 s and still creep in.
  - **Push-in is the default move** (53 %) and lands ON the narration word (its noun or verb). A pull-back is the reveal (22 %).
  - Travel from subject to subject inside one take (push/pull plus arc or pan) instead of cutting.
  - Moves are 0.6-1.3 s with an ease: speed peaks at about 40 % of the move and settles more slowly. No linear moves, no hard stops.
  - Edits only at a location or time change or a punchline. We use whip-pans or hard cuts there (Diyar bans dissolves).
- **Faces stay paper-white in every light** (the brightest pixels in the references are faces at L* about 100). The world gets graded; the character cards don't.
- **Everything has an outline,** including props and sets, in a warm brown-black ink, heavier on the lower/shadow side.
- **Shapes:** heads are an egg with a jaw, not a perfect circle. Brows are heavy wedges that taper to a point (the angle carries the mood). Mouths are small and slightly off-level. Hats sit askew with pointed brim tips. Posts taper and bases flare. Change a part's silhouette instead of adding parts.
- **Palette:** the references average about 42 % saturation, a near-neutral white balance (b* about 7) and lean warm-red (a* about +9: wood, brick, red rugs). They are darker than us (L* about 48) with much more shadow (about 38 % of the frame). Prefer warm wood, brick and red sets with real shadowed corners over bright all-green or all-white sets.
- **Checks with numbers before every render:** no face cut by the frame edge, no camera inside geometry, no subject hidden, nothing floating or sinking. Before saying "done", watch the WHOLE video as contact sheets every 0.5 s (`doczap/tools/watch.py`).

## Character acting (engine kit, Nov 27 2026, after Diyar's "the character movement" feedback)
Use `web/kit/act.js` in every episode's `actorsAt`. Nobody stands frozen, and nothing pops in one frame:
- `arms(f, [[frame,'pose'],...], 'R'|'L')`: arm poses blend over about 9 frames with a small overshoot. Key a gesture to the narration word (point on the noun, hands up on the cheer, arms cross on "grumble").
- `react(f, t, strength, hop)` / `reacts(...)`: a squash-and-stretch bounce on every expression change, plus a hop (0.04-0.09 m) on big reactions. Pass it as `extra.r` to `card()`.
- `ease(f, keys, dur)`: head turns (`look`), leans (`tilt`) and anything numeric, eased instead of jumping.
- `walk(f, [[frame,[x,y,z]],...])`: characters walk between marks with a step cycle and bob. Positions are WORLD coordinates (wrap set-local points with the set's offset helper, e.g. `A(...p)`).
- `sway(f, seed)` is added to the idle tilt automatically, a slow weight shift.
- Time reactions to when the camera actually shows the character, not before.
- Frame the walks: a walk that happens off-screen is wasted (the Cook demo's steward walk-in fell outside the table shot).

### Version 2: "make the movement real" (Nov 27 2026, Rumford episode)
Diyar found v1 still stiff. Characters held a pose, then swapped to the next one. The fix is that **every part moves on every frame**, and actions follow the classic principles:
- **Life layer, always on:** `alive(f, seed, energy)` handles breathing (the card stretches about 1.4 %), weight shift (sideways drift of about 1 cm), body and head sway, and slowly drifting hands (`Ld`/`Rd` offsets work on any arm pose). `card()` applies it to everyone automatically. No more stepping on twos (`u = f/2` is gone).
- **Free arms:** the `ik` arm pose takes a hand target `Lh`/`Rh = [out, down]` and solves the elbow. Hands can rub together, warm at a fire, point and pull back, or reach, all as continuous paths.
- **Anticipation → action → follow-through:** with `strike(f, t0, period, n)`, a tool blow winds up slowly while the body leans back, strikes fast while the body lunges forward, then rebounds. Each hit frame drives a squash (`reacts`).
- **Physical states:** `shiver()` is a fast small sideways shake plus tilt jitter (cold). `cough()` makes the body double forward with three barks and the hand flying to the mouth. `shake()`/`nod()` are head no/yes.
- **Story beats are acted, not posed:** the doubters cross their arms and shake their heads; the warm lord rubs his hands; Jane's quill travels along the line while her head follows; the kid bounces; Rumford points, winks and nods.
