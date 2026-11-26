# Doc Zap quality bar (CONSTRAINTS.md)

Built with the `constraint-driven-development` skill (addyosmani/agent-skills, installed in `.claude/skills/`).
This is the written contract for every episode. **Nobody lowers a number here without Diyar saying so in chat.** If a check fails, fix the episode; never edit the threshold to make it pass. Every change to this file says who asked and when.

## Floor (always enforced)
- Never post for Diyar. He posts at 11 AM and 6 PM Baghdad time (UTC+3).
- Every factual claim has **2+ independent sources**. A claim with one source, or with sources that disagree, is left out and listed under "left out" in the fact check. No invented quotes presented as history.
- The story is **little-known** (Lottery Man flopped at 211 plays because people knew it) and not a repeat of anything in `doczap/episodes/`.
- No episode number, watermark, username, progress bar or border on screen.
- **No fades, blended frames or double images** in transitions: only hard cuts or in-camera whip-pans with directional blur.
- Props are physically right: hands grip tools, nothing floats, glass reads as glass.
- The last line flows back into line 1 (loop). No comment CTA inside the video.

## Enforced with numbers
| Dimension | Threshold | How it is checked |
|---|---|---|
| Virality (virality-predictor skill) | **80+/100 on both TikTok and Instagram**, scored honestly, never rounded up (Diyar, Nov 25 2026; was >90) | score table in the script .md |
| Length | **30-45 s** | `ffprobe` on the final MP4 |
| Video | **1080×1920, 60 fps, H.264** | `ffprobe` |
| Loudness | **-14 LUFS integrated** (±0.5), true peak ≤ -1.5 dB | `ffmpeg -af ebur128` |
| Voice vs music | music bed about **20 dB under the voice**; SFX soft | listen + mix gains in `audio/mix.py` |
| Shot length | a new angle every **1.3-3 s** | shot table in `story.js` |
| Captions | 1-2 words, Poppins Bold, white with dark stroke, sentence case, y≈1342; no caption on screen < 0.2 s | caption script output |
| Look | `LOOK = 'modern'` (PBR + image light + filmic grade); never grey or milky; compose glow ≤ 0.35 | contact sheet before and after the render |

## Measured, not yet enforced
- Instagram skip rate in the first 3 s, average % watched, shares per 1k plays (pull insights ~48 h after posting with vidIQ and log them in `doczap/docs/LESSONS.md`).
- Render speed per frame (about 10-12 s at RS=1 on 2 cores in the cloud).

## Gates (where each check runs)
1. **Script gate** (before asking for the MP3): virality ≥ 80 on both platforms + fact check with 2+ sources + a fresh-context doubt review of the facts (`doubt-driven-development`).
2. **Preview gate** (before the full render): contact sheet of stills sent to Diyar; wait for his OK.
3. **Ship gate** (before delivery): every row in the numbers table passes, frames from the finished MP4 checked, post kit run through `ig-caption` + `ig-human` + `youtube-agent`.

## Exceptions
None yet. An exception needs Diyar's OK in chat, the date, and the reason, written here.
