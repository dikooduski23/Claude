| Metric | Reference mean (range) | Ours | Gap (in ref spreads) |
|---|---|---|---|
| Brightness (L*, /100) | 47.7 (32.8-63.0) | 26.2 | -2.0 |
| Shadow area (% L*<35) | 37.6 (14.4-66.9) | 69.2 | +1.8 |
| Burnt highlights (% L*>93) | 2.2 (1.2-3.6) | 1.1 | -1.3 |
| Saturation (%) | 42.4 (29.8-51.7) | 60.9 | +2.5 |
| Contrast (L* std) | 20.4 (16.9-24.4) | 26.3 | +2.9 |
| Colourfulness | 12.4 (6.2-29.5) | 11.3 | -0.2 |
| Warmth (b*) | 7.2 (-5.0-20.8) | 11.1 | +0.5 |
| Green-magenta (a*) | 8.7 (0.8-17.1) | 8.5 | -0.0 |
| Dark outline pixels (%) | 1.6 (0.3-2.7) | 1.3 | -0.4 |
| Edge density (%) | 5.9 (3.3-9.6) | 3.1 | -1.6 |
| Sharpness (Laplacian var) | 674.2 (194.3-1688.4) | 339.2 | -0.8 |

Biggest gaps (fix the first one only, then measure again):
- Contrast (L* std): ours 26.3 vs reference 20.4 (higher), gap 2.9
- Saturation (%): ours 60.9 vs reference 42.4 (higher), gap 2.5
- Brightness (L*, /100): ours 26.2 vs reference 47.7 (lower), gap 2.0
- Shadow area (% L*<35): ours 69.2 vs reference 37.6 (higher), gap 1.8
- Edge density (%): ours 3.1 vs reference 5.9 (lower), gap 1.6
