# Graph Report - Claude  (2026-11-24)

## Corpus Check
- 72 files · ~146,136 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .woff2 2, .woff 1)

## Summary
- 1819 nodes · 2718 edges · 61 communities (55 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.85)
- Token cost: 96,952 input · 0 output

## Graph Freshness
- Built from commit: `0319ac34`
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
- devDependencies
- ink-arrow.tsx
- caption-active-pop.tsx
- World: Laennec Set
- dependencies
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
- episode.py
- Lottery Man post kit
- engine/package.json
- Remotion video
- lens-zoom.tsx
- Episode.tsx
- react
- music_rich
- remotion/package.json
- light-leak.tsx
- remocn-add.mjs
- push-through.tsx
- warp-dissolve.tsx
- doczap-next-video skill
- align_ps.py
- remotion.config.ts
- scripts

## God Nodes (most connected - your core abstractions)
1. `noise()` - 43 edges
2. `rng()` - 24 edges
3. `env()` - 22 edges
4. `Doc Zap style guide (STYLE.md)` - 21 edges
5. `remotion` - 18 edges
6. `bodyFront()` - 18 edges
7. `bodySide()` - 18 edges
8. `bodyFront()` - 18 edges
9. `bodySide()` - 18 edges
10. `romanFront()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Study reference reels and write lessons to STYLE.md` --references--> `Doc Zap style guide (STYLE.md)`  [EXTRACTED]
  CLAUDE.md → doczap/docs/STYLE.md
- `doczap-next-video skill` --references--> `Lottery Man script ('He Won the Lottery 14 Times... Legally')`  [INFERRED]
  .claude/skills/doczap-next-video/SKILL.md → doczap/episodes/lottery-man/script.md
- `Lottery Man post kit` --references--> `Posting slots 11 AM / 6 PM Baghdad (UTC+3)`  [INFERRED]
  doczap/episodes/lottery-man/post.md → CLAUDE.md
- `doczap-next-video skill` --references--> `Doc Zap style guide (STYLE.md)`  [EXTRACTED]
  .claude/skills/doczap-next-video/SKILL.md → doczap/docs/STYLE.md
- `Doc Zap project instructions (CLAUDE.md)` --references--> `Doc Zap style guide (STYLE.md)`  [EXTRACTED]
  CLAUDE.md → doczap/docs/STYLE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Reference visual style** — doczap_docs_style_camera, doczap_docs_style_whip_pans, doczap_docs_style_characters, doczap_docs_style_worlds, doczap_docs_style_cutaway, doczap_docs_style_captions [EXTRACTED 1.00]
- **Doc Zap episode production pipeline** — _claude_skills_doczap_next_video_skill_voice_alignment, _claude_skills_doczap_next_video_skill_stills_first, _claude_skills_doczap_next_video_skill_parallel_render, _claude_skills_doczap_next_video_skill_deliver, doczap_engine_web_index, doczap_engine_web_comp [INFERRED 0.85]
- **Doc Zap quality gates before build/post** — claude_virality_check_rule, claude_fact_check_rule, claude_qc_frames_rule, _claude_skills_doczap_next_video_skill_virality_rubric, _claude_skills_doczap_next_video_skill_stills_first [INFERRED 0.85]

## Communities (61 total, 6 thin omitted)

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
Nodes (55): blinkAt(), camFromKeys(), clamp(), idle(), lerp(), lerp3(), M, q() (+47 more)

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
Cohesion: 0.12
Nodes (10): Full render in 2-3 parallel RESUME ranges, Phase 2: build video after voiceover, Stills-first QC via contact sheet, Voice step: trim pauses, align, words.json, voice_loop.wav, Doc Zap production engine (doczap/engine), label(), frames, srv (+2 more)

### Community 13 - "Captions & Overlay Layer"
Cohesion: 0.11
Nodes (30): comp.html (caption overlay compositor page), window.compFrame, bA, back(), badge(), bB, bolt(), callout() (+22 more)

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
Cohesion: 0.15
Nodes (22): A, boom(), buzzer(), cta_jingle(), finish(), gasp(), gulp(), heartbeat() (+14 more)

### Community 20 - "World: Kane Set"
Cohesion: 0.10
Nodes (20): eth, ethLab, GALLERY, jars, lap, lapTop, panelC, pil1 (+12 more)

### Community 21 - "Prop Builders"
Cohesion: 0.18
Nodes (19): add(), bookshelf(), box(), candle(), crate(), flask(), GBEDS, lemonTree() (+11 more)

### Community 22 - "devDependencies"
Cohesion: 0.14
Nodes (13): devDependencies, eslint@10.15.0, prettier@3.8.1, @remotion/eslint-config-flat@4.0.546, @types/react@19.3.0, @types/web@0.0.166, typescript@5.9.3, eslint (+5 more)

### Community 23 - "ink-arrow.tsx"
Cohesion: 0.09
Nodes (47): brushFilterId(), BrushGrain(), brushGrainScale(), brushHalfWidth(), BrushPoint, brushReach(), brushRibbon(), BrushTaper (+39 more)

### Community 24 - "caption-active-pop.tsx"
Cohesion: 0.17
Nodes (20): CaptionActivePopContent(), CaptionActivePopProps, clamp, enterEasing, midway(), POP_SPRING, RELEASE_SPRING, CaptionOutline (+12 more)

### Community 25 - "World: Laennec Set"
Cohesion: 0.14
Nodes (12): curtC, MC, mcFill, mcLights, ptube, stoneC, wb, WBEDS (+4 more)

### Community 26 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @paper-design/shaders-react@^0.0.82, react@19.3.1, react-dom@19.3.1, remotion@4.0.546, @remotion/captions@4.0.546, @remotion/fonts@4.0.546, @remotion/google-fonts@4.0.546 (+5 more)

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
Cohesion: 0.32
Nodes (8): ElevenLabs Patrick voice (Eleven v3), Lottery Man YouTube description and sources, Lottery Man script ('He Won the Lottery 14 Times... Legally'), Buy-every-combination lottery strategy, 'Comment yes or no' ending, Stefan Mandel, Lottery Man storyboard (9 shots), Virginia lottery 1992 ($27M jackpot, ~7.06M combinations)

### Community 43 - "Standing rules"
Cohesion: 0.22
Nodes (3): Output spec 1080x1920 60fps H.264 -14 LUFS, index.html (1080x1920 render canvas page), Lottery Man fact check

### Community 44 - "episode.py"
Cohesion: 0.16
Nodes (6): handle_ranges(), missing(), props(), Quiet, remotion(), run()

### Community 45 - "Lottery Man post kit"
Cohesion: 0.29
Nodes (7): Diyar (channel owner), Posting slots 11 AM / 6 PM Baghdad (UTC+3), Posting kit (title, share-ask caption, save-ask pinned comment, description, tags, sources, cover), Lottery Man post kit, Lottery Man caption (share ask, hashtags), Lottery Man pinned comment (save ask), Lottery Man titles and alternates

### Community 46 - "engine/package.json"
Cohesion: 0.33
Nodes (6): dependencies, playwright@1.63.0, name, private, type, playwright

### Community 47 - "Remotion video"
Cohesion: 0.29
Nodes (6): Commands, Docs, Help, Issues, License, Remotion video

### Community 48 - "lens-zoom.tsx"
Cohesion: 0.12
Nodes (23): fovHalf(), HalfProps, hashed(), LENS_ZOOM_DURATION_IN_FRAMES, LENS_ZOOM_EASE_IN, LENS_ZOOM_EASE_OUT, lensMagnification(), lensZoom() (+15 more)

### Community 49 - "Episode.tsx"
Cohesion: 0.20
Nodes (13): DocZapEpisode(), DocZapEpisodeProps, DocZapShot, DocZapTransition, episodeScenes(), pad(), Plates(), PRESENTATIONS (+5 more)

### Community 50 - "react"
Cohesion: 0.17
Nodes (13): @remotion/transitions@4.0.546, clamp, closingRadius(), irisWipe(), irisWipeDefaults, IrisWipePresentation(), IrisWipeProps, clampOpts (+5 more)

### Community 51 - "music_rich"
Cohesion: 0.20
Nodes (9): ding(), fanfare(), add(), chime(), chord(), fwd(), inv(), music() (+1 more)

### Community 52 - "remotion/package.json"
Cohesion: 0.18
Nodes (10): allowScripts, esbuild, description, engines, node, license, name, private (+2 more)

### Community 53 - "light-leak.tsx"
Cohesion: 0.33
Nodes (8): FLARES, heat(), Leak(), lightLeak(), lightLeakDefaults, LightLeakOrigin, LightLeakPresentation(), LightLeakProps

### Community 54 - "remocn-add.mjs"
Cohesion: 0.33
Nodes (3): add(), npmDeps, seen

### Community 55 - "push-through.tsx"
Cohesion: 0.47
Nodes (5): clampOpts, midway(), pushThrough(), PushThroughPresentation(), PushThroughProps

### Community 56 - "warp-dissolve.tsx"
Cohesion: 0.40
Nodes (5): clampOpts, DEFAULT_COLORS, warpDissolve(), WarpDissolvePresentation(), WarpDissolveProps

### Community 57 - "doczap-next-video skill"
Cohesion: 0.40
Nodes (4): doczap-next-video skill, Phase 1: pick story, fact-check, script, virality check, Virality rubric (Hook/25, Value/20, Emotion/20, Platform/15, Share/10, Trend/10), Lottery Man virality check 95/100

### Community 60 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, upgrade

## Ambiguous Edges - Review These
- `No 'comment yes or no' CTA` → `Lottery Man caption (share ask, hashtags)`  [AMBIGUOUS]
  doczap/episodes/lottery-man/post.md · relation: conceptually_related_to
- `No 'comment yes or no' CTA` → `'Comment yes or no' ending`  [AMBIGUOUS]
  doczap/episodes/lottery-man/script.md · relation: conceptually_related_to

## Knowledge Gaps
- **17 isolated node(s):** `Characters: big white round heads, expressive faces`, `Depth of field (close-ups cinf 11-13, macro 30+)`, `Emotes (lightbulb, ?, !, heart, Zzz)`, `Reference reels (Rick's Clips, Segment Zero), Nov 23 2026`, `Worlds: textured sets, warm motivated light, depth haze, selective bloom` (+12 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1173 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Doc Zap production engine (doczap/engine)` connect `render.mjs` to `World Sets (main.js)`, `Toon Character Drawing`, `SFX Mix (mix.py)`, `Engine Story & Camera`, `roman.js`, `episode.py`, `audio_lib.py`, `align_ps.py`, `Project Setup & Layout`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **What connects `Characters: big white round heads, expressive faces`, `Depth of field (close-ups cinf 11-13, macro 30+)`, `Emotes (lightbulb, ?, !, heart, Zzz)` to the rest of the system?**
  _17 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `World Sets (main.js)` be split into smaller, more focused modules?**
  _Cohesion score 0.004140786749482402 - nodes in this community are weakly interconnected._
- **Why does `Phase 2: build video after voiceover` connect `render.mjs` to `World Sets (main.js)`, `Toon Character Drawing`, `SFX Mix (mix.py)`, `Engine Story & Camera`, `roman.js`, `episode.py`, `doczap-next-video skill`, `Project Setup & Layout`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Should `Toon Character Drawing` be split into smaller, more focused modules?**
  _Cohesion score 0.05754385964912281 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `No 'comment yes or no' CTA` and `Lottery Man caption (share ask, hashtags)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `No 'comment yes or no' CTA` and `'Comment yes or no' ending`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._