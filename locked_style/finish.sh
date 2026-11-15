#!/bin/bash
# finish.sh "Title": loudness (one gain + limiter), H.264 CRF 17 + AAC, freeze/black/loudness QA, qa_sheet.jpg
set -e
cd "$(dirname "$0")"
TITLE="${1:-video}"
OUT="out/${TITLE}.mp4"
N=$(ls frames/f*.jpg | wc -l)
echo "frames: $N"
(cd audio && python3 finish_audio.py mix.wav ../out/final_audio.wav)
ffmpeg -y -v error -framerate ${FPSOUT:-30} -i frames/f%04d.jpg -i out/final_audio.wav -map 0:v:0 -map 1:a:0 -vf "eq=contrast=1.18:saturation=1.22:gamma=0.97,scale=1440:2560:flags=lanczos,ass=work/captions.ass" \
  -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,nb_frames -of default=nw=1 "$OUT"
echo "--- freeze / black"
ffmpeg -v info -i "$OUT" -vf "freezedetect=n=-60dB:d=0.4,blackdetect=d=0.05:pix_th=0.08" -an -f null - 2>&1 | grep -E "freeze_|black_" || echo "none"
echo "--- loudness"
ffmpeg -nostats -i "$OUT" -filter_complex ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary" | grep -E "I:|LRA:|Peak:"
mkdir -p out/qa && rm -f out/qa/*.jpg
for i in $(seq 0 30 $((N-1))); do cp "frames/f$(printf %04d $i).jpg" out/qa/; done
python3 sheet.py out/qa out/qa_sheet.jpg 7
