| Metric | Reference mean (range) | Ours | Gap (in ref spreads) |
|---|---|---|---|
| Brightness (L*, /100) | 47.7 (32.8-63.0) | 53.5 | +0.5 |
| Shadow area (% L*<35) | 37.6 (14.4-66.9) | 32.0 | -0.3 |
| Burnt highlights (% L*>93) | 2.2 (1.2-3.6) | 0.7 | -1.7 |
| Saturation (%) | 42.4 (29.8-51.7) | 41.6 | -0.1 |
| Contrast (L* std) | 20.4 (16.9-24.4) | 21.1 | +0.3 |
| Colourfulness | 12.4 (6.2-29.5) | 11.1 | -0.2 |
| Warmth (b*) | 7.2 (-5.0-20.8) | 17.0 | +1.2 |
| Green-magenta (a*) | 8.7 (0.8-17.1) | 13.5 | +0.9 |
| Dark outline pixels (%) | 1.6 (0.3-2.7) | 0.7 | -1.3 |
| Edge density (%) | 5.9 (3.3-9.6) | 3.4 | -1.4 |
| Sharpness (Laplacian var) | 674.2 (194.3-1688.4) | 309.4 | -0.9 |

Biggest gaps (fix the first one only, then measure again):
- Burnt highlights (% L*>93): ours 0.7 vs reference 2.2 (lower), gap 1.7
- Edge density (%): ours 3.4 vs reference 5.9 (lower), gap 1.4
- Dark outline pixels (%): ours 0.7 vs reference 1.6 (lower), gap 1.3
- Warmth (b*): ours 17.0 vs reference 7.2 (higher), gap 1.2
- Green-magenta (a*): ours 13.5 vs reference 8.7 (higher), gap 0.9
