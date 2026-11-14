"""2D vector character (SVG), drawn in 1080x1920 frame space, then shifted onto the Blender set.
Pose: sitting on crates, knees up, feet on the stump, chewing a slice of bread held to the mouth,
half-lidded side glance. Usage: python3 char2d.py anchors.json out.svg [mood]
"""
import json, sys

anch = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
# design-space anchor (where the feet meet the stump top) -> scene anchor from Blender
SX, SY = anch["stump_top_center"]
S = anch["px_per_metre_at_seat"] / 327.5   # design was drawn for 327.5 px per metre

INK = "#22161b"
W = 8  # ink width

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<defs>
  <linearGradient id="shirt" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#5cc0b6"/><stop offset="0.55" stop-color="#47ab a2"/><stop offset="1" stop-color="#2f8079"/>
  </linearGradient>
  <radialGradient id="skin" cx="0.38" cy="0.35" r="0.75">
    <stop offset="0" stop-color="#fffaf6"/><stop offset="0.7" stop-color="#f7ebe6"/><stop offset="1" stop-color="#e9cfc8"/>
  </radialGradient>
  <linearGradient id="hat" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="#e8b443"/><stop offset="1" stop-color="#c58d26"/>
  </linearGradient>
  <linearGradient id="bread" x1="0" x2="1" y1="0" y2="1">
    <stop offset="0" stop-color="#f6ead0"/><stop offset="1" stop-color="#e2cfa7"/>
  </linearGradient>
  <clipPath id="domeclip"><path d="M418,832 C418,700 682,690 684,832 Z"/></clipPath>
  <clipPath id="brimclip"><rect x="414" y="800" width="276" height="48" rx="22"/></clipPath>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<g transform="translate({SX:.1f},{SY:.1f}) scale({S:.3f}) translate(-548,-1386)">
  <!-- contact shadows on the crate and stump -->
  <ellipse cx="505" cy="1200" rx="150" ry="22" fill="#000" opacity="0.35" filter="url(#soft)"/>
  <ellipse cx="555" cy="1392" rx="60" ry="12" fill="#000" opacity="0.4" filter="url(#soft)"/>

  <!-- back leg (crossed under) -->
  <path d="M520,1188 C575,1196 618,1192 622,1178 C632,1240 590,1320 578,1384" fill="none" stroke="{INK}" stroke-width="{W+2}" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="586" cy="1388" rx="22" ry="11" fill="{INK}"/>

  <!-- hanging arm (screen-left) down to the crate -->
  <path d="M398,1010 C372,1070 372,1140 392,1196" fill="none" stroke="{INK}" stroke-width="{W+1}" stroke-linecap="round"/>
  <circle cx="393" cy="1198" r="11" fill="{INK}"/>

  <!-- body -->
  <path d="M395,1040 C392,960 450,936 515,936 C585,936 640,962 640,1040 L640,1120 C640,1180 600,1205 515,1205 C430,1205 395,1180 395,1120 Z"
        fill="url(#shirt)" stroke="{INK}" stroke-width="{W}" stroke-linejoin="round"/>
  <!-- collar + placket -->
  <path d="M470,958 L500,990 L512,962 Z" fill="#d23b2c" stroke="{INK}" stroke-width="3"/>
  <path d="M554,958 L524,990 L512,962 Z" fill="#d23b2c" stroke="{INK}" stroke-width="3"/>
  <line x1="512" y1="990" x2="512" y2="1050" stroke="{INK}" stroke-width="3"/>
  <circle cx="512" cy="1018" r="6" fill="#f4f1ea" stroke="{INK}" stroke-width="2.5"/>

  <!-- front leg crossed over: thigh forward to a raised knee, shin down to the stump -->
  <path d="M548,1190 C590,1185 625,1170 640,1160 C648,1230 568,1300 548,1382" fill="none" stroke="{INK}" stroke-width="{W+2}" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="540" cy="1386" rx="24" ry="12" fill="{INK}"/>

  <!-- head -->
  <ellipse cx="548" cy="852" rx="140" ry="116" fill="url(#skin)" stroke="{INK}" stroke-width="{W}"/>
  <!-- hair: cap + wavy fringe on the left/back side (head turned slightly right) -->
  <path d="M410,850 C402,780 450,742 548,738 C640,736 690,770 690,830 C668,806 650,812 630,800 C612,816 596,804 580,800 C562,814 548,806 530,800 C512,816 494,808 476,804 C460,822 446,818 432,826 C428,848 420,866 418,890 C412,880 409,866 410,850 Z"
        fill="#2b2026" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>
  <!-- hat: ribbed dome + ribbed folded brim -->
  <path d="M418,832 C418,700 682,690 684,832 Z" fill="url(#hat)" stroke="{INK}" stroke-width="{W}"/>
  <g clip-path="url(#domeclip)" stroke="#a87418" stroke-width="5" opacity="0.8">
    {''.join(f'<line x1="{551 + (i - 9) * 17}" y1="845" x2="{551 + (i - 9) * 5}" y2="700"/>' for i in range(19))}
  </g>
  <rect x="414" y="800" width="276" height="48" rx="22" fill="#d9a23a" stroke="{INK}" stroke-width="{W}"/>
  <g clip-path="url(#brimclip)" stroke="#9c6c16" stroke-width="5" opacity="0.85">
    {''.join(f'<line x1="{420 + i * 14}" y1="798" x2="{420 + i * 14}" y2="850"/>' for i in range(20))}
  </g>

  <!-- half-lidded side-glance eyes (looking right) + low brows -->
  <g stroke="{INK}" stroke-linecap="round">
    <path d="M466,868 C466,890 528,890 528,868 Z" fill="#fff" stroke-width="5"/>
    <path d="M556,866 C556,888 618,888 618,866 Z" fill="#fff" stroke-width="5"/>
    <circle cx="514" cy="874" r="9" fill="{INK}" stroke="none"/>
    <circle cx="605" cy="872" r="9" fill="{INK}" stroke="none"/>
    <line x1="460" y1="867" x2="534" y2="867" stroke-width="7"/>
    <line x1="550" y1="865" x2="624" y2="865" stroke-width="7"/>
    <path d="M466,846 L528,852" stroke-width="7" fill="none"/>
    <path d="M556,850 L620,842" stroke-width="7" fill="none"/>
  </g>
  <!-- chewing mouth -->
  <ellipse cx="558" cy="914" rx="11" ry="9" fill="#3a1418" stroke="{INK}" stroke-width="3"/>
  <!-- cheek bulge -->
  <path d="M640,900 C662,904 668,930 652,944" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>

  <!-- arm bringing the bread to the mouth (screen-right) -->
  <path d="M636,1010 C690,990 690,950 640,940" fill="none" stroke="{INK}" stroke-width="{W+1}" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- bread slice with a bite, held at the mouth -->
  <g transform="rotate(-12 610 930)">
    <path d="M570,900 C566,884 586,876 600,884 C612,872 640,876 640,896 L642,960 C642,968 636,972 628,972 L578,972 C570,972 566,966 566,958 Z"
          fill="#c48a48" stroke="{INK}" stroke-width="4"/>
    <path d="M576,906 C574,894 588,888 600,894 C612,884 632,888 632,904 L634,956 C634,962 630,964 624,964 L582,964 C576,964 574,960 574,954 Z" fill="url(#bread)"/>
    <circle cx="574" cy="910" r="14" fill="url(#skin)"/>
    {''.join(f'<circle cx="{588 + (i * 13) % 40}" cy="{915 + (i * 17) % 44}" r="1.6" fill="#cdb88d"/>' for i in range(14))}
  </g>
  <circle cx="634" cy="950" r="12" fill="{INK}"/>
</g>
</svg>'''
svg = svg.replace("#47ab a2", "#47aba2")
open(OUT, "w").write(svg)
print("wrote", OUT, "scale", round(S, 3))
