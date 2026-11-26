| Metric | Reference mean (range) | Ours | Gap (in ref spreads) |
|---|---|---|---|
| Brightness (L*, /100) | 47.7 (32.8-63.0) | 40.3 | -0.7 |
| Shadow area (% L*<35) | 37.6 (14.4-66.9) | 54.3 | +1.0 |
| Burnt highlights (% L*>93) | 2.2 (1.2-3.6) | 1.7 | -0.5 |
| Saturation (%) | 42.4 (29.8-51.7) | 48.2 | +0.8 |
| Contrast (L* std) | 20.4 (16.9-24.4) | 23.2 | +1.4 |
| Colourfulness | 12.4 (6.2-29.5) | 11.6 | -0.1 |
| Warmth (b*) | 7.2 (-5.0-20.8) | 14.3 | +0.9 |
| Green-magenta (a*) | 8.7 (0.8-17.1) | 11.6 | +0.5 |
| Dark outline pixels (%) | 1.6 (0.3-2.7) | 1.6 | -0.0 |
| Edge density (%) | 5.9 (3.3-9.6) | 4.0 | -1.1 |
| Sharpness (Laplacian var) | 674.2 (194.3-1688.4) | 298.0 | -0.9 |

Biggest gaps (fix the first one only, then measure again):
- Contrast (L* std): ours 23.2 vs reference 20.4 (higher), gap 1.4
- Edge density (%): ours 4.0 vs reference 5.9 (lower), gap 1.1
- Shadow area (% L*<35): ours 54.3 vs reference 37.6 (higher), gap 1.0
- Sharpness (Laplacian var): ours 298.0 vs reference 674.2 (lower), gap 0.9
- Warmth (b*): ours 14.3 vs reference 7.2 (higher), gap 0.9
