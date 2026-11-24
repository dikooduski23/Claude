# Graph Report - Claude  (2026-11-24)

## Corpus Check
- 44 files · ~131,557 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .woff 1)

## Summary
- 1527 nodes · 2152 edges · 38 communities (33 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.85)
- Token cost: 96,952 input · 0 output

## Community Hubs (Navigation)
- World Sets (main.js)
- Toon Character Drawing
- World: Spallanzani Lab
- Built Character Bundle (toon.js)
- World: Lottery Room
- SFX Mix (mix.py)
- World: Rupert Set
- Engine Story & Camera
- World: Stapp Set
- Lottery Man Episode Story
- Style, Script & Rules
- World: Blagden Set
- Render & Roman Characters
- Captions & Overlay Layer
- World: Bats Extras
- Procedural Textures (paint.js)
- World: Heart Set
- World: Comet Set
- World: Bier Set
- Synth Sound Library
- World: Kane Set
- Prop Builders
- Final Video Pipeline
- Pen Path Primitives
- Music Synth
- World: Laennec Set
- Voice Timing Tools
- Card Textures & Decals
- Board & Calendar State
- Project Setup & Layout
- Water Drop Geometry A
- Water Drop Geometry B
- Lottery Balls
- Sky Pane Decals
- Graphify Config
- Sun Placement
- Drop Shards
- README

## God Nodes (most connected - your core abstractions)
1. `noise()` - 43 edges
2. `rng()` - 24 edges
3. `env()` - 22 edges
4. `Doc Zap style guide (STYLE.md)` - 21 edges
5. `bodyFront()` - 18 edges
6. `bodySide()` - 18 edges
7. `bodyFront()` - 18 edges
8. `bodySide()` - 18 edges
9. `romanFront()` - 17 edges
10. `add()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Lottery Man post kit` --references--> `Posting slots 11 AM / 6 PM Baghdad (UTC+3)`  [INFERRED]
  doczap/episodes/lottery-man/post.md → CLAUDE.md
- `doczap-next-video skill` --references--> `Doc Zap project instructions (CLAUDE.md)`  [EXTRACTED]
  .claude/skills/doczap-next-video/SKILL.md → CLAUDE.md
- `doczap-next-video skill` --references--> `Lottery Man script ('He Won the Lottery 14 Times... Legally')`  [INFERRED]
  .claude/skills/doczap-next-video/SKILL.md → doczap/episodes/lottery-man/script.md
- `Virality rubric (Hook/25, Value/20, Emotion/20, Platform/15, Share/10, Trend/10)` --implements--> `Virality check > 90/100`  [INFERRED]
  .claude/skills/doczap-next-video/SKILL.md → CLAUDE.md
- `Lottery Man virality check 95/100` --implements--> `Virality rubric (Hook/25, Value/20, Emotion/20, Platform/15, Share/10, Trend/10)`  [INFERRED]
  doczap/episodes/lottery-man/script.md → .claude/skills/doczap-next-video/SKILL.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Doc Zap episode production pipeline** — _claude_skills_doczap_next_video_skill_voice_alignment, _claude_skills_doczap_next_video_skill_stills_first, _claude_skills_doczap_next_video_skill_parallel_render, _claude_skills_doczap_next_video_skill_deliver, doczap_engine_web_index, doczap_engine_web_comp [INFERRED 0.85]
- **Doc Zap quality gates before build/post** — claude_virality_check_rule, claude_fact_check_rule, claude_qc_frames_rule, _claude_skills_doczap_next_video_skill_virality_rubric, _claude_skills_doczap_next_video_skill_stills_first [INFERRED 0.85]
- **Reference visual style** — doczap_docs_style_camera, doczap_docs_style_whip_pans, doczap_docs_style_characters, doczap_docs_style_worlds, doczap_docs_style_cutaway, doczap_docs_style_captions [EXTRACTED 1.00]

## Communities (38 total, 5 thin omitted)

### Community 0 - "World Sets (main.js)"
Cohesion: 0.00
Nodes (470): alpsC, bagM, BAGS, basin, basinLiq, bCandL, beam, beamTex (+462 more)

### Community 1 - "Toon Character Drawing"
Cohesion: 0.06
Nodes (56): blobPts(), bodyFront(), bodySide(), BUILD, clamp(), curve(), DEF_LIGHT, dmouth() (+48 more)

### Community 2 - "World: Spallanzani Lab"
Cohesion: 0.03
Nodes (63): BAGS, basin, basinLiq, beamTex, bench, bigJar, book, BOOKC (+55 more)

### Community 3 - "Built Character Bundle (toon.js)"
Cohesion: 0.07
Nodes (62): blobPts(), bodyFront(), bodySide(), BUILD, cheeks(), clamp(), cobweb(), curve() (+54 more)

### Community 4 - "World: Lottery Room"
Cohesion: 0.03
Nodes (57): AT, back, BALLCOL, ballTex, blindC, BOOK, bookLab, boxM (+49 more)

### Community 5 - "SFX Mix (mix.py)"
Cohesion: 0.07
Nodes (50): bark(), cabin(), chain(), chalk(), cheer(), clank(), click(), crack() (+42 more)

### Community 6 - "World: Rupert Set"
Cohesion: 0.03
Nodes (54): BK, bkWater, CAR, carG, carS, chand, CT, ctFill (+46 more)

### Community 7 - "Engine Story & Camera"
Cohesion: 0.07
Nodes (52): blinkAt(), camFromKeys(), clamp(), idle(), lerp(), lerp3(), M, q() (+44 more)

### Community 8 - "World: Stapp Set"
Cohesion: 0.04
Nodes (52): BLK, boardC0, boardC1, boardT1, BTN, BUSH, bushG, CI (+44 more)

### Community 9 - "Lottery Man Episode Story"
Cohesion: 0.07
Nodes (42): actorsAt(), BASE, bulb(), cam30(), camAt(), confetti(), CUTS, DECK (+34 more)

### Community 10 - "Style, Script & Rules"
Cohesion: 0.06
Nodes (30): doczap-next-video skill, Phase 1: pick story, fact-check, script, virality check, Virality rubric (Hook/25, Value/20, Emotion/20, Platform/15, Share/10, Trend/10), Diyar (channel owner), Output spec 1080x1920 60fps H.264 -14 LUFS, ElevenLabs Patrick voice (Eleven v3), Posting slots 11 AM / 6 PM Baghdad (UTC+3), Doc Zap style guide (STYLE.md) (+22 more)

### Community 11 - "World: Blagden Set"
Cohesion: 0.05
Nodes (39): BR_, BT, CANDF, candL, chair, CLK, clockC, DSK (+31 more)

### Community 12 - "Render & Roman Characters"
Cohesion: 0.07
Nodes (18): Full render in 2-3 parallel RESUME ranges, Stills-first QC via contact sheet, dependencies, playwright@1.63.0, name, private, type, frames (+10 more)

### Community 13 - "Captions & Overlay Layer"
Cohesion: 0.12
Nodes (28): bA, back(), badge(), bB, bolt(), callout(), CAPCH, captions() (+20 more)

### Community 14 - "World: Bats Extras"
Cohesion: 0.06
Nodes (27): alpsC, bike, BOARD, boardT, bricksC, cage, DET, dialC (+19 more)

### Community 15 - "Procedural Textures (paint.js)"
Cohesion: 0.16
Nodes (27): cityC, cseaC, fleshC, gl, parchment(), riverC, roadC, sandC (+19 more)

### Community 16 - "World: Heart Set"
Cohesion: 0.07
Nodes (26): bulb, cab, cart, coil, floorC, fluoro, fscr, HO (+18 more)

### Community 17 - "World: Comet Set"
Cohesion: 0.08
Nodes (24): beam, cables, cabWall, CB, cbFill, corrC, gauge, gaugeC (+16 more)

### Community 18 - "World: Bier Set"
Cohesion: 0.08
Nodes (23): BEDS, board, boardC, ccab, CL, clBack, clFill, clFloorC (+15 more)

### Community 19 - "Synth Sound Library"
Cohesion: 0.16
Nodes (21): A, boom(), buzzer(), cta_jingle(), gasp(), gulp(), heartbeat(), init() (+13 more)

### Community 20 - "World: Kane Set"
Cohesion: 0.10
Nodes (20): eth, ethLab, GALLERY, jars, lap, lapTop, panelC, pil1 (+12 more)

### Community 21 - "Prop Builders"
Cohesion: 0.18
Nodes (19): add(), bookshelf(), box(), candle(), crate(), flask(), GBEDS, lemonTree() (+11 more)

### Community 22 - "Final Video Pipeline"
Cohesion: 0.19
Nodes (8): Deliver MP4, cover, post.md; archive to episodes and commit, Phase 2: build video after voiceover, Doc Zap production engine (doczap/engine), Captions: 1-2 words, Poppins Bold, sentence case, y~1342, Mechanism cutaway with handwritten Caveat labels, label(), comp.html (caption overlay compositor page), window.compFrame

### Community 24 - "Music Synth"
Cohesion: 0.20
Nodes (9): ding(), fanfare(), add(), chime(), chord(), fwd(), inv(), music() (+1 more)

### Community 25 - "World: Laennec Set"
Cohesion: 0.14
Nodes (12): curtC, MC, mcFill, mcLights, ptube, stoneC, wb, WBEDS (+4 more)

### Community 26 - "Voice Timing Tools"
Cohesion: 0.22
Nodes (4): Voice step: trim pauses, align, words.json, voice_loop.wav, n2w(), norm(), finish()

### Community 27 - "Card Textures & Decals"
Cohesion: 0.15
Nodes (11): Card, cardNd(), crustC(), cvs(), decal(), drawActors(), getCard(), mapM() (+3 more)

### Community 28 - "Board & Calendar State"
Cohesion: 0.20
Nodes (11): applyDrop(), drawBoard(), drawCal(), drawGCal(), drawLabel(), drawScope(), goldState(), lerp() (+3 more)

### Community 29 - "Project Setup & Layout"
Cohesion: 0.20
Nodes (10): Doc Zap project instructions (CLAUDE.md), Doc Zap channel (@doczapstories), doczap/episodes/<slug> (kept episode outputs), Setup (npm install, playwright chromium, pip, ffmpeg), doczap/work/<slug> (gitignored scratch), Doc Zap Python requirements, numpy, pillow (+2 more)

### Community 30 - "Water Drop Geometry A"
Cohesion: 0.40
Nodes (5): dropBend(), dropR(), makeDrop(), makeDropGeo(), RP

### Community 31 - "Water Drop Geometry B"
Cohesion: 0.40
Nodes (5): dropBend(), dropR(), makeDrop(), makeDropGeo(), RP

### Community 32 - "Lottery Balls"
Cohesion: 0.67
Nodes (3): ballM(), BALLS, RBALLS

### Community 33 - "Sky Pane Decals"
Cohesion: 0.67
Nodes (3): cvs(), decal(), skyPane()

## Ambiguous Edges - Review These
- `No 'comment yes or no' CTA` → `Lottery Man caption (share ask, hashtags)`  [AMBIGUOUS]
  doczap/episodes/lottery-man/post.md · relation: conceptually_related_to
- `No 'comment yes or no' CTA` → `'Comment yes or no' ending`  [AMBIGUOUS]
  doczap/episodes/lottery-man/script.md · relation: conceptually_related_to

## Knowledge Gaps
- **17 isolated node(s):** `Claude config: graphify instructions`, `graphify skill (/graphify)`, `Doc Zap channel (@doczapstories)`, `doczap/episodes/<slug> (kept episode outputs)`, `doczap/work/<slug> (gitignored scratch)` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1061 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Doc Zap production engine (doczap/engine)` connect `Final Video Pipeline` to `World Sets (main.js)`, `Toon Character Drawing`, `SFX Mix (mix.py)`, `Engine Story & Camera`, `Render & Roman Characters`, `Synth Sound Library`, `Voice Timing Tools`, `Project Setup & Layout`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **What connects `Claude config: graphify instructions`, `graphify skill (/graphify)`, `Doc Zap channel (@doczapstories)` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `World Sets (main.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.004140786749482402 - nodes in this community are weakly interconnected._
- **Why does `Phase 2: build video after voiceover` connect `Final Video Pipeline` to `World Sets (main.js)`, `Toon Character Drawing`, `SFX Mix (mix.py)`, `Engine Story & Camera`, `Style, Script & Rules`, `Render & Roman Characters`, `Voice Timing Tools`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `Toon Character Drawing` be split into smaller, more focused modules?**
  _Cohesion score 0.05754385964912281 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `No 'comment yes or no' CTA` and `Lottery Man caption (share ask, hashtags)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `No 'comment yes or no' CTA` and `'Comment yes or no' ending`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._