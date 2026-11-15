import json, shutil
HEAD=open('proj/index.html').read()  # unused
H='''<!doctype html>
<html lang="en" data-resolution="portrait">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
#root{width:1080px;height:1920px;position:relative;background:#000}
#cv{position:absolute;inset:0;width:1080px;height:1920px}
#cap{position:absolute;left:60px;right:60px;top:1360px;text-align:center;font-family:"DejaVu Serif",Georgia,serif;font-weight:700;font-size:62px;line-height:1.2;color:#efe9dc;text-shadow:0 4px 20px #000,0 0 6px #000,0 0 2px #000}
#cap .w{opacity:.35}#cap .on{opacity:1}#cap .hot{color:#f0b24e}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="DUR" data-width="1080" data-height="1920">
  <canvas id="cv" class="clip" width="1080" height="1920" data-start="0" data-duration="DUR" data-track-index="0"></canvas>
  <div id="cap" class="clip" data-start="0" data-duration="DUR" data-track-index="1"></div>
  <audio id="music" src="assets/mix.wav" data-start="0" data-duration="DUR" data-track-index="2" data-volume="1"></audio>
</div>
<script>
const ease2=t=>{t=Math.max(0,Math.min(1,t));return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2};
'''
T='''
</script>
<script src="engine.js"></script>
<script src="scenes.js"></script>
</body>
</html>
'''
for p,dur in [('part1',36.32),('part2',37.49)]:
    cues=json.load(open(f'assets/{p}_cues.json'))['cues']
    body=f"window.PART={{dur:{dur},cues:{json.dumps(cues)},\n"+open(f'{p}_shots.js').read()+"};"
    open(f'{p}/index.html','w').write(H.replace('DUR',str(dur))+body+T)
    for f in ['engine.js','scenes.js']: shutil.copy(f,f'{p}/{f}')
print('built')
