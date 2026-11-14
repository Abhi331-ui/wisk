"""2D character v2 — traced from the reference crop (coordinates are in a 600x1280 crop space, 4x of the
reference's 150x320 region). Placed onto the Blender set with the seat + stump anchors.
Usage: python3 char2d_v2.py anchors.json out.svg
"""
import json, sys

anch = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
# reference anchors in crop space: seat (bottom of body on crate) and feet on stump top
REF_SEAT_Y, REF_FOOT = 822, (300, 1236)
fx, fy = anch["stump_top_center"]
seat_y = anch["seat_front_center"][1]
S = (fy - seat_y) / (REF_FOOT[1] - REF_SEAT_Y)          # px per crop unit
TX, TY = fx - REF_FOOT[0] * S + 45, fy - REF_FOOT[1] * S   # sit just right of the post, like the reference

INK = "#1f1418"
ribs_dome = "".join(f'<line x1="{120 + i * 26}" y1="{60 + abs(i - 8) * 4}" x2="{112 + i * 26 + (i - 8) * 3}" y2="{200 + i * 4}"/>' for i in range(17))
ribs_cuff = "".join(f'<line x1="{98 + i * 22}" y1="{120 + i * 4.3}" x2="{100 + i * 22}" y2="{200 + i * 4.3}"/>' for i in range(20))
crumbs = "".join(f'<circle cx="{262 + (i * 37) % 110}" cy="{486 + (i * 29) % 90}" r="2.2" fill="#cbb48c"/>' for i in range(16))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs>
  <linearGradient id="shirt" x1="0" x2="1"><stop offset="0" stop-color="#4fb5ac"/><stop offset="0.6" stop-color="#3fa59c"/><stop offset="1" stop-color="#2d8079"/></linearGradient>
  <radialGradient id="skin" cx="0.35" cy="0.4" r="0.8"><stop offset="0" stop-color="#fdf7f5"/><stop offset="0.65" stop-color="#f6ebe8"/><stop offset="1" stop-color="#e3cbc6"/></radialGradient>
  <linearGradient id="hat" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ddaa3c"/><stop offset="1" stop-color="#c08a26"/></linearGradient>
  <linearGradient id="bread" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#efe0c4"/><stop offset="1" stop-color="#dcc6a0"/></linearGradient>
  <clipPath id="dome"><path d="M118,150 C130,70 260,40 340,52 C430,66 500,130 506,215 L118,150 Z"/></clipPath>
  <clipPath id="cuff"><path d="M100,135 L508,208 C516,236 514,258 506,276 L96,198 C88,176 90,152 100,135 Z"/></clipPath>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
</defs>
<g transform="translate({TX:.1f},{TY:.1f}) scale({S:.4f})">
  <ellipse cx="250" cy="830" rx="230" ry="26" fill="#000" opacity="0.38" filter="url(#soft)"/>
  <ellipse cx="290" cy="1242" rx="110" ry="18" fill="#000" opacity="0.4" filter="url(#soft)"/>

  <!-- legs: left nearly straight down, right crossed: thigh out to the knee then shin back down -->
  <path d="M188,826 C196,950 206,1100 214,1232" fill="none" stroke="{INK}" stroke-width="15" stroke-linecap="round"/>
  <path d="M276,820 C320,840 370,858 398,874 C392,980 360,1110 334,1232" fill="none" stroke="{INK}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="206" cy="1238" rx="30" ry="13" fill="{INK}"/>
  <ellipse cx="342" cy="1238" rx="30" ry="13" fill="{INK}"/>

  <!-- body: tall teal bean -->
  <path d="M60,640 C58,540 120,470 250,462 C380,456 444,520 446,620 L446,740 C446,800 410,822 330,824 L160,826 C90,826 60,800 60,740 Z"
        fill="url(#shirt)" stroke="{INK}" stroke-width="13" stroke-linejoin="round"/>
  <!-- hanging arm (character's left, screen right) down to the seat -->
  <path d="M432,520 C462,600 466,700 444,780 C436,806 418,822 400,834" fill="none" stroke="{INK}" stroke-width="13" stroke-linecap="round"/>
  <circle cx="396" cy="836" r="17" fill="{INK}"/>

  <!-- head: rounded oval, slightly tilted -->
  <g transform="rotate(6 290 330)">
    <ellipse cx="290" cy="330" rx="214" ry="150" fill="url(#skin)" stroke="{INK}" stroke-width="13"/>
  </g>
  <!-- ear on the right -->
  <path d="M440,420 C478,404 500,446 478,476 C464,496 438,494 424,480" fill="#f4e6e2" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>
  <path d="M452,438 C470,440 474,462 460,470" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>
  <!-- hair: cap under the beanie + jagged fringe; longer on the left side -->
  <path d="M84,330 C70,250 100,180 150,160 L500,232 C510,252 506,272 498,286
           L478,272 L466,288 L448,270 L432,290 L414,268 L398,286 L380,264 L362,282 L346,258 L328,276 L312,252 L294,270 L278,248 L260,264 L244,242 L226,258 L210,238 L192,252 L176,236 L160,252 L144,244 C124,258 110,284 106,320 C100,334 92,340 84,330 Z"
        fill="#1d1519" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
  <!-- beanie: ribbed dome + thick ribbed folded cuff, worn tilted back -->
  <path d="M118,150 C130,70 260,40 340,52 C430,66 500,130 506,215 Z" fill="url(#hat)" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
  <g clip-path="url(#dome)" stroke="#a7781c" stroke-width="7" opacity="0.75">{ribs_dome}</g>
  <path d="M100,135 L508,208 C516,236 514,258 506,276 L96,198 C88,176 90,152 100,135 Z" fill="#d7a234" stroke="{INK}" stroke-width="12" stroke-linejoin="round"/>
  <g clip-path="url(#cuff)" stroke="#9e6f18" stroke-width="7" opacity="0.8">{ribs_cuff}</g>

  <!-- sleepy, suspicious eyes: heavy flat lids over small dark almond pupils -->
  <path d="M232,300 C236,322 278,324 282,300 Z" fill="{INK}"/>
  <path d="M352,330 C356,354 400,356 404,332 Z" fill="{INK}"/>
  <path d="M218,296 C240,288 270,290 292,298" fill="none" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>
  <path d="M338,326 C362,320 392,322 414,330" fill="none" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>
  <!-- tiny 'o' mouth -->
  <ellipse cx="296" cy="402" rx="13" ry="10" fill="#3a1216" stroke="{INK}" stroke-width="5"/>

  <!-- arm bending up from the chest to the bread (character's right, screen left) -->
  <path d="M138,522 C146,580 150,630 170,656 C196,674 250,630 300,586" fill="none" stroke="{INK}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- bread under the chin: bite on top, lettuce peeking out both sides -->
  <path d="M232,500 C222,482 240,470 252,480 C262,470 278,476 282,488 Z" fill="#c9d64a" stroke="{INK}" stroke-width="4"/>
  <path d="M372,500 C392,494 400,516 388,530 C398,540 392,560 376,556 Z" fill="#b9cc3e" stroke="{INK}" stroke-width="4"/>
  <g transform="rotate(4 312 520)">
    <path d="M246,470 C252,462 266,460 276,466 C288,486 330,488 344,464 C356,458 376,462 382,474 L384,570 C384,582 376,588 366,588 L262,588 C252,588 244,582 244,572 Z"
          fill="url(#bread)" stroke="#b78044" stroke-width="7" stroke-linejoin="round"/>
    {crumbs}
  </g>
  <circle cx="302" cy="588" r="15" fill="{INK}"/>
</g>
</svg>'''
open(OUT, "w").write(svg)
print("wrote", OUT, "scale", round(S, 4))
