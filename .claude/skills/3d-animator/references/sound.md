# Sound

The voice sets the clock, the music gives the bed, and the effects make every action real. `kit/mix.py` builds the mix from `sound/cues.json` and levels it.

## 1. Voice
- ElevenLabs text-to-speech **with timestamps** (`/v1/text-to-speech/{voice_id}/with-timestamps`) returns the audio plus the time of every character. Group the characters into words, then save them as `[word, start]` for the captions.
- Or record yourself, then get word times with Whisper (`whisper voice.wav --word_timestamps True`) if you have it.
- Keep the voice at its natural speed. Fix timing with pauses, separate lines or a new take, never with time-stretching or pitch shifting.
- Generate 3–4 takes of a line and pick by ear. If one word is croaky (vocal fry) or has a hiss burst, re-generate that line before you touch anything else.
- Read the API key from `.env` (`ELEVENLABS_API_KEY=...`), keep `.env` out of git, and never print the key.

## 2. Captions
- Show the word on its start time, or 1 frame early. Pop it in over 3–4 frames.
- Highlight 1–2 key words per line in an accent colour.
- Keep them away from the bottom 10 % and the top 12 % of the frame (app UI covers those areas on phones).

## 3. Music
- Use a track the user has the rights to, or a royalty-free one. Never use extracted stems of someone else's track.
- Start the track at a strong point (`"start": 14.0` in cues.json) so the film opens on energy.
- Duck it under the voice: `mix.py` uses a sidechain compressor (attack 20 ms, release 350 ms).
- With no voice, the music is the clock: put cuts and hits on the kick, not near it.

## 4. Sound effects
- One per visible action, on its exact frame: key taps or a typing bed, switches, the latch of a disk, the camera whoosh, UI pops, a notification for each message bubble, the landing of an object.
- Never cut a sound effect so short that its tail is lost. Use the whole sound and lower it instead.
- **Phone speakers.** They don't reproduce much below about 200 Hz, so effects made of sub-bass disappear. Choose or layer sounds with content around 1–8 kHz (air, clicks, rattles).
- Levels that worked, measured in the 1–8 kHz band:
  - each effect at about the voice −6 dB, or the ducked music +7 dB, whichever is louder;
  - effect peaks below −10 dBFS on the effects bus.
- Typing for a keyboard shot: a mechanical keyboard recording, compressed, about level with the voice.
- AI sound effects (ElevenLabs sound generation) work for things you can't find, like a floppy drive reading. Make 4 takes per prompt and pick by ear.

## 5. Mix and master
- `cues.json`: `length`, `voice`, `music`, `sfx[]` with `at` (seconds in the final film), `gain_db` and an optional `trim`.
- `python3 mix.py sound/cues.json sound/mix.wav`. It prints the loudness before and after levelling.
- Target −14 LUFS integrated, peaks limited around −1.5 dBFS.
- Mux the mix with the picture: `node render.mjs --video --n=48 --audio=sound/mix.wav`, or `ffmpeg -i film.mp4 -i mix.wav -c:v copy -c:a aac -b:a 256k -shortest out.mp4`.
- Listen on a phone speaker before you call it done. If an effect is too quiet there, raise that effect. Don't raise the master.

## ffmpeg gotchas
- `amix` divides the inputs' levels unless you use `normalize=0`.
- `amix weights='1 -1'` does not subtract a signal. To invert one, use `volume=-1` on it first.
- `adelay` takes milliseconds per channel: `adelay=1200|1200`.
