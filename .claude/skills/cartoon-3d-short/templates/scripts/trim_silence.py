#!/usr/bin/env python3
"""Remove dead air from a voice-over.

Trims silence at the start and end, and shortens every pause inside the take so no gap is
longer than about --min-gap + --keep (default ~0.14 s). Words are never cut: only stretches quieter than the
threshold for longer than --min-gap are shortened. The threshold adapts to the take's loudness.

usage: python trim_silence.py voice_raw.wav voice.wav [--keep 0.04] [--min-gap 0.08] [--thresh-db auto|-45]
Output: 48 kHz mono 24-bit WAV + a report of the length before/after and the longest gap left.
Make words.json from the TRIMMED file, never from the raw one.
"""
import argparse, re, subprocess, sys

def run(args):
    return subprocess.run(args, capture_output=True, text=True)

def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(r.stdout.strip())

def mean_db(path):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect", "-f", "null", "-"])
    m = re.search(r"mean_volume:\s*(-?[\d.]+) dB", r.stderr)
    return float(m.group(1)) if m else -20.0

def gaps(path, thresh, min_gap):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-af",
             f"silencedetect=noise={thresh}dB:d={min_gap}", "-f", "null", "-"])
    return [float(x) for x in re.findall(r"silence_duration: ([\d.]+)", r.stderr)]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src"); ap.add_argument("dst")
    ap.add_argument("--keep", type=float, default=0.04, help="silence kept at each pause (s)")
    ap.add_argument("--min-gap", type=float, default=0.08, help="only pauses longer than this are shortened (s)")
    ap.add_argument("--thresh-db", default="auto", help="silence threshold in dB, or auto (mean - 26 dB)")
    a = ap.parse_args()

    t = (max(-55.0, min(-35.0, mean_db(a.src) - 26.0)) if a.thresh_db == "auto" else float(a.thresh_db))
    af = (f"silenceremove=start_periods=1:start_duration=0:start_threshold={t}dB:start_silence=0.02"
          f":stop_periods=-1:stop_duration={a.min_gap}:stop_threshold={t}dB:stop_silence={a.keep}"
          f":detection=rms:window=0.02,"
          # trailing silence: reverse, trim the start, reverse back
          f"areverse,silenceremove=start_periods=1:start_threshold={t}dB:start_silence=0.05,areverse,"
          f"afade=t=in:d=0.005")
    r = run(["ffmpeg", "-hide_banner", "-y", "-i", a.src, "-af", af,
             "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le", a.dst])
    if r.returncode:
        sys.exit(r.stderr[-2000:])

    before, after = duration(a.src), duration(a.dst)
    g_before, g_after = gaps(a.src, t, 0.2), gaps(a.dst, t, 0.2)
    print(f"threshold {t:.1f} dB")
    print(f"length   {before:.2f}s -> {after:.2f}s  (removed {before - after:.2f}s)")
    print(f"gaps >0.2s: {len(g_before)} (total {sum(g_before):.2f}s) -> {len(g_after)} (total {sum(g_after):.2f}s)")
    if g_after:
        print(f"WARNING: longest gap left {max(g_after):.2f}s: listen there (breath or noise above threshold?)")

if __name__ == "__main__":
    main()
