#!/usr/bin/env bash
# Assemble the spaghetti opening: 15 fps frames → motion-interpolated 30 fps → 1440x2560 → soundtrack (-14 LUFS).
set -euo pipefail
cd /home/user/wisk/studio
F=out/op/frames; OUT=out/op; mkdir -p $OUT
ls $F/f_*.jpg | sort | awk '{print "file \x27" ENVIRON["PWD"] "/" $0 "\x27\nduration 0.0666667"}' > $OUT/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $OUT/list.txt -vf "fps=15,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,scale=1440:2560:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 16 -an $OUT/video_noaudio.mp4
ffmpeg -v error -y -i $OUT/video_noaudio.mp4 -i public/audio/spaghetti_opening_mix.wav -map 0:v:0 -map 1:a:0 \
  -af "loudnorm=I=-14:TP=-1.0:LRA=7" -c:v copy -c:a aac -b:a 256k -ar 48000 -shortest $OUT/spaghetti_opening_2k.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact $OUT/spaghetti_opening_2k.mp4
