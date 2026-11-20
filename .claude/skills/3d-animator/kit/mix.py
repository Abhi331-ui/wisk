#!/usr/bin/env python3
"""Build the soundtrack from sound/cues.json: voice + music (ducked under the voice) + one SFX per visible action,
then level it to a streaming loudness (default -14 LUFS) with a peak limiter at -1.5 dB, measured with ffmpeg's EBU R128 meter.
Each layer is placed by shifting its timestamps (asetpts) and filling the gap with silence: adelay feeding amix dropped the delay in some runs on ffmpeg 8.

usage: python3 mix.py [sound/cues.json] [sound/mix.wav]
Needs only Python 3 and ffmpeg. All times are in seconds of the FINAL film.

cues.json example:
{
  "length": 6.0,
  "target_lufs": -14,
  "voice": {"file": "sound/voice.wav", "at": 0.3, "gain_db": 0},
  "music": {"file": "sound/music.mp3", "start": 14.0, "gain_db": -14, "duck": true, "fade_out": 0.8},
  "sfx": [
    {"file": "sound/sfx/switch.wav", "at": 1.2, "gain_db": -8, "why": "lamp switches on"},
    {"file": "sound/sfx/typing.wav", "at": 1.9, "gain_db": -10, "trim": 1.1, "why": "prompt typing"}
  ]
}
"""
import json, subprocess, sys

cues_path = sys.argv[1] if len(sys.argv) > 1 else 'sound/cues.json'
out_path = sys.argv[2] if len(sys.argv) > 2 else 'sound/mix.wav'
cfg = json.load(open(cues_path))
L = float(cfg['length'])
inputs, chains, mix = [], [], []

def add_input(path, ss=None):
    if ss: inputs.extend(['-ss', str(ss)])
    inputs.extend(['-i', path]); return len([a for a in inputs if a == '-i']) - 1

def ms(t): return int(round(float(t) * 1000))

voice = cfg.get('voice')
if voice:
    i = add_input(voice['file'])
    d = ms(voice.get('at', 0))
    chains.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={voice.get('gain_db', 0)}dB,asetpts=PTS+{d}/1000/TB,aresample=async=1:first_pts=0,apad,atrim=0:{L}[vo]")
    if cfg.get('music', {}).get('duck', True) and cfg.get('music'):
        chains.append('[vo]asplit=2[vo_mix][vo_key]'); mix.append('[vo_mix]')
    else: mix.append('[vo]')

music = cfg.get('music')
if music:
    i = add_input(music['file'], music.get('start'))
    fo = float(music.get('fade_out', 0.8))
    chains.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{L},asetpts=N/SR/TB,volume={music.get('gain_db', -14)}dB,"
                  f"afade=t=in:d=0.05,afade=t=out:st={max(0, L - fo)}:d={fo},apad,atrim=0:{L}[mu]")
    if voice and music.get('duck', True):
        # the music dips while the voice talks, then comes back (attack 20 ms, release 350 ms)
        chains.append('[mu][vo_key]sidechaincompress=threshold=0.02:ratio=5:attack=20:release=350:makeup=1[mud]'); mix.append('[mud]')
    else: mix.append('[mu]')

for k, s in enumerate(cfg.get('sfx', [])):
    i = add_input(s['file'])
    d = ms(s['at']); trim = f",atrim=0:{s['trim']}" if s.get('trim') else ''
    chains.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo{trim},volume={s.get('gain_db', -8)}dB,asetpts=PTS+{d}/1000/TB,aresample=async=1:first_pts=0,apad,atrim=0:{L}[s{k}]")
    mix.append(f'[s{k}]')

if not mix: sys.exit('cues.json has no voice, music or sfx')
graph = ';'.join(chains) + f";{''.join(mix)}amix=inputs={len(mix)}:normalize=0:duration=longest,atrim=0:{L}[bus]"
T = cfg.get('target_lufs', -14)
tmp = out_path + '.raw.wav'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', graph, '-map', '[bus]', '-c:a', 'pcm_f32le', tmp], check=True)

def loudness(path, extra=''):
    """Integrated loudness (LUFS) and true peak (dBTP) with ffmpeg's EBU R128 meter."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', (extra + ',' if extra else '') + 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    summary = r[r.rindex('Summary:'):]
    I = float(summary.split('I:')[1].split('LUFS')[0]); P = float(summary.split('Peak:')[1].split('dBFS')[0])
    return I, P

I0, P0 = loudness(tmp)
gain = T - I0
for _ in range(3):   # gain up, limit the peaks to -1.5 dB, re-measure, correct what the limiter took
    chain = f'volume={gain:.2f}dB,alimiter=limit=0.84:attack=5:release=60:level=false'
    I1, P1 = loudness(tmp, chain)
    if abs(I1 - T) < 0.3: break
    gain += T - I1
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', tmp, '-af', chain + ',aresample=48000', '-c:a', 'pcm_s24le', out_path], check=True)
import os; os.replace(tmp, out_path + '.unlevelled.wav')
print(f"mix -> {out_path}  ({len(mix)} layers, {L:.2f} s)  {I0:.1f} LUFS -> {I1:.1f} LUFS (target {T}), true peak {P1:.1f} dBTP")
for name, at in [('voice', (voice or {}).get('at')), *[(c['file'].split('/')[-1], c['at']) for c in cfg.get('sfx', [])]]:
    if at is not None: print(f"  {float(at):6.2f} s  {name}")
