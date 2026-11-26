| Metric | Reference mean (range) | Ours | Gap (in ref spreads) |
|---|---|---|---|
| Brightness (L*, /100) | 47.7 (32.8-63.0) | 40.1 | -0.7 |
| Shadow area (% L*<35) | 37.6 (14.4-66.9) | 54.4 | +1.0 |
| Burnt highlights (% L*>93) | 2.2 (1.2-3.6) | 1.0 | -1.4 |
| Saturation (%) | 42.4 (29.8-51.7) | 49.2 | +0.9 |
| Contrast (L* std) | 20.4 (16.9-24.4) | 22.9 | +1.3 |
| Colourfulness | 12.4 (6.2-29.5) | 11.6 | -0.1 |
| Warmth (b*) | 7.2 (-5.0-20.8) | 15.0 | +1.0 |
| Green-magenta (a*) | 8.7 (0.8-17.1) | 11.7 | +0.6 |
| Dark outline pixels (%) | 1.6 (0.3-2.7) | 1.6 | -0.0 |
| Edge density (%) | 5.9 (3.3-9.6) | 4.0 | -1.1 |
| Sharpness (Laplacian var) | 674.2 (194.3-1688.4) | 296.7 | -0.9 |

Biggest gaps (fix the first one only, then measure again):
- Burnt highlights (% L*>93): ours 1.0 vs reference 2.2 (lower), gap 1.4
- Contrast (L* std): ours 22.9 vs reference 20.4 (higher), gap 1.3
- Edge density (%): ours 4.0 vs reference 5.9 (lower), gap 1.1
- Warmth (b*): ours 15.0 vs reference 7.2 (higher), gap 1.0
- Shadow area (% L*<35): ours 54.4 vs reference 37.6 (higher), gap 1.0
