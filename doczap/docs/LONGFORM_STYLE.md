# Doc Zap Long-Form: "What If You Were Born as…" (Nov 26 2026)

Diyar asked for weekly 8-10 minute YouTube videos modelled on **Born in Lore** (@Borninlore). That channel started on Oct 28 2026 and reached about 49.8K subscribers and 10.8M views with 10 videos. Top videos: Ghost 4.6M, CJ 2.05M, Kratos 1.36M; they run 7-14 minutes.

**Copyright rule:** Born in Lore uses video-game characters it doesn't own. Doc Zap uses **real historical people only** (public domain), drawn as original characters.

## Story formula (copied from the reference)
- **Title:** "What If You Were Born as [Name]?" Second person throughout ("You're nine. Your father…").
- **Cold open (0:00-0:30):** a montage of the worst moments still to come ("You will… You will… And one day…"), then "But tonight, you're just a baby."
- **Chapters:** birth → childhood → first tragedy → first fight or crime → captivity or low point → love and alliance → rival → rise → the famous part → death → the legacy twist.
- Each chapter opens with a serif chapter card and ends on a rehook line ("Remember his name.", "But here's the twist.").
- **Ending:** a recap triad ("A baby holding blood. A boy left with nothing…"), then a judgment question for the comments and "who should be born next?" (the reference does this; the long-form exception to the shorts' no-CTA rule).
- **Facts:** 2+ sources per claim. Legends are framed as "the old chronicle says". A fresh-context doubt review runs before voicing.

## Visual style (from a vidIQ watch of "Born as Ghost")
- 2D vector comic look: bold, medium-weight dark outlines; flat colour with soft shading.
- Muted palette (sepia, dark blue, charcoal) with warm fire orange and red accents.
- Semi-realistic rounded faces with large expressive eyes. Characters are puppet-rigged (blink, talk, arm gestures).
- Static illustrated backgrounds brought to life with pans, slow zooms, tracking and parallax.
- A new shot every 2-4 s. Cuts and whip-pans. Filmstrip, polaroid and paper-note/dossier overlays.
- Serif chapter titles; location tags; a height chart to show years passing.
- Over-the-shoulder and point-of-view shots sell the "you" framing.
- **Audio:** deep, measured narrator; ambient orchestral bed; heavy diegetic SFX (fire, wind, hooves, paper).
- **Thumbnail:** high-contrast face of the figure on a dark background, at most 3 words.

## Engine (doczap/longform)
- **Files:** `kit.py` (primitives, palette, fonts), `chars.py` (puppet characters and horse), `sets.py` (cached parallax layers: steppe, yurt, city, palace), `overlays.py` (chapter card, location tag, paper note, polaroid, red circle, year stamp, height chart, end card, film finish).
- **Output:** 1920×1080 at 30 fps, rendered with skia on the CPU. Read frames back with `toarray(colorType=kRGBA_8888)`; the default order is BGRA.
- **Film finish:** slight desaturation, warm split, vignette, grain.

## Standing rule (Diyar, Nov 26 2026)
Use the **youtube-agent** skill on every long-form episode:
- **/yt-package:** write 10 titles and keep the top 3. The thumbnail must not repeat the title and has at most 3 words.
- **/yt-seo:** the three searches the video should win must appear in the title and the first two lines of the description.
- **/yt-chapters:** start at 0:00, at least 3 chapters, each at least 10 seconds.
- **/yt-shorts:** list 20-55 s Shorts already inside the video, each with a new hook line and a loop point.
- **/yt-retention:** about 48 hours after posting, ask for the retention CSV.
