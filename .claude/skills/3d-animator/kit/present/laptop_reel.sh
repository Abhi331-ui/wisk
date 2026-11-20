#!/bin/sh
# Put the film on the screen of a laptop photo, make it a 1080x1920 reel, add real hand shake, then the fixed overlays.
# usage: sh laptop_reel.sh <laptop_photo.png 1080x1920> <film.mp4> <SX> <SY> <SW> <SH> <out.mp4> [motion.csv] [overlay.png]
#   SX SY SW SH = the screen rectangle in the photo, in pixels (find it by opening the photo and reading the corners).
#   overlay.png = 1080x1920 transparent PNG with your title/caption; it stays still while the picture shakes.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
PHOTO=$1; FILM=$2; SX=$3; SY=$4; SW=$5; SH=$6; OUT=$7; MOTION=$8; OVER=$9
FH=$((SW * 9 / 16 / 2 * 2)); FY=$((SY + (SH - FH) / 2)); AX=$((SX + SW / 2)); AY=$((SY + SH / 2))
COMP="[1:v]fps=30,scale=$SW:$FH:flags=lanczos,format=rgba[film];[0:v]scale=1080:1920,format=rgba[pl];[pl][film]overlay=$SX:$FY:shortest=1,format=rgb24[v]"
if [ -n "$MOTION" ]; then
  ffmpeg -v error -loop 1 -framerate 30 -i "$PHOTO" -i "$FILM" -filter_complex "$COMP" -map "[v]" -f rawvideo - \
  | python3 "$HERE/handheld.py" "$MOTION" 1080 1920 $AX $AY \
  | ffmpeg -v error -y -f rawvideo -pix_fmt rgb24 -s 1080x1920 -r 30 -i - -i "$FILM" ${OVER:+-i "$OVER"} -filter_complex \
      "[0:v]${OVER:+[2:v]overlay=0:0,}format=yuv420p[o]" -map "[o]" -map 1:a? -c:v libx264 -crf 16 -preset slow -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
else
  ffmpeg -v error -y -loop 1 -framerate 30 -i "$PHOTO" -i "$FILM" ${OVER:+-i "$OVER"} -filter_complex \
      "$COMP;[v]${OVER:+[2:v]overlay=0:0,}format=yuv420p[o]" -map "[o]" -map 1:a? -c:v libx264 -crf 16 -preset slow -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
fi
echo "reel -> $OUT"
