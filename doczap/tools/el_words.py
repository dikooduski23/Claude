"""Exact word timing for captions with ElevenLabs Scribe v3 (replaces align_ps.py when a key is set).

Usage (from the episode work folder):
    python3 ../../tools/el_words.py voice.mp3 words.json [--script script.txt]

Writes words.json as [{"w": word, "s": start_sec, "e": end_sec}, ...], the same format
caps.py / remocn captions already read. --script passes names and unusual words from the
script as keyterms so Scribe spells them right (e.g. "Burland", "Tudor").

The key is never in code: the SDK reads ELEVENLABS_API_KEY, loaded from doczap/.env.
(In cloud sessions that file holds a placeholder and the network proxy injects the real key.)
"""
import argparse, json, re
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs import ElevenLabs

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def keyterms_from_script(path):
    """Capitalised words that aren't sentence starts: names, places, ships."""
    text = Path(path).read_text(encoding="utf-8")
    terms = []
    for m in re.finditer(r"(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})*)", text, re.M):
        t = m.group(1)
        if t not in terms:
            terms.append(t)
    return terms[:100]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("out")
    ap.add_argument("--script", help="script text, for keyterms")
    a = ap.parse_args()

    kwargs = dict(model_id="scribe_v3", timestamps_granularity="word", language_code="en",
                  # Patrick's scripts write numbers as words; keep captions the same
                  request_options={"additional_body_parameters": {"numbers_format": "words"}})
    if a.script:
        terms = keyterms_from_script(a.script)
        if terms:
            kwargs["keyterms"] = terms

    client = ElevenLabs()
    with open(a.audio, "rb") as f:
        result = client.speech_to_text.convert(file=f, **kwargs)

    words = [{"w": w.text, "s": round(w.start, 3), "e": round(w.end, 3)}
             for w in result.words if getattr(w, "type", "word") == "word"]
    Path(a.out).write_text(json.dumps(words, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"{len(words)} words, {words[0]['s'] if words else 0:.2f}-{words[-1]['e'] if words else 0:.2f} s -> {a.out}")


if __name__ == "__main__":
    main()
