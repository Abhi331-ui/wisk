#!/bin/bash
cd ~/shorts/war17
N=1334; K=4
for w in $(seq 0 $((K-1))); do a=$((w*N/K)); b=$(((w+1)*N/K-1)); (for i in 1 2 3 4; do MID=1 RESUME=1 node render.mjs frames "$a-$b" > work/render_$w.log 2>&1 && break; sleep 2; done) & done
wait
python3 work/dissolve.py "$(cat work/softcuts.txt)" > work/dissolve.log 2>&1
bash finish.sh "The Shortest War in History" > work/finish.log 2>&1
echo FULLDONE >> work/finish.log
