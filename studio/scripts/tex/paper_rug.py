# Own textures: 1950s rose-garland wallpaper and an Axminster-style rug (procedural, painted with PIL).
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import random, math
random.seed(11)
O='/home/user/wisk/studio/public/assets/own/'
S=2048; im=Image.new('RGB',(S,S),(231,219,194)); d=ImageDraw.Draw(im,'RGBA')
for k in range(0,S,170): d.rectangle([k,0,k+56,S],fill=(214,198,168,90)); d.line([(k+60,0),(k+60,S)],fill=(200,182,150,70),width=3)
def leaf(x,y,a,L,w,col):
    pts=[]
    for i in range(21):
        t=i/20; r=math.sin(t*math.pi)*w; pts.append((x+math.cos(a)*L*t-math.sin(a)*r, y+math.sin(a)*L*t+math.cos(a)*r))
    for i in range(20,-1,-1):
        t=i/20; r=math.sin(t*math.pi)*w; pts.append((x+math.cos(a)*L*t+math.sin(a)*r, y+math.sin(a)*L*t-math.cos(a)*r))
    d.polygon(pts,fill=col); dark=tuple(max(0,c-35) for c in col[:3])+(200,)
    d.line([(x,y),(x+math.cos(a)*L*0.95,y+math.sin(a)*L*0.95)],fill=dark,width=2)
    for i in range(1,6):
        t=i/6; bx,by=x+math.cos(a)*L*t,y+math.sin(a)*L*t
        for s in (-1,1): d.line([(bx,by),(bx+math.cos(a+s*0.8)*w*0.8,by+math.sin(a+s*0.8)*w*0.8)],fill=dark,width=1)
def rose(cx,cy,s,base):
    r0,g0,b0=base
    for ring in range(7):
        rr=s*(1-ring*0.13); n=7-ring//2
        for p in range(n):
            a=p/n*2*math.pi+ring*0.6; px,py=cx+math.cos(a)*rr*0.35,cy+math.sin(a)*rr*0.3
            sh=ring*9; col=(min(255,int(r0+sh)),min(255,int(g0+sh*0.7)),min(255,int(b0+sh*0.6)),235)
            d.ellipse([px-rr*0.55,py-rr*0.45,px+rr*0.55,py+rr*0.45],fill=col)
            d.arc([px-rr*0.55,py-rr*0.45,px+rr*0.55,py+rr*0.45],200,330,fill=(r0-40,g0-30,b0-30,200),width=2)
    d.ellipse([cx-s*0.16,cy-s*0.14,cx+s*0.16,cy+s*0.14],fill=(r0-30,g0-25,b0-25,255))
for j in range(4):
    for i in range(3):
        cx=i*683+340+(j%2)*340; cy=j*512+250
        pts=[(cx-300+t*9, cy+70*math.sin(t*0.07+i)) for t in range(68)]
        d.line(pts,fill=(96,104,70,230),width=6)
        for t in range(5,68,7):
            x,y=pts[t]; a=random.uniform(-2.8,-0.4) if t%2 else random.uniform(0.4,2.8)
            leaf(x,y,a,random.uniform(55,80),random.uniform(14,20),random.choice([(110,128,84,235),(92,112,72,235),(126,140,96,235)]))
        rose(cx-140,cy+20,62,(176,88,84)); rose(cx+120,cy-30,50,(190,106,98)); rose(cx+10,cy+40,30,(204,128,118))
        for b in range(3):
            bx,by=cx+random.randint(-260,260),cy+random.randint(-60,60); d.ellipse([bx-12,by-16,bx+12,by+16],fill=(170,84,84,230)); leaf(bx,by+14,1.6,26,8,(100,118,76,230))
im=im.filter(ImageFilter.GaussianBlur(1.1))
noise=Image.effect_noise((S,S),18).convert('L'); im=ImageChops.multiply(im,Image.merge('RGB',[noise.point(lambda v:235+v//12)]*3))
im.save(O+'wallpaper_1957.png'); print('wallpaper ok')
W,H=2400,1800; r=Image.new('RGB',(W,H),(110,28,30)); d=ImageDraw.Draw(r,'RGBA')
for m,c in [(0,(46,30,40)),(50,(176,128,62)),(80,(36,52,74)),(190,(176,128,62)),(212,(110,28,30))]: d.rectangle([m,m,W-m,H-m],fill=c)
for x in range(110,W-110,60):
    for y in (135,H-135): d.polygon([(x,y-30),(x+25,y),(x,y+30),(x-25,y)],fill=(196,150,82)); d.ellipse([x-8,y-8,x+8,y+8],fill=(150,40,40))
for y in range(110,H-110,60):
    for x in (135,W-135): d.polygon([(x,y-30),(x+25,y),(x,y+30),(x-25,y)],fill=(196,150,82)); d.ellipse([x-8,y-8,x+8,y+8],fill=(150,40,40))
for y in range(260,H-240,90):
    for x in range(260,W-240,90):
        o=45 if (y//90)%2 else 0
        d.ellipse([x+o-10,y-10,x+o+10,y+10],fill=(196,150,82,200)); d.line([(x+o-22,y),(x+o+22,y)],fill=(36,52,74,160),width=3)
cx,cy=W//2,H//2
for rr,c in [(520,(36,52,74)),(470,(176,128,62)),(430,(110,28,30)),(300,(222,196,140)),(250,(36,52,74)),(120,(176,128,62)),(60,(150,40,40))]:
    d.polygon([(cx+math.cos(a/32*math.tau)*rr*(1+0.12*math.cos(a/32*math.tau*8)), cy+math.sin(a/32*math.tau)*rr*0.72*(1+0.12*math.cos(a/32*math.tau*8))) for a in range(32)],fill=c)
r=r.filter(ImageFilter.GaussianBlur(1.6)); noise=Image.effect_noise((W,H),40).convert('L')
r=ImageChops.multiply(r,Image.merge('RGB',[noise.point(lambda v:200+v//5)]*3)); r.save(O+'rug_1950s.png'); print('rug ok')
