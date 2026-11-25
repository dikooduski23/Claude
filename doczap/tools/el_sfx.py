"""Real sound effects for an episode with ElevenLabs SFX v3, cached so each sound is paid for once.

Usage (from the episode work folder):
    python3 ../../tools/el_sfx.py sfx.json            # generate any missing sounds into sfx/
sfx.json:
    [{"name": "ice_creak", "text": "Heavy ice block creaking on a rope, cold harbour wind",
      "duration": 1.5, "influence": 0.5, "loop": false}, ...]

In a mix script:
    import sys; sys.path.insert(0, "../../tools"); from el_sfx import load
    creak = load("ice_creak")   # mono float32 numpy array at 44.1 kHz
Put every generated sound on the SFX bus of the voice-first mix (low-pass, ducked under
speech, SFX_PEAK cap): Diyar's rule is that the voice is always on top.

The key is never in code: the SDK reads ELEVENLABS_API_KEY, loaded from doczap/.env.
"""
import json, sys, wave
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SR = 44100
SFX_DIR = Path("sfx")


def generate(spec_path):
    from elevenlabs import ElevenLabs
    client = ElevenLabs()
    SFX_DIR.mkdir(exist_ok=True)
    specs = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    made = cached = 0
    for s in specs:
        out = SFX_DIR / f"{s['name']}.wav"
        if out.exists():
            cached += 1
            continue
        audio = client.text_to_sound_effects.convert(
            text=s["text"],
            model_id="eleven_text_to_sound_v3",
            duration_seconds=s.get("duration"),
            prompt_influence=s.get("influence", 0.5),
            loop=s.get("loop", False),
            output_format="pcm_44100",
        )
        pcm = b"".join(audio)
        with wave.open(str(out), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm)
        made += 1
        print(f"  made {out} ({len(pcm) / 2 / SR:.1f} s)")
    print(f"{made} generated, {cached} already cached in {SFX_DIR}/")


def load(name, sfx_dir=SFX_DIR):
    import numpy as np
    with wave.open(str(Path(sfx_dir) / f"{name}.wav")) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32) / 32768
    return a


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    generate(sys.argv[1])
