# Graph Report - Claude  (2026-11-24)

## Corpus Check
- 63 files · ~140,998 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .woff2 2, .woff 1)

## Summary
- 1732 nodes · 2530 edges · 49 communities (44 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 96,952 input · 0 output

## Graph Freshness
- Built from commit: `8df26ea9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
- Doc Zap style guide (STYLE.md)
- World: Blagden Set
- render.mjs
- Captions & Overlay Layer
- World: Bats Extras
- Procedural Textures (paint.js)
- World: Heart Set
- World: Comet Set
- World: Bier Set
- audio_lib.py
- World: Kane Set
- Prop Builders
- remotion/package.json
- ink-arrow.tsx
- caption-active-pop.tsx
- World: Laennec Set
- Overlay.tsx
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
- caption-core.ts
- components.json
- compilerOptions
- roman.js
- Lottery Man script ('He Won the Lottery 14 Times... Legally')
- Standing rules
- stop-motion.ts
- Lottery Man post kit
- engine/package.json
- Remotion video
- frame-rate.ts

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
10. `InkArrow()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Lottery Man script ('He Won the Lottery 14 Times... Legally')` --references--> `ElevenLabs Patrick voice (Eleven v3)`  [EXTRACTED]
  doczap/episodes/lottery-man/script.md → CLAUDE.md
- `Lottery Man post kit` --references--> `Posting slots 11 AM / 6 PM Baghdad (UTC+3)`  [INFERRED]
  doczap/episodes/lottery-man/post.md → CLAUDE.md
- `Study reference reels and write lessons to STYLE.md` --references--> `Doc Zap style guide (STYLE.md)`  [EXTRACTED]
  CLAUDE.md → doczap/docs/STYLE.md
- `index.html (1080x1920 render canvas page)` --conceptually_related_to--> `Output spec 1080x1920 60fps H.264 -14 LUFS`  [INFERRED]
  doczap/engine/web/index.html → CLAUDE.md
- `Virality rubric (Hook/25, Value/20, Emotion/20, Platform/15, Share/10, Trend/10)` --implements--> `Virality check > 90/100`  [INFERRED]
  .claude/skills/doczap-next-video/SKILL.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Reference visual style** — doczap_docs_style_camera, doczap_docs_style_whip_pans, doczap_docs_style_characters, doczap_docs_style_worlds, doczap_docs_style_cutaway, doczap_docs_style_captions [EXTRACTED 1.00]
- **Doc Zap episode production pipeline** — _claude_skills_doczap_next_video_skill_voice_alignment, _claude_skills_doczap_next_video_skill_stills_first, _claude_skills_doczap_next_video_skill_parallel_render, _claude_skills_doczap_next_video_skill_deliver, doczap_engine_web_index, doczap_engine_web_comp [INFERRED 0.85]
- **Doc Zap quality gates before build/post** — claude_virality_check_rule, claude_fact_check_rule, claude_qc_frames_rule, _claude_skills_doczap_next_video_skill_virality_rubric, _claude_skills_doczap_next_video_skill_stills_first [INFERRED 0.85]

## Communities (49 total, 5 thin omitted)

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
Cohesion: 0.05
Nodes (63): blobPts(), bodyFront(), bodySide(), BUILD, cheeks(), clamp(), cobweb(), curve() (+55 more)

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
Nodes (53): blinkAt(), camFromKeys(), clamp(), idle(), lerp(), lerp3(), M, q() (+45 more)

### Community 8 - "World: Stapp Set"
Cohesion: 0.04
Nodes (52): BLK, boardC0, boardC1, boardT1, BTN, BUSH, bushG, CI (+44 more)

### Community 9 - "Lottery Man Episode Story"
Cohesion: 0.07
Nodes (42): actorsAt(), BASE, bulb(), cam30(), camAt(), confetti(), CUTS, DECK (+34 more)

### Community 10 - "Doc Zap style guide (STYLE.md)"
Cohesion: 0.13
Nodes (10): Doc Zap style guide (STYLE.md), Captions: 1-2 words, Poppins Bold, sentence case, y~1342, Characters: big white round heads, expressive faces, Mechanism cutaway with handwritten Caveat labels, Depth of field (close-ups cinf 11-13, macro 30+), Emotes (lightbulb, ?, !, heart, Zzz), Reference reels (Rick's Clips, Segment Zero), Nov 23 2026, Sound: SFX per action, whoosh per whip, music dip, -14 LUFS (+2 more)

### Community 11 - "World: Blagden Set"
Cohesion: 0.05
Nodes (39): BR_, BT, CANDF, candL, chair, CLK, clockC, DSK (+31 more)

### Community 12 - "render.mjs"
Cohesion: 0.17
Nodes (6): Full render in 2-3 parallel RESUME ranges, Stills-first QC via contact sheet, frames, srv, t0, sheet.sh script

### Community 13 - "Captions & Overlay Layer"
Cohesion: 0.12
Nodes (29): comp.html (caption overlay compositor page), window.compFrame, bA, back(), badge(), bB, bolt(), callout() (+21 more)

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

### Community 19 - "audio_lib.py"
Cohesion: 0.07
Nodes (37): Phase 2: build video after voiceover, Voice step: trim pauses, align, words.json, voice_loop.wav, Doc Zap production engine (doczap/engine), ding(), fanfare(), label(), n2w(), norm() (+29 more)

### Community 20 - "World: Kane Set"
Cohesion: 0.10
Nodes (20): eth, ethLab, GALLERY, jars, lap, lapTop, panelC, pil1 (+12 more)

### Community 21 - "Prop Builders"
Cohesion: 0.18
Nodes (19): add(), bookshelf(), box(), candle(), crate(), flask(), GBEDS, lemonTree() (+11 more)

### Community 22 - "remotion/package.json"
Cohesion: 0.05
Nodes (37): allowScripts, esbuild, react-dom@19.3.1, @remotion/cli@4.0.546, @remotion/google-fonts@^4.0.546, description, devDependencies, eslint@10.15.0 (+29 more)

### Community 23 - "ink-arrow.tsx"
Cohesion: 0.14
Nodes (32): brushFilterId(), BrushGrain(), brushGrainScale(), brushHalfWidth(), BrushPoint, brushReach(), brushRibbon(), BrushTaper (+24 more)

### Community 24 - "caption-active-pop.tsx"
Cohesion: 0.16
Nodes (22): CaptionActivePopContent(), CaptionActivePopProps, clamp, enterEasing, midway(), POP_SPRING, RELEASE_SPRING, CaptionOutline (+14 more)

### Community 25 - "World: Laennec Set"
Cohesion: 0.14
Nodes (12): curtC, MC, mcFill, mcLights, ptube, stoneC, wb, WBEDS (+4 more)

### Community 26 - "Overlay.tsx"
Cohesion: 0.14
Nodes (20): dependencies, react@19.3.1, remotion@^4.0.546, @remotion/captions@^4.0.546, @remotion/fonts@^4.0.546, CaptionActivePop, Handwrite(), CAVEAT (+12 more)

### Community 27 - "Card Textures & Decals"
Cohesion: 0.15
Nodes (11): Card, cardNd(), crustC(), cvs(), decal(), drawActors(), getCard(), mapM() (+3 more)

### Community 28 - "Board & Calendar State"
Cohesion: 0.20
Nodes (11): applyDrop(), drawBoard(), drawCal(), drawGCal(), drawLabel(), drawScope(), goldState(), lerp() (+3 more)

### Community 29 - "Project Setup & Layout"
Cohesion: 0.17
Nodes (11): Deliver MP4, cover, post.md; archive to episodes and commit, Doc Zap project instructions (CLAUDE.md), Doc Zap channel (@doczapstories), doczap/episodes/<slug> (kept episode outputs), Setup (npm install, playwright chromium, pip, ffmpeg), doczap/work/<slug> (gitignored scratch), Doc Zap Python requirements, numpy (+3 more)

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

### Community 38 - "caption-core.ts"
Cohesion: 0.13
Nodes (19): buildCaptionPages(), CaptionPageWindow, CaptionPagingOptions, CaptionPreviousPage, CaptionsState, CaptionTokenState, CaptionTokenStatus, CaptionWordRect (+11 more)

### Community 39 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, registries, @remocn (+9 more)

### Community 40 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 41 - "roman.js"
Cohesion: 0.22
Nodes (6): cheeks(), cobweb(), galea(), helmetCard(), OUTFITS, romanFront()

### Community 42 - "Lottery Man script ('He Won the Lottery 14 Times... Legally')"
Cohesion: 0.24
Nodes (10): doczap-next-video skill, Phase 1: pick story, fact-check, script, virality check, Virality rubric (Hook/25, Value/20, Emotion/20, Platform/15, Share/10, Trend/10), Lottery Man script ('He Won the Lottery 14 Times... Legally'), Buy-every-combination lottery strategy, 'Comment yes or no' ending, Stefan Mandel, Lottery Man storyboard (9 shots) (+2 more)

### Community 43 - "Standing rules"
Cohesion: 0.20
Nodes (4): Output spec 1080x1920 60fps H.264 -14 LUFS, ElevenLabs Patrick voice (Eleven v3), index.html (1080x1920 render canvas page), Lottery Man fact check

### Community 44 - "stop-motion.ts"
Cohesion: 0.31
Nodes (7): HandwriteProps, DEFAULT_STEP, Jitter, paperJitter(), qf(), qstep(), steppedSpring()

### Community 45 - "Lottery Man post kit"
Cohesion: 0.25
Nodes (8): Diyar (channel owner), Posting slots 11 AM / 6 PM Baghdad (UTC+3), Posting kit (title, share-ask caption, save-ask pinned comment, description, tags, sources, cover), Lottery Man post kit, Lottery Man caption (share ask, hashtags), Lottery Man pinned comment (save ask), Lottery Man titles and alternates, Lottery Man YouTube description and sources

### Community 46 - "engine/package.json"
Cohesion: 0.33
Nodes (6): dependencies, playwright@1.63.0, name, private, type, playwright

### Community 47 - "Remotion video"
Cohesion: 0.29
Nodes (6): Commands, Docs, Help, Issues, License, Remotion video

## Ambiguous Edges - Review These
- `Lottery Man caption (share ask, hashtags)` → `No 'comment yes or no' CTA`  [AMBIGUOUS]
  doczap/episodes/lottery-man/post.md · relation: conceptually_related_to
- `'Comment yes or no' ending` → `No 'comment yes or no' CTA`  [AMBIGUOUS]
  doczap/episodes/lottery-man/script.md · relation: conceptually_related_to

## Knowledge Gaps
- **17 isolated node(s):** `Characters: big white round heads, expressive faces`, `Depth of field (close-ups cinf 11-13, macro 30+)`, `Emotes (lightbulb, ?, !, heart, Zzz)`, `Reference reels (Rick's Clips, Segment Zero), Nov 23 2026`, `Worlds: textured sets, warm motivated light, depth haze, selective bloom` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1142 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Doc Zap production engine (doczap/engine)` connect `audio_lib.py` to `World Sets (main.js)`, `Toon Character Drawing`, `SFX Mix (mix.py)`, `Engine Story & Camera`, `roman.js`, `render.mjs`, `Project Setup & Layout`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `Characters: big white round heads, expressive faces`, `Depth of field (close-ups cinf 11-13, macro 30+)`, `Emotes (lightbulb, ?, !, heart, Zzz)` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `World Sets (main.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.004140786749482402 - nodes in this community are weakly interconnected._
- **Why does `Phase 2: build video after voiceover` connect `audio_lib.py` to `World Sets (main.js)`, `Toon Character Drawing`, `SFX Mix (mix.py)`, `Engine Story & Camera`, `roman.js`, `Lottery Man script ('He Won the Lottery 14 Times... Legally')`, `render.mjs`, `Project Setup & Layout`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `Toon Character Drawing` be split into smaller, more focused modules?**
  _Cohesion score 0.05754385964912281 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Lottery Man caption (share ask, hashtags)` and `No 'comment yes or no' CTA`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `'Comment yes or no' ending` and `No 'comment yes or no' CTA`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._