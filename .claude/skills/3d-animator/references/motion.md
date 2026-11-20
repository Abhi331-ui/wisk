# Motion

All motion is a function of t. Helpers in `kit/lib.js`: `seg`, `smooth`, `easeOut`, `easeInOut`, `backOut`, `spring`, `hash`.

## The four beats of any action
1. **Anticipation**: a small move the other way (squash down before a hop, a lamp head dips before it lifts), 3–6 frames.
2. **Action**: the main move, eased (`easeInOut` for travel, `easeOut` for things that are thrown or fall in).
3. **Overshoot**: past the target (`backOut(k, 1.7)`), 2–4 frames.
4. **Settle**: a damped spring back to rest: `spring(t, landTime, freq = 6, decay = 9)`.

```js
// the kit's mug: squash, hop, land
const hop = seg(t, 4.75, 5.05), air = Math.sin(Math.PI * hop) * 0.045;
const squash = -0.12 * Math.exp(-((t - 4.7) ** 2) / 0.002) + 0.10 * spring(t, 5.05, 6, 9);
mug.position.y = air; body.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);   // keep the volume
```

## Make things feel physical
- Heavy things start slow and stop slow; light things snap.
- Scale on squash must keep volume (`x * y * z` about 1).
- A thing that lands shakes what it lands on a little (a screen jiggles 1–2 mm on its stand).
- Rotation follows travel: a thrown object tilts into its path.

## Secondary motion
- Leaves, cables, steam, dust: slow sines with different speeds and phases per item (`Math.sin(t * (0.8 + 0.4 * hash(i)) + hash(i + 9) * 6.28)`).
- Keep amplitudes small (a few degrees, a few millimetres). It should be felt, not noticed.

## UI motion inside screens
- Typing: `text.slice(0, Math.floor(seg(t, a, b) * text.length))`, 12–20 characters per second, a blinking cursor (`Math.floor(t * 2.5) % 2`). Real typing has small pauses between words.
- Pop-ins: scale with `backOut`, 6–9 frames, staggered 2–4 frames.
- Progress bars: `easeOut` fill, then a beat of rest, then the result ("DONE").
- Never let text fade in slower than the viewer can read it.

## Timing to sound and voice
- Every action starts on its word or 1–2 frames before it.
- Every hit (pop, landing, switch) has a sound on that exact frame. Write the frame in a comment.
- Leave a breath (6–10 frames) after a big moment before the next one starts.

## Rhythm of a film
- Hook in the first second (something moves or changes).
- Fast cuts are not needed; one continuous move with clear beats reads better than many shots.
- The contrast beat (bad vs good) needs a clear pause between the two halves so the switch is felt.
