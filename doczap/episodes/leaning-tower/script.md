# Doc Zap: they saved the Leaning Tower by digging under it

**The strange act:** in the 1990s the Leaning Tower of Pisa was close to falling, and engineers saved it by **digging soil out from under it**.
**Cutaway:** a glass cross-section of the ground under the tower: soft clay under the low (south) side, drill tubes under the high (north) side pulling soil out, the high side settling, and the tower rotating back. Handwritten labels: "soft clay", "soil out" and "40 cm back".
**Length:** 103 words, about 36–38 s with Patrick on Eleven v4.
**Built in Blender** on Diyar's computer (first Blender episode): real stone, real soil, physics for the lead blocks and the soil, and frost for the freezing scene. Finished in Remotion with remocn (transitions + captions) as usual.

## Script (ElevenLabs Patrick, Eleven v4; tag-free)

Nobody tells you Pisa's tower was saved... by digging.

In nineteen ninety, it leaned so far... Pisa closed it.

Engineers stacked hundreds of tonnes of lead on one side.

Then they froze the ground... and it leaned even more.

So engineer John Burland had a better idea.

Dig.

Under a tower that was already falling.

You see, the low side had sunk into soft clay.

So they drilled under the high side...

and pulled out soil, a little at a time.

The high side sank... and the whole tower tipped back.

About forty centimetres.

To stop Pisa's tower falling... they made it sink.

*(Cut the voice right after "they made it sink."; the video loops straight back to "Nobody tells you Pisa's tower was saved...")*

## Hook options (ig-reel `hookscore.py`)
| Score | Hook |
|---|---|
| **87.0 STRONG** ✅ | Nobody tells you Pisa's tower was saved... by digging. |
| 88.0 STRONG | To stop Pisa's tower falling... they dug under it. Nobody tells you that. (13 words, too long) |
| 85.6 STRONG | Nobody tells you how Pisa's tower was saved... with a shovel. (inaccurate: they used drills) |
| 59.6 OK | To stop Pisa's tower falling, they dug under it. |
| 42.2 WEAK | To save the Leaning Tower, they dug under it. |
| 28.2 WEAK | Your tower is falling... so you dig under it? |

## Tool checks
- **Beat timer** (`beats.py`): 13 beats, 37.5 s against a 38 s target, no beat over 4 s, and the last line repeats "Pisa's tower" from the hook, so it loops. The hook reads 3.3 s at the tool's 165 words a minute; Patrick on v4 ran about 180 words a minute on the Ice King, so it lands at about 3 s. The tool flags beats 6–8 as having "nothing concrete", but it doesn't count spelled-out numbers ("nineteen ninety"), which Patrick needs.
- **Human check** (`detect.py`): 50.3 REVIEW (short, punchy spoken lines score like that; expected for a voice script).

## YouTube skills (yt-script, yt-package, yt-seo)
**yt-script `hookscore.py`** (stricter; built for advice-style hooks, and it weights the weakest property heavily):
| YT score | IG score | Hook |
|---|---|---|
| 46 | 85.6 | Nobody tells you Pisa's tower almost fell... until they dug under it. (12 words, too long) |
| **42** | **87.0** | **Nobody tells you Pisa's tower was saved... by digging.** ✅ kept |
| 33 | 30.0 | Pisa's tower was about to fall... so they dug under it. |

For scale, on the same tool: Dutch Water Line hook 43, phosphorus reel 39, Ice King 34. Story hooks all land in the 30s–40s here, so it's used as a tiebreaker, not a gate.

**Title + cover (yt-package `title.py`):**
| Score | Title | Cover |
|---|---|---|
| **100** ✅ | **They Dug Under the Leaning Tower in 1999** (40 characters) | **IT WAS FALLING** |
| 100 | In 1990, Pisa's Tower Nearly Fell | THEY DUG UNDER |
| 98 | How Digging Saved the Leaning Tower in 1999 (cut on mobile) | IT WAS FALLING |
| 94 | Pisa's Tower Was Saved by Digging (no number) | WHY DIG? |

**Description draft (yt-seo):** the first two lines carry the searches "how was the Leaning Tower of Pisa saved" and "Leaning Tower of Pisa straightened".
> How was the Leaning Tower of Pisa saved? In 1990 it leaned so far it was closed, and two fixes made it worse.
> Engineer John Burland's answer: drill under the high side and pull out soil, a little at a time. The Leaning Tower of Pisa straightened by about 40 cm.

Tags: leaning tower of pisa, pisa tower, how pisa tower was saved, john burland, soil extraction, underexcavation, engineering history, italy, true story, doc zap

## Beat map (Blender shots)
| Time (approx.) | Beat | Picture |
|---|---|---|
| 0–3 s | Hook: saved by digging | Macro low angle: a drill bit biting into dark soil, then a focus pull up to the leaning tower towering above, marble glowing in warm sun |
| 3–6.5 s | 1990, closed | Tourists shooed out, a gate slams with a "CLOSED" sign; the tower's top hangs over the frame (feels about to fall) |
| 6.5–10 s | Lead weights | A crane lowers stacks of lead blocks onto the north side; engineers with hard hats and worried faces ("sweat" emote) |
| 10–13.5 s | Freezing backfires | Pipes hiss white frost into the ground; the tower creaks and tilts a hair further; an engineer's "!" emote |
| 13.5–16 s | Burland's idea | Close-up of John Burland (glasses, hard hat) with a lightbulb emote |
| 16–19 s | "Dig." / "already falling" | Whip-pan to a drill rig at the tower's base, POV looking straight up the overhanging tower |
| 19–23 s | "You see,": the mechanism | **Glass cutaway** of the ground: the south side sunk into soft clay (label "soft clay", arrow) |
| 23–29 s | Drilling the high side | In the cutaway, angled drill tubes under the north side pull out little plugs of soil (label "soil out", arrows) |
| 29–33 s | The tower tips back | The north side settles a few millimetres, the whole tower rotates back in slow motion; ghost outline of the old lean (label "40 cm back") |
| 33–37 s | Ironic punchline, loop | Wide golden-hour shot of the tower, then a push-in back down to the drill bit in the soil (the opening frame) |

## Virality check
| Category | Score | Why |
|---|---|---|
| Hook | 24 / 25 | A world-famous landmark plus a counterintuitive act; hookscore 87 STRONG |
| Value | 18 / 20 | A real "do the opposite" engineering trick almost nobody knows |
| Emotion | 17 / 20 | Real danger (closed, about to fall), two fixes that make it worse, then the payoff |
| Platform fit | 14 / 15 | About 37 s, loops, huge visuals (tower, frost, cutaway) |
| Shareability | 9 / 10 | "Wait, they dug UNDER it?" is a send-to-a-friend fact |
| Trend | 9 / 10 | Famous-landmark engineering explainers are performing well |
| **Total** | **91 / 100** | Passes (needs more than 90) |

**Second opinions:** virality-predictor (TikTok + Instagram) **88 / 100**; ig-viral 8-line pre-build check **8.5 / 10** (hook 9, evidence 7, one idea 9, specificity 9, payoff and loop 9, shareability 8, retention design 9, fresh angle 8). Weakest: *evidence* (no swipe file yet). None of these predicts views.

## Fact check
| Claim in the script | Status | Sources |
|---|---|---|
| In 1990 the tower was closed because it leaned so far (fear of collapse); it reopened in December 2001 | ✅ Confirmed | HISTORY.com; VOA; Ingenia |
| Engineers stacked hundreds of tonnes of lead on one (the north) side | ✅ Confirmed (sources give 600–900 tonnes in total, so the script says "hundreds") | Ingenia (900 tonnes by Sept 1995); PBS NOVA; Gulf News |
| They froze the ground, and the tower leaned more | ✅ Confirmed (September 1995, liquid nitrogen for new anchors; the tower moved, more lead was added in an emergency) | PBS NOVA; Gulf News |
| John Burland proposed removing soil from under the tower | ✅ Confirmed (he was the committee's soil engineer; the committee adopted "underexcavation") | PBS NOVA; Burland, Jamiolkowski & Viggiani (Soils and Foundations); Ingenia |
| The low (south) side had sunk into soft clay | ✅ Confirmed | Ingenia; ICE |
| They drilled under the high (north) side and removed small amounts of soil at a time | ✅ Confirmed (one popular source wrongly says "south"; the engineering sources all say north) | ICE; Ingenia; Burland et al.; PBS NOVA |
| The tower tipped back about forty centimetres | ✅ Confirmed (sources say 38–44 cm, so the script says "about") | Artnet; The Art Newspaper; ICE |

**What I deliberately left out:**
- **Exact angles in degrees.** Sources disagree (5.5°, "just under five", 6°).
- **The soil tonnage.** There's no reliable figure.
- **"Everyone thought it would fall over."** No source says so, so the script doesn't claim it.
- **The tower's height and weight.** Sources differ.

## Sources
1. ICE, "Stabilising the Leaning Tower of Pisa": https://www.ice.org.uk/what-is-civil-engineering/what-do-civil-engineers-do/stabilising-the-leaning-tower-of-pisa/
2. Ingenia, "The stabilisation of the Leaning Tower of Pisa" (Burland): https://ingenia.org.uk/articles/the-stabilisation-of-the-leaning-tower-of-pisa/
3. Burland, Jamiolkowski & Viggiani, *Soils and Foundations* 43(5): https://www.jstage.jst.go.jp/article/sandf1995/43/5/43_5_63/_article
4. PBS NOVA, "Fall of the Leaning Tower", interventions: https://www.pbs.org/wgbh/nova/pisa/interventions2.html
5. Gulf News, "A structural revival": https://gulfnews.com/world/oceania/a-structural-revival-1.669474
6. HISTORY.com, "Leaning Tower of Pisa reopens": https://www.history.com/this-day-in-history/december-15/leaning-tower-of-pisa-reopens
7. Artnet, "The Leaning Tower of Pisa Now Leans Less": https://news.artnet.com/art-world-archives/leaning-tower-of-pisa-reduced-tilt-2235641
8. Britannica: https://www.britannica.com/question/What-efforts-have-been-made-to-ensure-the-Leaning-Tower-of-Pisa-stays-up

---
**Next step:** make the MP3 in ElevenLabs with **Patrick on Eleven v4** using the script above. Then, at your computer, open the Claude desktop app with Remote Control on, send the MP3 and say "connect".
