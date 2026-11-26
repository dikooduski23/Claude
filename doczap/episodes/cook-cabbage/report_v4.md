| Metric | Reference mean (range) | Ours | Gap (in ref spreads) |
|---|---|---|---|
| Brightness (L*, /100) | 47.7 (32.8-63.0) | 40.5 | -0.7 |
| Shadow area (% L*<35) | 37.6 (14.4-66.9) | 54.2 | +1.0 |
| Burnt highlights (% L*>93) | 2.2 (1.2-3.6) | 4.6 | +2.8 |
| Saturation (%) | 42.4 (29.8-51.7) | 47.6 | +0.7 |
| Contrast (L* std) | 20.4 (16.9-24.4) | 23.3 | +1.5 |
| Colourfulness | 12.4 (6.2-29.5) | 11.7 | -0.1 |
| Warmth (b*) | 7.2 (-5.0-20.8) | 14.0 | +0.9 |
| Green-magenta (a*) | 8.7 (0.8-17.1) | 11.4 | +0.5 |
| Dark outline pixels (%) | 1.6 (0.3-2.7) | 1.6 | -0.1 |
| Edge density (%) | 5.9 (3.3-9.6) | 4.0 | -1.1 |
| Sharpness (Laplacian var) | 674.2 (194.3-1688.4) | 299.4 | -0.9 |

Biggest gaps (fix the first one only, then measure again):
- Burnt highlights (% L*>93): ours 4.6 vs reference 2.2 (higher), gap 2.8
- Contrast (L* std): ours 23.3 vs reference 20.4 (higher), gap 1.5
- Edge density (%): ours 4.0 vs reference 5.9 (lower), gap 1.1
- Shadow area (% L*<35): ours 54.2 vs reference 37.6 (higher), gap 1.0
- Sharpness (Laplacian var): ours 299.4 vs reference 674.2 (lower), gap 0.9
