# The Bridge That Fell for a Song - soundtrack cue sheet

All sound is original: synthesized in numpy/scipy by `sfx_gen.py` / `instruments.py`, placed by `sfx.py` / `music.py`, mixed by `mix.py`.
Voice = `voice/voice.wav`, gain only (no EQ, no compression, no pitch).

## Files
| file | content |
|---|---|
| `mix.wav` | final mix, 48 kHz, stereo, 24-bit, 3,240,000 samples = 67.500 s |
| `stem_voice.wav` / `stem_music.wav` / `stem_sfx.wav` | stems at mix gain (they sum to the mix before the master limiter) |

## Master loudness (own BS.1770-4 meter)
- Integrated **-15.0 LUFS**, true peak **-1.2 dBTP**, LRA 2.6 LU, max momentary -9.0 LUFS, max short-term -12.5 LUFS
- Stems: voice -15.4 LUFS, music -25.8 LUFS, sfx -29.1 LUFS (voice gain +1.20 dB, same gain on every stem)
- Master limiter (4x oversampled look-ahead, ceiling -1.2 dBTP): max gain reduction 1.45 dB, active (>0.1 dB) on 3.53 % of samples, >0.5 dB on 0.63 %

ffmpeg ebur128 cross-check:
```
Summary:
  Integrated loudness:
    I:         -15.0 LUFS
    Threshold: -25.0 LUFS
  Loudness range:
    LRA:         2.6 LU
    Threshold: -35.0 LUFS
    LRA low:   -16.2 LUFS
    LRA high:  -13.6 LUFS
  True peak:
    Peak:       -1.2 dBFS
```

## Voice on top: per-section loudness (LUFS, integrated per stem, at mix gain)
bed = music + sfx. margin = voice - bed (integrated over the section). speech median / p10 = median and 10th percentile of the 400 ms momentary margin (voice - bed) over windows centred on spoken words.

| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |
|---|---|---|---|---|---|---|---|---|
| hook (1) | 0.00-4.33 | -15.4 | -25.2 | -28.7 | -23.6 | 8.2 | 8.4 | 0.7 |
| town (2) | 4.33-9.43 | -15.5 | -25.7 | -29.6 | -24.2 | 8.7 | 9.6 | 2.5 |
| march (3) | 9.43-14.80 | -15.8 | -25.9 | -31.2 | -24.8 | 9.0 | 7.5 | 2.4 |
| bounce (4-5) | 14.80-21.43 | -15.4 | -25.6 | -32.0 | -24.7 | 9.2 | 8.7 | 4.6 |
| whistle (6) | 21.43-27.43 | -16.0 | -25.5 | -30.7 | -24.3 | 8.4 | 9.0 | 2.6 |
| groan (7) | 27.43-32.90 | -14.0 | -24.6 | -27.2 | -22.7 | 8.7 | 9.9 | 2.3 |
| snap+fall (8) | 32.90-37.80 | -15.1 | -29.0 | -24.3 | -24.2 | 9.1 | 9.0 | 2.6 |
| water (9-10) | 37.80-43.43 | -15.6 | -59.7 | -33.7 | -33.7 | 18.1 | 17.2 | 12.1 |
| sway (11) | 43.43-47.03 | -15.3 | -27.5 | -35.8 | -26.9 | 11.6 | 11.1 | 7.4 |
| swing (12) | 47.03-54.00 | -15.7 | -27.3 | -36.1 | -26.7 | 11.0 | 10.5 | 5.1 |
| march2 (13) | 54.00-57.83 | -15.2 | -25.7 | -31.8 | -24.8 | 9.6 | 9.8 | 5.9 |
| rule (14) | 57.83-62.10 | -14.3 | -26.5 | -28.7 | -25.0 | 10.7 | 10.3 | 1.1 |
| tourists (15) | 62.10-67.50 | -15.4 | -26.3 | -26.8 | -23.6 | 8.2 | 7.5 | 1.0 |

## Music map (original march, Bb major, 120 bpm: quarter note = footfall)
Music target per section, LU under the voice (after a -3 dB speech duck keyed from words.json): hook -9.5, town -10.5, march -10.0, bounce -10.0, whistle -9.5, tension -10.0, sway -12.0, swing -11.5, march2 -10.5, rule -11.5, tourists -11.0. Applied section gains (dB): hook -7.6, town -3.2, march -6.8, bounce -7.1, whistle -6.0, tension -6.2, sway -7.2, swing -6.5, march2 -4.9, rule -3.4, tourists -7.2, dropout -6.2.

Rides (music only, dB): 3.65-4.30 s -3.0, 26.95-27.36 s -2.0, 32.20-32.77 s -4.0, 61.25-61.98 s -3.0 - so quiet sentence-final words stay on top and the band blooms in the gaps after them. The hook's last two footfalls (3.5, 4.0) are also 3 dB lower in the SFX for '...walking across it.'

| time s | frame | music |
|---|---|---|
| 0.00 | 0 | hook: theme A1-A2 tutti, 7 whistlers, tuba/after-beats/snare; snare fill 3.0-4.3 under 'across it.' |
| 4.33 | 130 | Bb button + light clash exactly on the white flash (frame 130), then the band is gone |
| 5.00 | 150 | story: theme A1-A2 light (glock + fife, tuba on 1/3, horns on 2/4, light snare) |
| 9.00 | 270 | full band: theme A3-A8 (cymbal), boots are the bass drum |
| 15.00 | 450 | tuba switches to bouncing octaves as the bridge starts bouncing |
| 21.00 | 630 | vamp bar, no melody: room for 'Somebody starts whistling' |
| 22.25 | 668 | solo whistler: 3-note pickup D-Eb-F into theme A on 23.0 (in Bb, on the beat) |
| 23.75 | 712 | the column joins the whistling (8 more whistlers by 24.75) |
| 29.22 | 877 | whistlers falter one by one (pitch droops, 29.2-29.7): faces turn nervous |
| 29.50 | 885 | tension: F7 pedal, tuba eighths, snare drive |
| 31.00 | 930 | chromatic climb F7 - F#dim7 - Gm - G#dim7, glock ticking 16ths, snare roll crescendo |
| 33.00 | 990 | DEAD STOP on 'Then,' - music silent through the bolt, the drop and the two-feet-deep joke |
| 43.43 | 1303 | warm return: pad Bb - Eb/Bb - Bb - F7, soft low brass, vibes pendulum on each sway extreme (84 bpm) |
| 47.24 | 1417 | music-box waltz (116 bpm, 3/4): one bar per swing cycle, pizzicato oom-pah-pah |
| 48.79 | 1464 | pushes 48.79 / 50.34 / 51.89 / 53.44 = downbeats (tiny triangle ting), melody climbs each bar |
| 53.62 | 1609 | music-box run up 'higher and higher' into the march |
| 54.00 | 1620 | march returns soft and golden, 6 whistlers, theme A1-A2 |
| 58.85 | 1766 | snare roll pp-mf into the rule |
| 59.79 | 1794 | brass stab Bb + timpani on hammer blow 1 ('rule'), F on blow 2 ('Never'), Bb + cymbal on blow 3 ('step') |
| 62.00 | 1860 | relaxed tourist version: swung, laid-back vibes melody, walking pizzicato bass, brushes |
| 67.00 | 2010 | final Bb chord on 'tourists' (66.72-67.24), rings out, faded to silence at 67.5 |

## SFX events
Level convention: every EVENT has a naive level (LU vs the voice stem, as the event's max momentary loudness); applied = naive - 6 dB (standard mix rule) + distance/intensity offsets. BEDS are integrated loudness, not reduced. 'mix LUFS' = the event's max momentary loudness in the final mix (voice stem = -15.4 LUFS integrated). Column sounds also get the camera-distance low-pass and more valley reverb.

| # | time s | frame | cue | what | naive LU | applied LU | mix LUFS | pan |
|---|---|---|---|---|---|---|---|---|
| 1 | 0.000 | 0.0 | amb_day (bed, integrated) | daytime valley air: breeze, river below, sparrows, tower flags (shots 1-8) | -30 | -30.0 | -45.4 | +0.00 |
| 2 | 0.000 | 0.0 | chain_groan_hook | chains groaning under the bouncing column (hook) | -10 | -16.0 | -31.4 | -0.30 |
| 3 | 0.000 | 0.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.34) | -10 | -22.6 | -38.0 | +0.00 |
| 4 | 0.000 | 0.0 | stomp | 74 boots in step (shot 1, cam 15 m, stomp x1.41) | -8 | -20.0 | -35.4 | +0.00 |
| 5 | 0.500 | 15.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.35) | -10 | -22.5 | -37.9 | +0.00 |
| 6 | 0.500 | 15.0 | stomp | 74 boots in step (shot 1, cam 15 m, stomp x1.42) | -8 | -19.9 | -35.3 | +0.00 |
| 7 | 1.000 | 30.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.37) | -10 | -22.4 | -37.8 | +0.00 |
| 8 | 1.000 | 30.0 | stomp | 74 boots in step (shot 1, cam 15 m, stomp x1.43) | -8 | -19.8 | -35.2 | +0.00 |
| 9 | 1.500 | 45.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.39) | -10 | -22.3 | -37.7 | +0.00 |
| 10 | 1.500 | 45.0 | stomp | 74 boots in step (shot 1, cam 15 m, stomp x1.45) | -8 | -19.7 | -35.2 | +0.00 |
| 11 | 1.600 | 48.0 | whoosh_cam | camera push-in to the boots | -12 | -18.0 | -33.4 | +0.00 |
| 12 | 2.000 | 60.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.41) | -10 | -19.2 | -34.5 | +0.00 |
| 13 | 2.000 | 60.0 | stomp | 74 boots in step (shot 1, cam 7 m, stomp x1.46) | -8 | -14.7 | -30.1 | +0.00 |
| 14 | 2.500 | 75.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.42) | -10 | -19.0 | -34.4 | +0.00 |
| 15 | 2.500 | 75.0 | stomp | 74 boots in step (shot 1, cam 7 m, stomp x1.47) | -8 | -14.6 | -30.0 | +0.00 |
| 16 | 2.933 | 88.0 | whoosh_cam | camera push-in, boot level | -12 | -18.0 | -33.4 | +0.00 |
| 17 | 3.000 | 90.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.44) | -10 | -17.9 | -33.3 | +0.00 |
| 18 | 3.000 | 90.0 | stomp | 74 boots in step (shot 1, cam 5 m, stomp x1.49) | -8 | -12.8 | -28.2 | +0.00 |
| 19 | 3.500 | 105.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.46) | -10 | -19.0 | -34.4 | +0.00 |
| 20 | 3.500 | 105.0 | stomp | 74 boots in step (shot 1, cam 4 m, stomp x1.50) | -8 | -14.7 | -30.1 | +0.00 |
| 21 | 4.000 | 120.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.49) | -10 | -18.9 | -34.2 | +0.00 |
| 22 | 4.000 | 120.0 | stomp | 74 boots in step (shot 1, cam 4 m, stomp x1.50) | -8 | -14.7 | -30.1 | +0.00 |
| 23 | 4.333 | 130.0 | crowd_murmur | townsfolk on both banks: murmur of ~22 voices, a few early hurrahs (shot 2) | -10 | -16.0 | -31.5 | +0.00 |
| 24 | 4.333 | 130.0 | flash_whoosh | reverse swell into the white flash (frame 130) + soft low whoomp | -5 | -11.0 | -26.4 | +0.00 |
| 25 | 4.500 | 135.0 | stomp | 74 boots in step (shot 2, cam 80 m, stomp x1.00) | -8 | -27.0 | -42.6 | +0.00 |
| 26 | 5.000 | 150.0 | stomp | 74 boots in step (shot 2, cam 80 m, stomp x1.00) | -8 | -27.0 | -42.5 | +0.00 |
| 27 | 5.500 | 165.0 | stomp | 74 boots in step (shot 2, cam 80 m, stomp x1.00) | -8 | -27.0 | -42.5 | +0.00 |
| 28 | 6.000 | 180.0 | stomp | 74 boots in step (shot 2, cam 80 m, stomp x1.00) | -8 | -27.0 | -42.6 | +0.00 |
| 29 | 6.500 | 195.0 | stomp | 74 boots in step (shot 2, cam 67 m, stomp x1.00) | -8 | -27.0 | -42.6 | +0.00 |
| 30 | 7.000 | 210.0 | stomp | 74 boots in step (shot 2, cam 66 m, stomp x1.00) | -8 | -27.0 | -42.5 | +0.00 |
| 31 | 7.500 | 225.0 | stomp | 74 boots in step (shot 2, cam 66 m, stomp x1.00) | -8 | -27.0 | -42.5 | +0.00 |
| 32 | 7.600 | 228.0 | crowd_cheer | townsfolk cheer on 'pride of the whole town': hurrahs, kids, applause swell | -6 | -12.0 | -27.5 | +0.00 |
| 33 | 8.000 | 240.0 | stomp | 74 boots in step (shot 2, cam 66 m, stomp x1.00) | -8 | -27.0 | -42.5 | +0.00 |
| 34 | 8.500 | 255.0 | stomp | 74 boots in step (shot 2, cam 51 m, stomp x1.00) | -8 | -27.0 | -42.5 | +0.00 |
| 35 | 9.000 | 270.0 | stomp | 74 boots in step (shot 2, cam 51 m, stomp x1.00) | -8 | -27.0 | -42.5 | +0.00 |
| 36 | 9.433 | 283.0 | whoosh_cam | camera wide -> low front of the column | -11 | -17.0 | -32.4 | +0.00 |
| 37 | 9.500 | 285.0 | stomp | 74 boots in step (shot 3, cam 20 m, stomp x1.00) | -8 | -24.5 | -39.9 | +0.00 |
| 38 | 10.000 | 300.0 | stomp | 74 boots in step (shot 3, cam 6 m, stomp x1.00) | -8 | -17.7 | -33.1 | +0.00 |
| 39 | 10.500 | 315.0 | stomp | 74 boots in step (shot 3, cam 6 m, stomp x1.00) | -8 | -17.7 | -33.1 | +0.00 |
| 40 | 11.000 | 330.0 | stomp | 74 boots in step (shot 3, cam 6 m, stomp x1.00) | -8 | -17.7 | -33.1 | +0.00 |
| 41 | 11.500 | 345.0 | stomp | 74 boots in step (shot 3, cam 6 m, stomp x1.00) | -8 | -17.7 | -33.1 | +0.00 |
| 42 | 12.000 | 360.0 | stomp | 74 boots in step (shot 3, cam 4 m, stomp x1.00) | -8 | -14.1 | -29.5 | +0.00 |
| 43 | 12.500 | 375.0 | stomp | 74 boots in step (shot 3, cam 4 m, stomp x1.00) | -8 | -14.1 | -29.5 | +0.00 |
| 44 | 13.000 | 390.0 | stomp | 74 boots in step (shot 3, cam 4 m, stomp x1.00) | -8 | -14.1 | -29.5 | +0.00 |
| 45 | 13.500 | 405.0 | stomp | 74 boots in step (shot 3, cam 4 m, stomp x1.00) | -8 | -14.1 | -29.5 | +0.00 |
| 46 | 14.000 | 420.0 | stomp | 74 boots in step (shot 3, cam 4 m, stomp x1.00) | -8 | -14.1 | -29.5 | +0.00 |
| 47 | 14.500 | 435.0 | stomp | 74 boots in step (shot 3, cam 4 m, stomp x1.00) | -8 | -14.1 | -29.5 | +0.00 |
| 48 | 14.800 | 444.0 | whoosh_cam | camera cut to the side view | -11 | -17.0 | -32.4 | +0.00 |
| 49 | 15.000 | 450.0 | stomp | 74 boots in step (shot 4, cam 11 m, stomp x1.00) | -8 | -20.7 | -36.1 | +0.00 |
| 50 | 15.500 | 465.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.02) | -10 | -29.7 | -45.1 | +0.00 |
| 51 | 15.500 | 465.0 | stomp | 74 boots in step (shot 4, cam 12 m, stomp x1.00) | -8 | -21.3 | -36.7 | +0.00 |
| 52 | 16.000 | 480.0 | bounce_first | first big flex 'boing' + long plank groan - the bridge starts bouncing (faces react 16.17) | -10 | -20.0 | -35.4 | +0.00 |
| 53 | 16.000 | 480.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.03) | -10 | -28.2 | -43.6 | +0.00 |
| 54 | 16.000 | 480.0 | stomp | 74 boots in step (shot 4, cam 12 m, stomp x1.00) | -8 | -21.3 | -36.7 | +0.00 |
| 55 | 16.500 | 495.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.04) | -10 | -27.3 | -42.6 | +0.00 |
| 56 | 16.500 | 495.0 | stomp | 74 boots in step (shot 4, cam 12 m, stomp x1.00) | -8 | -21.3 | -36.7 | +0.00 |
| 57 | 17.000 | 510.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.05) | -10 | -25.2 | -40.5 | +0.00 |
| 58 | 17.000 | 510.0 | stomp | 74 boots in step (shot 4, cam 8 m, stomp x1.00) | -8 | -18.9 | -34.4 | +0.00 |
| 59 | 17.500 | 525.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.06) | -10 | -24.6 | -40.0 | +0.00 |
| 60 | 17.500 | 525.0 | stomp | 74 boots in step (shot 4, cam 8 m, stomp x1.00) | -8 | -18.9 | -34.4 | +0.00 |
| 61 | 17.800 | 534.0 | whoosh_cam | camera swing round to the faces | -11 | -17.0 | -32.4 | +0.00 |
| 62 | 18.000 | 540.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.07) | -10 | -22.7 | -38.1 | +0.00 |
| 63 | 18.000 | 540.0 | stomp | 74 boots in step (shot 5, cam 5 m, stomp x1.00) | -8 | -16.4 | -31.8 | +0.00 |
| 64 | 18.500 | 555.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.08) | -10 | -22.3 | -37.6 | +0.00 |
| 65 | 18.500 | 555.0 | stomp | 74 boots in step (shot 5, cam 5 m, stomp x1.00) | -8 | -16.2 | -31.6 | +0.00 |
| 66 | 19.000 | 570.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.09) | -10 | -22.0 | -37.4 | +0.00 |
| 67 | 19.000 | 570.0 | stomp | 74 boots in step (shot 5, cam 5 m, stomp x1.00) | -8 | -16.2 | -31.6 | +0.00 |
| 68 | 19.500 | 585.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.10) | -10 | -21.8 | -37.2 | +0.00 |
| 69 | 19.500 | 585.0 | stomp | 74 boots in step (shot 5, cam 5 m, stomp x1.00) | -8 | -16.2 | -31.6 | +0.00 |
| 70 | 20.000 | 600.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.11) | -10 | -20.7 | -36.0 | +0.00 |
| 71 | 20.000 | 600.0 | stomp | 74 boots in step (shot 5, cam 4 m, stomp x1.00) | -8 | -14.7 | -30.1 | +0.00 |
| 72 | 20.500 | 615.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.12) | -10 | -20.5 | -35.9 | +0.00 |
| 73 | 20.500 | 615.0 | stomp | 74 boots in step (shot 5, cam 4 m, stomp x1.00) | -8 | -14.7 | -30.1 | +0.00 |
| 74 | 21.000 | 630.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.12) | -10 | -20.3 | -35.7 | +0.00 |
| 75 | 21.000 | 630.0 | stomp | 74 boots in step (shot 5, cam 4 m, stomp x1.00) | -8 | -14.7 | -30.1 | +0.00 |
| 76 | 21.433 | 643.0 | whoosh_cam | camera push to the whistler's face | -11 | -17.0 | -32.4 | +0.00 |
| 77 | 21.500 | 645.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.13) | -10 | -19.8 | -35.2 | +0.00 |
| 78 | 21.500 | 645.0 | stomp | 74 boots in step (shot 6, cam 4 m, stomp x1.01) | -8 | -14.0 | -29.4 | +0.00 |
| 79 | 22.000 | 660.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.14) | -10 | -19.5 | -34.9 | +0.00 |
| 80 | 22.000 | 660.0 | stomp | 74 boots in step (shot 6, cam 3 m, stomp x1.04) | -8 | -13.7 | -29.1 | +0.00 |
| 81 | 22.500 | 675.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.15) | -10 | -19.3 | -34.7 | +0.00 |
| 82 | 22.500 | 675.0 | stomp | 74 boots in step (shot 6, cam 3 m, stomp x1.06) | -8 | -13.5 | -28.9 | +0.00 |
| 83 | 23.000 | 690.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.16) | -10 | -19.1 | -34.5 | +0.00 |
| 84 | 23.000 | 690.0 | stomp | 74 boots in step (shot 6, cam 3 m, stomp x1.09) | -8 | -13.2 | -28.6 | +0.00 |
| 85 | 23.500 | 705.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.18) | -10 | -19.0 | -34.4 | +0.00 |
| 86 | 23.500 | 705.0 | stomp | 74 boots in step (shot 6, cam 3 m, stomp x1.12) | -8 | -13.0 | -28.4 | +0.00 |
| 87 | 23.900 | 717.0 | whoosh_cam | camera crane up over the column | -11 | -17.0 | -32.4 | +0.00 |
| 88 | 24.000 | 720.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.19) | -10 | -21.8 | -37.2 | +0.00 |
| 89 | 24.000 | 720.0 | stomp | 74 boots in step (shot 6, cam 8 m, stomp x1.15) | -8 | -17.7 | -33.2 | +0.00 |
| 90 | 24.500 | 735.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.20) | -10 | -23.1 | -38.5 | +0.00 |
| 91 | 24.500 | 735.0 | stomp | 74 boots in step (shot 6, cam 12 m, stomp x1.18) | -8 | -20.0 | -35.4 | +0.00 |
| 92 | 25.000 | 750.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.21) | -10 | -23.0 | -38.4 | +0.00 |
| 93 | 25.000 | 750.0 | stomp | 74 boots in step (shot 6, cam 12 m, stomp x1.21) | -8 | -19.8 | -35.3 | +0.00 |
| 94 | 25.500 | 765.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.22) | -10 | -22.9 | -38.2 | +0.00 |
| 95 | 25.500 | 765.0 | stomp | 74 boots in step (shot 6, cam 12 m, stomp x1.24) | -8 | -19.6 | -35.0 | +0.00 |
| 96 | 26.000 | 780.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.23) | -10 | -20.8 | -36.2 | +0.00 |
| 97 | 26.000 | 780.0 | stomp | 74 boots in step (shot 6, cam 7 m, stomp x1.27) | -8 | -16.1 | -31.6 | +0.00 |
| 98 | 26.500 | 795.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.24) | -10 | -20.7 | -36.1 | +0.00 |
| 99 | 26.500 | 795.0 | stomp | 74 boots in step (shot 6, cam 7 m, stomp x1.30) | -8 | -16.0 | -31.4 | +0.00 |
| 100 | 27.000 | 810.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.25) | -10 | -20.6 | -35.9 | +0.00 |
| 101 | 27.000 | 810.0 | stomp | 74 boots in step (shot 6, cam 7 m, stomp x1.33) | -8 | -15.8 | -31.2 | +0.00 |
| 102 | 27.433 | 823.0 | whoosh_cam | camera low wide from behind | -11 | -17.0 | -32.4 | +0.00 |
| 103 | 27.500 | 825.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.26) | -10 | -21.4 | -36.7 | +0.00 |
| 104 | 27.500 | 825.0 | stomp | 74 boots in step (shot 7, cam 9 m, stomp x1.35) | -8 | -17.1 | -32.5 | +0.00 |
| 105 | 28.000 | 840.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.28) | -10 | -22.1 | -37.4 | +0.00 |
| 106 | 28.000 | 840.0 | stomp | 74 boots in step (shot 7, cam 11 m, stomp x1.37) | -8 | -18.5 | -33.9 | +0.00 |
| 107 | 28.500 | 855.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.30) | -10 | -21.9 | -37.3 | +0.00 |
| 108 | 28.500 | 855.0 | stomp | 74 boots in step (shot 7, cam 11 m, stomp x1.38) | -8 | -18.4 | -33.8 | +0.00 |
| 109 | 28.900 | 867.0 | chain_groan | suspension chains groaning, rising in pitch and strength with each footfall (28.9 -> snap) | -6 | -12.0 | -27.4 | -0.35 |
| 110 | 29.000 | 870.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.32) | -10 | -21.7 | -37.1 | +0.00 |
| 111 | 29.000 | 870.0 | stomp | 74 boots in step (shot 7, cam 11 m, stomp x1.39) | -8 | -18.3 | -33.7 | +0.00 |
| 112 | 29.500 | 885.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.34) | -10 | -20.0 | -35.4 | +0.00 |
| 113 | 29.500 | 885.0 | stomp | 74 boots in step (shot 7, cam 7 m, stomp x1.41) | -8 | -15.6 | -31.0 | +0.00 |
| 114 | 29.950 | 898.5 | chain_groan_swell | chains groan out loud right after the word 'groaning,' (swells on footfalls 30.0 + 30.5) | -4 | -10.0 | -25.4 | -0.35 |
| 115 | 30.000 | 900.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.35) | -10 | -19.9 | -35.3 | +0.00 |
| 116 | 30.000 | 900.0 | stomp | 74 boots in step (shot 7, cam 7 m, stomp x1.42) | -8 | -15.5 | -30.9 | +0.00 |
| 117 | 30.500 | 915.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.37) | -10 | -19.8 | -35.1 | +0.00 |
| 118 | 30.500 | 915.0 | stomp | 74 boots in step (shot 7, cam 7 m, stomp x1.43) | -8 | -15.4 | -30.8 | +0.00 |
| 119 | 31.000 | 930.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.39) | -10 | -17.7 | -33.1 | +0.00 |
| 120 | 31.000 | 930.0 | stomp | 74 boots in step (shot 7, cam 4 m, stomp x1.45) | -8 | -12.1 | -27.5 | +0.00 |
| 121 | 31.500 | 945.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.41) | -10 | -17.4 | -32.7 | +0.00 |
| 122 | 31.500 | 945.0 | stomp | 74 boots in step (shot 7, cam 4 m, stomp x1.46) | -8 | -11.7 | -27.1 | +0.00 |
| 123 | 32.000 | 960.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.42) | -10 | -17.3 | -32.6 | +0.00 |
| 124 | 32.000 | 960.0 | stomp | 74 boots in step (shot 7, cam 4 m, stomp x1.47) | -8 | -11.6 | -27.0 | +0.00 |
| 125 | 32.500 | 975.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.44) | -10 | -17.1 | -32.5 | +0.00 |
| 126 | 32.500 | 975.0 | stomp | 74 boots in step (shot 7, cam 4 m, stomp x1.49) | -8 | -11.5 | -26.9 | +0.00 |
| 127 | 32.900 | 987.0 | whoosh_cam | camera whip to the anchor bolt | -11 | -17.0 | -32.4 | +0.00 |
| 128 | 33.000 | 990.0 | bolt_strain | bolt jerks with the footfall: metal strain creak 1/4 (close-up) | -12 | -18.0 | -33.4 | -0.15 |
| 129 | 33.000 | 990.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.46) | -10 | -20.9 | -36.3 | +0.00 |
| 130 | 33.000 | 990.0 | stomp | 74 boots in step (shot 8, cam 12 m, stomp x1.50) | -8 | -17.9 | -33.4 | +0.00 |
| 131 | 33.500 | 1005.0 | bolt_strain | bolt jerks with the footfall: metal strain creak 2/4 (close-up) | -11 | -17.0 | -32.4 | -0.15 |
| 132 | 33.500 | 1005.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.49) | -10 | -22.6 | -38.0 | +0.00 |
| 133 | 33.500 | 1005.0 | stomp | 74 boots in step (shot 8, cam 19 m, stomp x1.50) | -8 | -20.9 | -36.4 | +0.00 |
| 134 | 34.000 | 1020.0 | bolt_strain | bolt jerks with the footfall: metal strain creak 3/4 (close-up) | -10 | -16.0 | -31.4 | -0.15 |
| 135 | 34.000 | 1020.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.52) | -10 | -22.4 | -37.8 | +0.00 |
| 136 | 34.000 | 1020.0 | stomp | 74 boots in step (shot 8, cam 19 m, stomp x1.50) | -8 | -20.9 | -36.4 | +0.00 |
| 137 | 34.310 | 1029.3 | bolt_tick | metal fatigue tick | -14 | -20.0 | -35.4 | -0.15 |
| 138 | 34.470 | 1034.1 | bolt_tick | metal fatigue tick | -14 | -20.0 | -35.4 | -0.15 |
| 139 | 34.500 | 1035.0 | bolt_strain | bolt jerks with the footfall: metal strain creak 4/4 (close-up) | -9 | -15.0 | -30.4 | -0.15 |
| 140 | 34.500 | 1035.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.54) | -10 | -22.3 | -37.7 | +0.00 |
| 141 | 34.500 | 1035.0 | stomp | 74 boots in step (shot 8, cam 19 m, stomp x1.50) | -8 | -20.9 | -36.4 | +0.00 |
| 142 | 34.570 | 1037.1 | bolt_tick | metal fatigue tick | -14 | -20.0 | -35.4 | -0.15 |
| 143 | 34.620 | 1038.6 | bolt_snap | BOLT SNAPS: crack + two halves ringing as they fly (Doppler drop) + release thunk + chain jolt | +0 | -6.0 | -21.4 | -0.20 |
| 144 | 34.620 | 1038.6 | chain_whip | snapped backstay whips up: swish + rattle along the chain + clank as it flops | -4 | -10.0 | -25.4 | -0.40 |
| 145 | 34.870 | 1046.1 | column_halt | column stops dead: boots scuff and shuffle | -16 | -22.0 | -37.5 | +0.00 |
| 146 | 35.400 | 1062.0 | whoosh_cam | camera crane out over the bridge | -11 | -17.0 | -32.4 | +0.00 |
| 147 | 35.550 | 1066.5 | bolt_land | bolt half lands on the bank: tink, tink-tink | -16 | -22.0 | -37.4 | -0.50 |
| 148 | 35.670 | 1070.1 | bolt_land | bolt half lands on the bank: tink, tink-tink | -16 | -22.0 | -37.4 | +0.10 |
| 149 | 35.800 | 1074.0 | timber_tear | near half tears loose: huge timber creak + splintering that peaks as it lets go (DROP0 36.35) | -6 | -12.0 | -27.4 | +0.10 |
| 150 | 36.950 | 1108.5 | amb_water (bed, integrated) | river right around the soldiers sitting in it: flow, babble, lapping, sloshes, drips (shots 9-10) | -19 | -19.0 | -34.4 | +0.00 |
| 151 | 36.950 | 1108.5 | fall_air | air rush of the falling deck (accelerating DROP0 36.35 -> DROP1 36.95) | -8 | -14.0 | -29.4 | +0.00 |
| 152 | 36.950 | 1108.5 | splash_big | BIG SPLASH: thump, slap, water body, bubble cloud, spray raining back (6 sources along the deck) | -2 | -8.0 | -23.4 | +0.00 |
| 153 | 36.950 | 1108.5 | wood_crack | deck slams the water: splintering crack + timber boom | -4 | -10.0 | -25.4 | +0.00 |
| 154 | 36.970 | 1109.1 | oofs | 74 men landing in two feet of water: a dozen 'oof' / 'ugh' / 'oh' / 'ow' | -4 | -10.0 | -25.4 | +0.00 |
| 155 | 37.050 | 1111.5 | debris | planks and kit clattering into the shallows | -12 | -18.0 | -33.4 | +0.00 |
| 156 | 40.420 | 1212.6 | groans | hurt soldiers sitting in the shallows: 'ugh' / 'ow' groans | -12 | -18.0 | -33.7 | +0.00 |
| 157 | 41.950 | 1258.5 | groans | another groan from the river | -18 | -24.0 | -39.8 | +0.00 |
| 158 | 42.700 | 1281.0 | groans | another groan from the river | -18 | -24.0 | -39.7 | +0.00 |
| 159 | 43.300 | 1299.0 | amb_golden (bed, integrated) | golden-hour calm: soft breeze, blackbird phrases, faint crickets, distant river (shots 11-13) | -29 | -29.0 | -44.4 | +0.00 |
| 160 | 43.433 | 1303.0 | whoosh_xfade | crossfade to golden light | -12 | -18.0 | -33.4 | +0.00 |
| 161 | 43.757 | 1312.7 | sway_creak | the bridge sways by itself (0.7 Hz): long soft creak at each extreme | -12 | -18.0 | -34.8 | -0.20 |
| 162 | 44.471 | 1334.1 | sway_creak | the bridge sways by itself (0.7 Hz): long soft creak at each extreme | -12 | -18.0 | -34.8 | +0.20 |
| 163 | 45.186 | 1355.6 | sway_creak | the bridge sways by itself (0.7 Hz): long soft creak at each extreme | -12 | -18.0 | -34.8 | -0.20 |
| 164 | 45.900 | 1377.0 | sway_creak | the bridge sways by itself (0.7 Hz): long soft creak at each extreme | -12 | -18.0 | -34.8 | +0.20 |
| 165 | 46.614 | 1398.4 | sway_creak | the bridge sways by itself (0.7 Hz): long soft creak at each extreme | -12 | -18.0 | -34.8 | -0.20 |
| 166 | 47.033 | 1411.0 | whoosh_xfade | crossfade to the park | -12 | -18.0 | -33.4 | +0.00 |
| 167 | 47.628 | 1428.8 | swing_squeak | swing hanger squeak (forward, arc 6 deg) | -12 | -25.4 | -40.7 | +0.15 |
| 168 | 48.403 | 1452.1 | swing_squeak | swing hanger squeak (back, arc 6 deg) | -12 | -25.4 | -40.7 | +0.15 |
| 169 | 48.790 | 1463.7 | swing_push | push 1/4: hands on the back + chain jingle | -14 | -20.0 | -35.4 | +0.10 |
| 170 | 49.178 | 1475.3 | swing_squeak | swing hanger squeak (forward, arc 17 deg) | -12 | -21.7 | -37.1 | +0.15 |
| 171 | 49.953 | 1498.6 | swing_squeak | swing hanger squeak (back, arc 17 deg) | -12 | -21.7 | -37.1 | +0.15 |
| 172 | 50.340 | 1510.2 | swing_push | push 2/4: hands on the back + chain jingle | -14 | -20.0 | -35.4 | +0.10 |
| 173 | 50.727 | 1521.8 | swing_squeak | swing hanger squeak (forward, arc 28 deg) | -12 | -20.0 | -35.4 | +0.15 |
| 174 | 51.503 | 1545.1 | swing_squeak | swing hanger squeak (back, arc 28 deg) | -12 | -20.0 | -35.4 | +0.15 |
| 175 | 51.890 | 1556.7 | swing_push | push 3/4: hands on the back + chain jingle | -14 | -20.0 | -35.4 | +0.10 |
| 176 | 52.278 | 1568.3 | swing_squeak | swing hanger squeak (forward, arc 39 deg) | -12 | -18.9 | -34.2 | +0.15 |
| 177 | 53.053 | 1591.6 | swing_squeak | swing hanger squeak (back, arc 39 deg) | -12 | -18.9 | -34.2 | +0.15 |
| 178 | 53.440 | 1603.2 | swing_push | push 4/4: hands on the back + chain jingle | -14 | -20.0 | -35.4 | +0.10 |
| 179 | 53.828 | 1614.8 | swing_squeak | swing hanger squeak (forward, arc 50 deg) | -12 | -18.0 | -33.4 | +0.15 |
| 180 | 54.000 | 1620.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.16) | -10 | -22.6 | -38.0 | +0.00 |
| 181 | 54.000 | 1620.0 | stomp | 74 boots in step (shot 13, cam 9 m, stomp x1.09) | -8 | -19.0 | -34.4 | +0.00 |
| 182 | 54.000 | 1620.0 | whoosh_xfade | crossfade back to the bridge | -12 | -18.0 | -33.4 | +0.00 |
| 183 | 54.500 | 1635.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.18) | -10 | -22.4 | -37.8 | +0.00 |
| 184 | 54.500 | 1635.0 | stomp | 74 boots in step (shot 13, cam 9 m, stomp x1.12) | -8 | -18.7 | -34.2 | +0.00 |
| 185 | 55.000 | 1650.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.19) | -10 | -22.3 | -37.6 | +0.00 |
| 186 | 55.000 | 1650.0 | stomp | 74 boots in step (shot 13, cam 9 m, stomp x1.15) | -8 | -18.5 | -33.9 | +0.00 |
| 187 | 55.500 | 1665.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.20) | -10 | -22.1 | -37.5 | +0.00 |
| 188 | 55.500 | 1665.0 | stomp | 74 boots in step (shot 13, cam 9 m, stomp x1.18) | -8 | -18.3 | -33.7 | +0.00 |
| 189 | 56.000 | 1680.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.21) | -10 | -22.0 | -37.4 | +0.00 |
| 190 | 56.000 | 1680.0 | stomp | 74 boots in step (shot 13, cam 9 m, stomp x1.21) | -8 | -18.1 | -33.5 | +0.00 |
| 191 | 56.167 | 1685.0 | whoosh_cam | camera drift in (golden march) | -11 | -17.0 | -32.4 | +0.00 |
| 192 | 56.500 | 1695.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.22) | -10 | -20.9 | -36.3 | +0.00 |
| 193 | 56.500 | 1695.0 | stomp | 74 boots in step (shot 13, cam 7 m, stomp x1.24) | -8 | -16.3 | -31.7 | +0.00 |
| 194 | 57.000 | 1710.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.23) | -10 | -20.8 | -36.1 | +0.00 |
| 195 | 57.000 | 1710.0 | stomp | 74 boots in step (shot 13, cam 7 m, stomp x1.27) | -8 | -16.1 | -31.5 | +0.00 |
| 196 | 57.500 | 1725.0 | deck_flex | deck flex whump + plank creak + hangers (bounce amp 0.24) | -10 | -20.6 | -36.0 | +0.00 |
| 197 | 57.500 | 1725.0 | stomp | 74 boots in step (shot 13, cam 7 m, stomp x1.30) | -8 | -15.9 | -31.3 | +0.00 |
| 198 | 57.700 | 1731.0 | amb_bank (bed, integrated) | river bank: river close by, breeze, sparrows (shot 14) | -26 | -26.0 | -41.4 | +0.00 |
| 199 | 57.833 | 1735.0 | whoosh_xfade | crossfade to the bank | -12 | -18.0 | -33.4 | +0.00 |
| 200 | 59.000 | 1770.0 | whoosh_cam | camera move to the sign | -11 | -17.0 | -32.4 | +0.00 |
| 201 | 59.700 | 1791.0 | hammer_swish | hammer swing | -20 | -26.0 | -41.4 | +0.30 |
| 202 | 59.790 | 1793.7 | hammer | hammer blow 1/3 nailing the sign: steel 'tink' + board 'thock' + post | -5 | -11.0 | -26.4 | +0.30 |
| 203 | 60.240 | 1807.2 | hammer_swish | hammer swing | -20 | -26.0 | -41.4 | +0.30 |
| 204 | 60.330 | 1809.9 | hammer | hammer blow 2/3 nailing the sign: steel 'tink' + board 'thock' + post | -5 | -11.0 | -26.4 | +0.30 |
| 205 | 61.600 | 1848.0 | hammer_swish | hammer swing | -20 | -26.0 | -41.4 | +0.30 |
| 206 | 61.690 | 1850.7 | hammer | hammer blow 3/3 nailing the sign: steel 'tink' + board 'thock' + post | -4 | -10.0 | -25.4 | +0.30 |
| 207 | 61.950 | 1858.5 | amb_town (bed, integrated) | town day air on the rebuilt bridge: breeze, sparrows, flags, river (shot 15) | -29 | -29.0 | -44.4 | +0.00 |
| 208 | 62.000 | 1860.0 | town_murmur | townsfolk chatting on the banks (shot 15) | -11 | -17.0 | -32.6 | +0.00 |
| 209 | 62.021 | 1860.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -37.8 | +0.07 |
| 210 | 62.022 | 1860.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -38.0 | +0.01 |
| 211 | 62.037 | 1861.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.6 | -40.3 | +0.01 |
| 212 | 62.049 | 1861.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.9 | -39.4 | +0.32 |
| 213 | 62.098 | 1862.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.8 | -40.5 | +0.06 |
| 214 | 62.100 | 1863.0 | whoosh_xfade | crossfade to the rebuilt bridge | -12 | -18.0 | -33.4 | +0.00 |
| 215 | 62.237 | 1867.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.9 | -39.7 | +0.03 |
| 216 | 62.263 | 1867.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.6 | -39.2 | +0.15 |
| 217 | 62.317 | 1869.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.4 | -40.0 | +0.08 |
| 218 | 62.380 | 1871.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.1 | -38.6 | +0.08 |
| 219 | 62.425 | 1872.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.7 | -38.4 | +0.04 |
| 220 | 62.485 | 1874.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.6 | -38.2 | +0.15 |
| 221 | 62.574 | 1877.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.2 | -38.7 | +0.05 |
| 222 | 62.657 | 1879.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.7 | -38.3 | +0.29 |
| 223 | 62.667 | 1880.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.7 | -39.6 | -0.00 |
| 224 | 62.684 | 1880.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.8 | -39.3 | +0.19 |
| 225 | 62.689 | 1880.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.9 | -40.5 | +0.21 |
| 226 | 62.691 | 1880.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.1 | -38.6 | +0.17 |
| 227 | 62.714 | 1881.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.5 | -38.1 | -0.02 |
| 228 | 62.751 | 1882.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.0 | -39.6 | +0.33 |
| 229 | 62.754 | 1882.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.4 | -37.9 | +0.07 |
| 230 | 62.769 | 1883.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.9 | -39.4 | +0.29 |
| 231 | 62.793 | 1883.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.4 | -40.2 | +0.01 |
| 232 | 62.825 | 1884.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.7 | +0.17 |
| 233 | 62.837 | 1885.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -37.9 | +0.09 |
| 234 | 62.857 | 1885.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.7 | -39.2 | +0.13 |
| 235 | 62.857 | 1885.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -38.9 | +0.06 |
| 236 | 62.941 | 1888.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.6 | -38.3 | +0.01 |
| 237 | 63.004 | 1890.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.8 | -38.5 | +0.08 |
| 238 | 63.028 | 1890.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.5 | -39.0 | +0.19 |
| 239 | 63.234 | 1897.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.8 | -39.5 | +0.01 |
| 240 | 63.246 | 1897.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.8 | -38.4 | +0.03 |
| 241 | 63.247 | 1897.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.1 | -38.6 | +0.15 |
| 242 | 63.327 | 1899.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.5 | -38.0 | +0.04 |
| 243 | 63.335 | 1900.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.9 | +0.16 |
| 244 | 63.335 | 1900.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.6 | +0.05 |
| 245 | 63.421 | 1902.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -25.0 | -40.6 | -0.00 |
| 246 | 63.431 | 1902.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.7 | -39.3 | +0.09 |
| 247 | 63.446 | 1903.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.8 | -39.4 | +0.22 |
| 248 | 63.453 | 1903.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.8 | -38.3 | +0.35 |
| 249 | 63.457 | 1903.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.5 | -40.0 | +0.18 |
| 250 | 63.488 | 1904.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.8 | +0.08 |
| 251 | 63.500 | 1905.0 | whoosh_cam | camera move along the tourists | -11 | -17.0 | -32.4 | +0.00 |
| 252 | 63.616 | 1908.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.6 | -40.2 | -0.07 |
| 253 | 63.629 | 1908.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.6 | -38.1 | -0.01 |
| 254 | 63.634 | 1909.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.6 | +0.07 |
| 255 | 63.639 | 1909.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.4 | -37.8 | -0.04 |
| 256 | 63.684 | 1910.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -37.8 | -0.22 |
| 257 | 63.688 | 1910.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.1 | -39.7 | -0.19 |
| 258 | 63.692 | 1910.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.6 | -40.1 | -0.10 |
| 259 | 63.697 | 1910.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.6 | -38.2 | +0.02 |
| 260 | 63.774 | 1913.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.2 | -39.9 | -0.13 |
| 261 | 63.860 | 1915.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.7 | -0.18 |
| 262 | 64.009 | 1920.3 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.0 | -39.5 | -0.05 |
| 263 | 64.096 | 1922.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.0 | -37.7 | -0.10 |
| 264 | 64.100 | 1923.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.9 | -40.5 | -0.10 |
| 265 | 64.155 | 1924.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.8 | -38.3 | +0.06 |
| 266 | 64.175 | 1925.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.9 | -38.6 | -0.16 |
| 267 | 64.203 | 1926.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.5 | -40.2 | +0.05 |
| 268 | 64.221 | 1926.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -21.8 | -37.3 | -0.35 |
| 269 | 64.224 | 1926.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -38.9 | -0.18 |
| 270 | 64.229 | 1926.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.8 | -0.13 |
| 271 | 64.256 | 1927.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.6 | -40.4 | -0.11 |
| 272 | 64.301 | 1929.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -20.9 | -36.3 | -0.33 |
| 273 | 64.376 | 1931.3 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.7 | -38.3 | -0.10 |
| 274 | 64.380 | 1931.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.0 | -0.11 |
| 275 | 64.407 | 1932.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.7 | -0.09 |
| 276 | 64.430 | 1932.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.5 | -39.1 | -0.12 |
| 277 | 64.482 | 1934.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -38.9 | -0.15 |
| 278 | 64.499 | 1935.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.7 | -38.2 | +0.03 |
| 279 | 64.539 | 1936.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -38.8 | -0.21 |
| 280 | 64.569 | 1937.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.9 | -38.5 | +0.02 |
| 281 | 64.574 | 1937.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.1 | -37.7 | -0.05 |
| 282 | 64.621 | 1938.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -20.9 | -36.3 | -0.10 |
| 283 | 64.654 | 1939.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.7 | -40.3 | -0.24 |
| 284 | 64.756 | 1942.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.2 | -39.7 | -0.14 |
| 285 | 64.771 | 1943.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.7 | -0.05 |
| 286 | 64.778 | 1943.3 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.7 | -39.4 | -0.19 |
| 287 | 64.856 | 1945.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -21.7 | -37.2 | +0.07 |
| 288 | 64.857 | 1945.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.0 | -39.8 | -0.10 |
| 289 | 64.929 | 1947.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -37.9 | -0.16 |
| 290 | 64.954 | 1948.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.1 | -37.6 | -0.38 |
| 291 | 64.961 | 1948.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.1 | -37.7 | +0.05 |
| 292 | 64.991 | 1949.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.5 | -39.1 | -0.20 |
| 293 | 65.068 | 1952.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.9 | -38.6 | -0.11 |
| 294 | 65.131 | 1953.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.5 | -0.13 |
| 295 | 65.135 | 1954.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.6 | -39.2 | -0.10 |
| 296 | 65.265 | 1957.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.5 | -40.2 | -0.12 |
| 297 | 65.343 | 1960.3 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.1 | -39.6 | -0.10 |
| 298 | 65.364 | 1960.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.1 | -38.6 | +0.03 |
| 299 | 65.390 | 1961.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.4 | -39.9 | -0.22 |
| 300 | 65.400 | 1962.0 | whoosh_cam | camera crane out, ending | -11 | -17.0 | -32.4 | +0.00 |
| 301 | 65.441 | 1963.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.5 | -40.1 | +0.19 |
| 302 | 65.479 | 1964.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.7 | -40.2 | +0.30 |
| 303 | 65.519 | 1965.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.8 | -40.3 | +0.41 |
| 304 | 65.532 | 1966.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.0 | +0.34 |
| 305 | 65.533 | 1966.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.6 | -40.2 | +0.38 |
| 306 | 65.558 | 1966.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.0 | +0.56 |
| 307 | 65.573 | 1967.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.5 | -38.1 | +0.54 |
| 308 | 65.603 | 1968.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.5 | -39.0 | +0.59 |
| 309 | 65.618 | 1968.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -39.0 | +0.34 |
| 310 | 65.624 | 1968.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.6 | -38.1 | +0.35 |
| 311 | 65.627 | 1968.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.1 | +0.29 |
| 312 | 65.683 | 1970.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.2 | -38.9 | +0.34 |
| 313 | 65.688 | 1970.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.9 | -39.6 | +0.54 |
| 314 | 65.697 | 1970.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.2 | -39.8 | +0.40 |
| 315 | 65.718 | 1971.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -38.9 | +0.50 |
| 316 | 65.737 | 1972.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.4 | -38.2 | +0.34 |
| 317 | 65.756 | 1972.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.0 | -37.7 | +0.44 |
| 318 | 65.757 | 1972.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.0 | +0.58 |
| 319 | 65.894 | 1976.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.7 | -40.5 | +0.42 |
| 320 | 66.032 | 1981.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.8 | -40.5 | +0.43 |
| 321 | 66.229 | 1986.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.6 | +0.61 |
| 322 | 66.241 | 1987.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.1 | +0.53 |
| 323 | 66.260 | 1987.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -37.9 | +0.64 |
| 324 | 66.274 | 1988.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -25.0 | -41.0 | +0.38 |
| 325 | 66.295 | 1988.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.1 | -39.8 | +0.51 |
| 326 | 66.313 | 1989.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -39.2 | +0.49 |
| 327 | 66.379 | 1991.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.3 | +0.41 |
| 328 | 66.421 | 1992.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.9 | +0.58 |
| 329 | 66.437 | 1993.1 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.4 | -39.3 | +0.38 |
| 330 | 66.443 | 1993.3 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.4 | -40.0 | +0.47 |
| 331 | 66.465 | 1993.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -38.1 | +0.56 |
| 332 | 66.475 | 1994.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.7 | -39.3 | +0.53 |
| 333 | 66.524 | 1995.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.3 | -38.1 | +0.59 |
| 334 | 66.551 | 1996.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.1 | -38.9 | +0.53 |
| 335 | 66.583 | 1997.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.8 | +0.50 |
| 336 | 66.585 | 1997.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.9 | -39.5 | +0.64 |
| 337 | 66.586 | 1997.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.8 | -39.4 | +0.51 |
| 338 | 66.594 | 1997.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.9 | +0.43 |
| 339 | 66.615 | 1998.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.7 | -38.5 | +0.44 |
| 340 | 66.653 | 1999.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.6 | -38.2 | +0.43 |
| 341 | 66.719 | 2001.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.1 | -39.8 | +0.37 |
| 342 | 66.824 | 2004.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.9 | +0.36 |
| 343 | 66.846 | 2005.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.7 | -39.3 | +0.62 |
| 344 | 66.934 | 2008.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.5 | -39.5 | +0.43 |
| 345 | 66.962 | 2008.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.1 | -38.7 | +0.64 |
| 346 | 67.057 | 2011.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.9 | -38.8 | +0.51 |
| 347 | 67.092 | 2012.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.1 | -37.9 | +0.53 |
| 348 | 67.094 | 2012.8 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.8 | -40.4 | +0.61 |
| 349 | 67.131 | 2013.9 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -39.1 | +0.47 |
| 350 | 67.140 | 2014.2 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.0 | -39.8 | +0.41 |
| 351 | 67.155 | 2014.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.8 | +0.58 |
| 352 | 67.185 | 2015.6 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.3 | -39.2 | +0.49 |
| 353 | 67.192 | 2015.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.6 | -39.3 | +0.38 |
| 354 | 67.232 | 2017.0 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -24.1 | -40.0 | +0.53 |
| 355 | 67.283 | 2018.5 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.0 | -38.6 | +0.38 |
| 356 | 67.290 | 2018.7 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.5 | -38.2 | +0.60 |
| 357 | 67.410 | 2022.3 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -22.2 | -37.9 | +0.56 |
| 358 | 67.413 | 2022.4 | stroll_step | tourist footstep, out of step (24 strollers, own pace each) | -9 | -23.2 | -38.9 | +0.43 |
