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

## Lessons from our own results (Nov 24 2026; full table in `doczap/docs/results.md`)
- Reels plateau at ~1,500 plays (0.9-1.2x median); none has broken out (>3x). Treat every new episode as a shot at the first breakout.
- The two flops (Lottery Man 0.14x, Stratton glasses 0.18x) were both well-known stories. Prefer stories most viewers have never heard (ig-viral's "fresh angle" check).
- Comments are near zero: the pinned comment asks an easy either/or question.
- Hooks must score 70+ on ig-reel `hookscore.py` (all past captions scored under 60).

