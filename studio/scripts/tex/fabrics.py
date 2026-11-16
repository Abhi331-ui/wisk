# Own textures: 1950s moquette upholstery, floral curtain chintz, fireplace tiles.
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import random, math
random.seed(5); O='/home/user/wisk/studio/public/assets/own/'
def grain(im, k=30):
    n=Image.effect_noise(im.size,k).convert('L'); return ImageChops.multiply(im,Image.merge('RGB',[n.point(lambda v:215+v//6)]*3))
# moquette: small leaf/diamond repeat in rust + moss on brown
S=1024; m=Image.new('RGB',(S,S),(104,116,92)); d=ImageDraw.Draw(m,'RGBA')
for y in range(0,S,4):
    for x in range(0,S,4):
        v=random.randint(-14,14)+(8 if (x//4+y//4)%2 else -8); d.rectangle([x,y,x+3,y+3],fill=(104+v,116+v,92+v))
for i in range(9000):
    x,y=random.randrange(S),random.randrange(S); c=random.choice([(176,150,96),(70,78,62),(150,120,90),(196,186,160)]); d.rectangle([x,y,x+2,y+1],fill=c+(200,))
m=grain(m.filter(ImageFilter.GaussianBlur(0.9)),60); m.save(O+'moquette.png')
# chintz curtains: big cabbage roses on cream
S=2048; c=Image.new('RGB',(S,S),(226,214,186)); d=ImageDraw.Draw(c,'RGBA')
def rose(cx,cy,s):
    for ring in range(6):
        rr=s*(1-ring*0.15)
        for p in range(6):
            a=p/6*math.tau+ring; px,py=cx+math.cos(a)*rr*0.3,cy+math.sin(a)*rr*0.3
            col=(int(150+ring*14),int(58+ring*12),int(70+ring*10),230); d.ellipse([px-rr*0.6,py-rr*0.5,px+rr*0.6,py+rr*0.5],fill=col)
for j in range(8):
    for i in range(6):
        cx=i*341+170+(j%2)*170; cy=j*256+128
        for k in range(5):
            a=random.uniform(0,math.tau); L=random.uniform(90,140); x2,y2=cx+math.cos(a)*L,cy+math.sin(a)*L
            d.line([(cx,cy),(x2,y2)],fill=(84,102,66,220),width=4); d.ellipse([x2-26,y2-11,x2+26,y2+11],fill=random.choice([(96,120,74,230),(120,138,88,230)]))
        rose(cx,cy,58); rose(cx+70,cy+50,34); rose(cx-80,cy+60,30)
c=grain(c.filter(ImageFilter.GaussianBlur(1.2)),30); c.save(O+'chintz.png')
# fireplace tiles: glazed buff/brown mottled 6-inch tiles
S=1024; t=Image.new('RGB',(S,S),(60,50,42)); d=ImageDraw.Draw(t)
for y in range(0,S,128):
    for x in range(0,S,128):
        base=random.choice([(196,164,118),(186,150,104),(170,134,96),(204,176,130)])
        d.rectangle([x+3,y+3,x+125,y+125],fill=base)
        for k in range(220):
            px,py=x+random.randint(6,122),y+random.randint(6,122); r=random.randint(2,7); s=random.randint(-30,10)
            d.ellipse([px-r,py-r,px+r,py+r],fill=tuple(max(0,min(255,b+s)) for b in base))
t=t.filter(ImageFilter.GaussianBlur(1.0)); t.save(O+'tiles_fire.png')
print('ok')
