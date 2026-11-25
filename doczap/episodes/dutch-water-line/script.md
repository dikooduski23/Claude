# Doc Zap: the Dutch flooded their own country

**The strange act:** in 1672, the Dutch opened their own dikes and flooded their own farmland to stop an invasion.
**Cutaway:** a glass cross-section of the flooded polder: knee-deep water on top, a hidden ditch underneath. A boat runs aground and a soldier steps into the ditch. Handwritten labels: "knee-deep" and "hidden ditch".
**Length:** about 108 words, roughly 38–42 s with Patrick on Eleven v4.
**Edit:** 3D plates from our engine, finished in **Remotion with remocn components** (animated captions and text beats). The handwritten labels, whip-pans and glossy glow stay the same.

## Script v2 (ElevenLabs Patrick, Eleven v4; tag-free), rewritten Nov 24 with the agent skills

**Voiced by Claude via the ElevenLabs API** (Nov 25 2026): Patrick `ODq5zmih8GrVes37Dizd`, Eleven v4; 45.6 s raw, 40.6 s after trimming; Scribe word timing 112/112 words (`words.json`). 112 words, about 38–41 s.

Imagine drowning your country... to stop France's army.

In sixteen seventy-two, Europe's biggest army marched on Holland.

The Dutch army was tiny.

So they opened the dikes... and flooded their own farms.

It looked useless. The water was only knee-deep.

Any French soldier could just wade right through it.

But they couldn't.

You see, it was too deep to march through...

and too shallow for French boats.

And under the water hid ditches and canals.

One wrong step... and a soldier vanished.

Cannons sank. Horses panicked.

Europe's biggest army... stopped by a puddle.

For centuries, the Dutch fought to keep the sea out.

Then they saved their country... by letting it in.

*(Cut the voice right after "by letting it in."; the video loops straight back to "Imagine drowning your country...")*

### Hook options (ig-reel `hookscore.py`)
| Score | Hook |
|---|---|
| **77.8 STRONG** ✅ | Imagine drowning your country... to stop France's army. |
| 62.6 OK | To stop France's army, the Dutch drowned their own country. |
| 49.6 WEAK | In sixteen seventy-two, the Dutch drowned their own farms to stop an army. |
| 40.8 WEAK | The Dutch stopped the biggest army in Europe... with a puddle. |
| 37.8 WEAK | In sixteen seventy-two, the Dutch flooded their own country... on purpose. (v1) |

### What the tools changed from v1
- **Hook:** v1's opening scored 37.8 (no stakes, nothing aimed at the viewer). The new one speaks to "you", names France and runs 8 words.
- **Beats:** v1 had five lines over 4 seconds; v2 has none (`beats.py`: all flags clear, 40.7 s against a 38 s target).
- **Specificity:** "French" added where three beats in a row had nothing concrete.
- **Human check** (`ig-human detect.py`): 62.4 (it marks the short, punchy spoken lines as "REVIEW", which is expected for a voice script).

### Beat map
| Time (approx.) | Beat | Picture |
|---|---|---|
| 0–3 s | Hook: flooding their own country | Close-up of a Dutch dike-keeper hauling a sluice gate open; water bursts past the lens in slow motion, focus pulls to his determined face |
| 3–7 s | Stakes | Top-down shot of a huge French column (blue coats) against a tiny Dutch line, then a whip-pan |
| 7–11 s | Opening the dikes | Water pours over the farms: cows, a windmill, a farmer's "?" emote |
| 11–15 s | "It looked useless" | A French general smirks at the knee-deep water with a "smug" side-eye; soldiers start wading in |
| 15–17 s | Rehook: "But they couldn't." | Hard stop, low angle at water level |
| 17–25 s | "You see,": the mechanism | Glass cutaway of the polder: knee-deep water, a boat scraping the bottom, a hidden ditch below, with "knee-deep" and "hidden ditch" labels and a red circle |
| 25–31 s | Chaos | A soldier drops into a ditch (only his hat floats), a cannon tilts and sinks, a horse rears ("!" emote) |
| 31–33 s | Stopped by a puddle | Wide shot of the stuck army in the shimmering flood at sunset |
| 33–41 s | Ironic punchline, loop | A dike-keeper by a windmill, then back to the opening sluice gate |

## Virality check
| Category | Score | Why |
|---|---|---|
| Hook | 24 / 25 | Speaks to the viewer and names the absurd act in 8 words; hookscore 77.8 STRONG |
| Value | 19 / 20 | A real, clever mechanism (too deep to march, too shallow to sail, hidden ditches) most people have never heard |
| Emotion | 18 / 20 | Underdog stakes, "that's stupid" doubt, the twist, then an ironic payoff |
| Platform fit | 14 / 15 | Big visuals (bursting dikes, a stuck army, a vanishing soldier), a clean cutaway, about 40 s, loops |
| Shareability | 9 / 10 | "Send to a friend": the ultimate defensive life hack |
| Trend | 8 / 10 | "Genius war tactics" and history-hack reels are performing well right now |
| **Total** | **92 / 100** | Passes (needs more than 90) |

**Second opinions:** virality-predictor (TikTok + Instagram, same 6 categories) **88 / 100**; ig-viral 8-line pre-build check **8.4 / 10** (weakest: *evidence*, since there's no swipe file yet, and *fresh angle*, since war-tactics reels are common; fixed by leading with the self-flooding twist instead of the war). None of these predicts views.

## Fact check
| Claim in the script | Status | Sources |
|---|---|---|
| In 1672 the Dutch opened dikes and deliberately flooded their own land to stop the invaders (the Holland Water Line) | ✅ Confirmed | Britannica, "Dutch War"; Wikipedia, "Dutch Waterline"; Wikipedia, "Franco-Dutch War" |
| The invader was France under Louis XIV, then the largest army in Europe; the Dutch army was small and outmatched | ✅ Confirmed | Britannica, "Dutch War"; Wikipedia, "Franco-Dutch War"; Cambridge, *Rampjaar reconsidered* |
| The water was roughly knee-deep | ✅ Confirmed (exact depth varies by source, so the script says "knee-deep" only) | Vestingmuseum (knee-deep); Google Arts & Culture (40–50 cm); Stelling van Amsterdam (0.2–0.3 m in polders) |
| Too deep to march through, too shallow for boats | ✅ Confirmed | Vestingmuseum; Google Arts & Culture; Wikipedia, "Dutch Waterline" |
| Hidden ditches and canals under the water made it treacherous | ✅ Confirmed | Wikipedia, "Dutch Waterline" (ditches and trous de loup under the water level); stayokay.com / neverwasmag.com accounts of the hidden ditches and canals |
| The line stopped Louis XIV's army from conquering Holland | ✅ Confirmed | Wikipedia, "Dutch Waterline"; Cambridge (French forces "unable to force the line of inundation") |
| "Cannons sank. Horses panicked. One wrong step... a soldier vanished." | ⚠️ Dramatised summary | This is the narrator describing the effect of hidden ditches on an army. It isn't presented as a specific recorded incident, and no quotes are invented |

**What I deliberately left out:**
- **Exact depth in centimetres.** Sources range from 20 to 50 cm.
- **Troop numbers.** Sources differ.
- **The 1672–73 winter ice crossing and thaw.** It's only partly sourced, and some sources mix it up with 1795.
- **Any claim that the French laughed.** No source says so, so the script says the water "looked useless" instead.

## Sources
1. Britannica, "Dutch War": https://www.britannica.com/event/Dutch-War
2. Wikipedia, "Dutch Waterline": https://en.wikipedia.org/wiki/Dutch_Waterline
3. Wikipedia, "Franco-Dutch War": https://en.wikipedia.org/wiki/Franco-Dutch_War
4. Google Arts & Culture, "Dutch Water Defence Lines": https://artsandculture.google.com/story/eAVh8O9YIC9Pjg
5. Vestingmuseum Naarden, the waterline: https://www.vestingmuseum.nl/waterline/?lang=en
6. Stelling van Amsterdam, usage of the defence line: https://stelling-amsterdam.nl/english/defenceline/usage/index.php
7. Cambridge University Press, *Rampjaar reconsidered* (chapter PDF)

---
**Next step:** make the MP3 in ElevenLabs with **Patrick on Eleven v4** using the script above, and send it here.
