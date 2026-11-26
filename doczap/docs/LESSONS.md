# Doc Zap lessons log

Newest first. Each entry: what went wrong, what changed, what to do next time. Engine decisions are recorded as short ADRs (decision, why, trade-off).

## Crystal Palace / Paxton lily leaf (Nov 26 2026)
**What went wrong**
- Diyar: the render looked "like 2018". The causes were flat toon bands, black outlines on the whole world, blocky low-poly trees, plain flat backgrounds, and a milky glow from the bloom plus a heavy compose glow.
- The voice was 45.9 s after trimming pauses, over the 45 s cap. Fixed with `atempo 1.06` (43.3 s).
- A transparent glass vault plus light-shaft cones in front of the camera put a hazy band over the nave tree. The lower canopy went black under a high sun.
- A one-word caption ("it.") flashed for 0.07 s.

**What changed**
- New `LOOK = 'modern'` (ADR below). Tropical planting ring, natural pond water, a leaf texture showing the ribs and cross-ribs, smooth noise-displaced tree canopies, grass tufts and wildflowers, a far tree line.
- Captions merge any chunk shorter than 0.2 s.
- Light-shaft cones are never placed between the camera and the subject; glass in front of a subject gets low reflectivity (`envK` 0.25).

**Next time**
- Build sets with modern materials from the start, so the preview gate isn't spent on look fixes.
- With 2 cores, run 2 render ranges (not 3); budget about 11 s per frame, so a 43 s episode takes about 4 h.
- Keep the voice ≤ 43 s before alignment, so `atempo` isn't needed.

### ADR-001: modern render look (Nov 26 2026)
- **Decision:** toon materials become MeshStandardMaterial at load time. Image-based light comes from a prefiltered sky dome with a sun glow, cached per lighting set. Low-poly primitives are rebuilt with more segments (skipped if the geometry was transformed). Post: ACES filmic tone mapping, split-tone grade, world outlines off, light grain and lens fringe, bloom only on real highlights (`bthr ≥ 1.55`), compose glow 0.35.
- **Why:** Diyar asked for modern-quality lighting and colour.
- **Trade-off:** about 10-12 s per frame vs about 5 s for toon. RS=1.5 supersampling was tested at about 3-4× slower and rejected; sharpness comes from the compose unsharp pass instead.
