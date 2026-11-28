| Metric | Reference mean (range) | Ours | Gap (in ref spreads) |
|---|---|---|---|
| Brightness (L*, /100) | 47.7 (32.8-63.0) | 37.0 | -1.0 |
| Shadow area (% L*<35) | 37.6 (14.4-66.9) | 51.7 | +0.8 |
| Burnt highlights (% L*>93) | 2.2 (1.2-3.6) | 0.4 | -2.0 |
| Saturation (%) | 42.4 (29.8-51.7) | 41.8 | -0.1 |
| Contrast (L* std) | 20.4 (16.9-24.4) | 21.2 | +0.4 |
| Colourfulness | 12.4 (6.2-29.5) | 5.6 | -1.0 |
| Warmth (b*) | 7.2 (-5.0-20.8) | -2.1 | -1.2 |
| Green-magenta (a*) | 8.7 (0.8-17.1) | 13.0 | +0.8 |
| Dark outline pixels (%) | 1.6 (0.3-2.7) | 0.5 | -1.4 |
| Edge density (%) | 5.9 (3.3-9.6) | 2.3 | -2.0 |
| Sharpness (Laplacian var) | 674.2 (194.3-1688.4) | 312.9 | -0.9 |

Biggest gaps (fix the first one only, then measure again):
- Edge density (%): ours 2.3 vs reference 5.9 (lower), gap 2.0
- Burnt highlights (% L*>93): ours 0.4 vs reference 2.2 (lower), gap 2.0
- Dark outline pixels (%): ours 0.5 vs reference 1.6 (lower), gap 1.4
- Warmth (b*): ours -2.1 vs reference 7.2 (lower), gap 1.2
- Colourfulness: ours 5.6 vs reference 12.4 (lower), gap 1.0
