"""Test short #1 (10 s, 1080x1920 @30fps).
Shot 1  f1-100   corridor: worried worker walks to the 'SPECIAL PROJECTS ROOM' door, smiling boss waits.
Shot 2  f101-205 the room: green tiles, empty desk with a taped outline where the computer was, clock.
Shot 3  f206-300 worker sits alone at the desk, clock ticking, slow push-in to his face.
Run:  xvfb-run -a blender -b -P scene.py -- <out_dir> [frame_start frame_end]
"""
import sys, os, math, bpy
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import kit
from kit import box, toon, flat, key, ease_all, linear_all

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/render"
s = kit.reset(frames=300)

# ------------------------------------------------------------------ light
bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
sun = bpy.context.object
sun.data.energy = 3.2
sun.data.angle = math.radians(3)
sun.rotation_euler = (math.radians(50), math.radians(-12), math.radians(-35))

WHITE = toon("white", (0.97, 0.97, 0.97))
NAVY = (0.1, 0.15, 0.32)

# ================================================================== SHOT 1 corridor
floor1 = box("c_floor", (14, 10, 0.1), (0, -2, -0.05), toon("bluefloor", (0.07, 0.24, 0.85), shade=0.7), 0)
wall1 = box("c_wall", (14, 0.2, 3.2), (0, 1.1, 1.6), toon("corridorwall", (0.9, 0.92, 0.96), shade=0.78), 0)
box("c_stripe", (14, 0.05, 0.08), (0, 0.99, 1.05), toon("mint", (0.45, 0.85, 0.75)), 0)
box("c_skirt", (14, 0.05, 0.12), (0, 0.99, 0.06), toon("skirt", (0.75, 0.78, 0.85)), 0)
box("c_ceiling", (14, 10, 0.1), (0, -2, 3.2), toon("ceiling", (0.95, 0.95, 0.97), shade=0.85), 0)
for i in range(-3, 4):
    box(f"c_panel{i}", (0.9, 0.9, 0.02), (i * 1.6, -1.2, 3.14), flat("panel", (1, 1, 1), 1.5), 0.0)
kit.door("c_door", (0.55, 1.0, 0), sign=[("SPECIAL", 0.085, NAVY), ("PROJECTS", 0.085, NAVY), ("ROOM", 0.14, (0.85, 0.1, 0.12))])
# cork board + notes on the left
box("c_cork", (1.0, 0.05, 0.7), (-1.6, 0.98, 1.75), toon("cork", (0.8, 0.6, 0.35)), 0.01)
for i, (x, z, c) in enumerate([(-1.85, 1.9, (1, 0.95, 0.5)), (-1.55, 1.72, (0.6, 0.85, 1)), (-1.3, 1.9, (1, 0.7, 0.75)), (-1.75, 1.6, (1, 1, 1))]):
    box(f"c_note{i}", (0.2, 0.02, 0.22), (x, 0.95, z), toon(f"note{i}", c), 0.004)
box("c_alarm", (0.14, 0.06, 0.18), (1.55, 0.97, 1.45), toon("alarm", (0.85, 0.1, 0.1)), 0.006)
# plant
kit.cyl("c_pot", 0.16, 0.3, (-0.9, 0.75, 0.15), toon("pot", (0.85, 0.45, 0.25)), 0.01)
kit.ball("c_leaves", (0.28, 0.28, 0.35), (-0.9, 0.75, 0.55), toon("leaf", (0.25, 0.65, 0.3)), 0.012)

boss = kit.person("boss", (1.25, 0.45, 0), rot_z=math.radians(-25), skin=(0.99, 0.93, 0.86), shirt=NAVY,
                  hair=(0.62, 0.62, 0.66), hair_style="grey", tie=(0.85, 0.1, 0.12), badge=False, face="happy")
work = kit.person("worker", (-2.3, 0.15, 0), rot_z=math.radians(70), shirt=(0.45, 0.7, 0.98), face="worried")

# boss: gentle sway + happy head bob
key(boss["torso"], "rotation_euler", 1, 0.0, 1)
key(boss["torso"], "rotation_euler", 50, math.radians(-4), 1)
key(boss["torso"], "rotation_euler", 100, math.radians(2), 1)
ease_all(boss["torso"])
kit.bob(boss["head"], 1, 100, amp=0.03, period=20)
# boss arm gestures toward the door
key(boss["arms"][0], "rotation_euler", 30, 0.0, 1)
key(boss["arms"][0], "rotation_euler", 48, math.radians(70), 1)
key(boss["arms"][0], "rotation_euler", 100, math.radians(70), 1)
ease_all(boss["arms"][0])

# worker walks in, stops near door, turns to look at it
key(work["root"], "location", 1, -2.3, 0)
key(work["root"], "location", 66, -0.25, 0)
ease_all(work["root"])
kit.bob(work["torso"], 1, 66, amp=0.035, period=10)
key(work["root"], "rotation_euler", 60, math.radians(70), 2)
key(work["root"], "rotation_euler", 76, math.radians(20), 2)
ease_all(work["root"])
for i, sh in enumerate(work["arms"]):
    for f in range(1, 66, 10):
        key(sh, "rotation_euler", f, math.radians(18 if (f // 10 + i) % 2 else -18), 0)
    key(sh, "rotation_euler", 70, 0.0, 0)
    ease_all(sh)
kit.blink(work["eyes"], [40, 88])
# head turns up to read the sign
key(work["head"], "rotation_euler", 70, 0.0, 0)
key(work["head"], "rotation_euler", 82, math.radians(12), 0)
ease_all(work["head"])

cam1 = kit.camera("cam1", (0.0, -4.3, 2.0), (0.3, 0.8, 1.1), lens=29)
key(cam1, "location", 1, cam1.location.copy())
cam1.location = (0.45, -3.3, 1.9)
key(cam1, "location", 100, cam1.location.copy())
key(cam1, "rotation_euler", 1, cam1.rotation_euler.copy())
kit.aim(cam1, (0.5, 0.8, 1.15)); cam1.rotation_euler[1] += math.radians(-3)
key(cam1, "rotation_euler", 100, cam1.rotation_euler.copy())
ease_all(cam1)
kit.handheld(cam1, 0.004, 35)

# ================================================================== SHOT 2/3 the room (x offset 20)
X = 20.0
room_floor = toon("roomfloor", None, shade=0.72, tex=kit.checker_tex((0.55, 0.66, 0.84), (0.49, 0.6, 0.79), 2.0))
green = toon("greentile", None, shade=0.72, tex=kit.tiles_tex((0.52, 0.8, 0.56), (0.4, 0.66, 0.46), scale=2.2, plane="xz"))
green_side = toon("greentile_s", None, shade=0.72, tex=kit.tiles_tex((0.52, 0.8, 0.56), (0.4, 0.66, 0.46), scale=2.2, plane="yz"))
box("r_floor", (6, 7, 0.1), (X, -1.5, -0.05), room_floor, 0)
box("r_back", (6, 0.2, 3.2), (X, 2.3, 1.6), green, 0)
box("r_left", (0.2, 7, 3.2), (X - 2.7, -1.0, 1.6), green_side, 0)
box("r_right", (0.2, 7, 3.2), (X + 2.7, -1.0, 1.6), green_side, 0)
box("r_ceil", (6, 7, 0.1), (X, -1.5, 3.2), toon("ceiling", (0.95, 0.95, 0.97)), 0)
box("r_lamp", (1.2, 0.5, 0.03), (X, 0.2, 3.13), flat("panel", (1, 1, 1), 1.5), 0)

kit.desk("r_desk", (X, 0.55, 0))
# taped outline where the computer + keyboard used to be
tape = toon("tapey", (1.0, 0.82, 0.15), shade=0.85)
def tape_rect(n, cx, cy, w, d, t=0.035):
    for i, (dx, dy, sw, sd) in enumerate([(0, d / 2, w, t), (0, -d / 2, w, t), (w / 2, 0, t, d), (-w / 2, 0, t, d)]):
        box(f"{n}{i}", (sw, sd, 0.006), (cx + dx, cy + dy, 0.778), tape, 0)
tape_rect("tape_mon", X - 0.15, 0.68, 0.62, 0.26)
tape_rect("tape_kb", X - 0.15, 0.35, 0.5, 0.14)
tape_rect("tape_mouse", X + 0.22, 0.36, 0.08, 0.12, 0.025)
kit.stroke("r_cable", [(X - 0.1, 0.92, 0.78), (X - 0.12, 0.75, 0.785), (X - 0.05, 0.62, 0.786)], flat("cable", (0.1, 0.1, 0.12)), 0.012)
box("r_note", (0.13, 0.13, 0.004), (X + 0.45, 0.45, 0.779), toon("note0", (1, 0.95, 0.5)), 0.003)
kit.text("r_note_t", "WELCOME!", (X + 0.45, 0.45, 0.783), 0.022, kit.ink(), rot=(0, 0, 0))
# empty in-tray
tray = toon("tray", (0.15, 0.4, 0.9))
box("r_tray_b", (0.36, 0.28, 0.02), (X + 0.5, 0.75, 0.785), tray, 0.006)
for i, (dx, dy, sw, sd) in enumerate([(0, 0.14, 0.36, 0.02), (0, -0.14, 0.36, 0.02), (0.18, 0, 0.02, 0.28), (-0.18, 0, 0.02, 0.28)]):
    box(f"r_tray{i}", (sw, sd, 0.09), (X + 0.5 + dx, 0.75 + dy, 0.83), tray, 0.006)
kit.text("r_tray_t", "TO DO", (X + 0.5, 0.61, 0.83), 0.05, flat("white_e", (1, 1, 1)))

chair = kit.chair("r_chair", (X, 1.3, 0), rot_z=0)
_, cmin, chour, csec = kit.clock("r_clock", (X + 0.9, 2.18, 2.3), start_hour=2.0)
# boxes in the corner, shelf on the left
card = toon("cardboard", (0.78, 0.6, 0.4))
box("r_box1", (0.6, 0.5, 0.45), (X + 2.1, 1.7, 0.225), card, 0.01)
box("r_box2", (0.5, 0.45, 0.4), (X + 2.05, 1.72, 0.65), card, 0.01, rot=(0, 0, 0.15))
box("r_shelf", (0.4, 1.2, 1.8), (X - 2.4, 1.2, 0.9), toon("shelf", (0.3, 0.33, 0.4)), 0.012)
for i in range(6):
    c = [(0.9, 0.3, 0.3), (0.3, 0.5, 0.9), (0.95, 0.75, 0.2), (0.4, 0.75, 0.45), (0.6, 0.35, 0.8), (0.3, 0.75, 0.8)][i]
    box(f"r_book{i}", (0.28, 0.07, 0.3), (X - 2.35, 0.75 + i * 0.09, 1.35), toon(f"book{i}", c), 0.004)
box("r_cal", (0.32, 0.03, 0.4), (X - 1.0, 2.19, 1.9), WHITE, 0.006)
box("r_calh", (0.32, 0.031, 0.1), (X - 1.0, 2.185, 2.05), toon("calred", (0.88, 0.15, 0.15)), 0)
kit.text("r_calt", "7", (X - 1.0, 2.16, 1.82), 0.2, kit.ink())

# warm 'window' light patch on the back wall (painted look)
kit.light_patch("r_sunpatch", [(X - 2.6, 2.19, 1.2), (X + 0.4, 2.19, 2.0), (X + 0.4, 2.19, 2.9), (X - 2.6, 2.19, 1.9)])

# clock: second hand ticks every second, minute hand creeps (time passing fast in shot 3)
for f in range(101, 301, 30):
    sec = (f - 101) // 30
    key(csec, "rotation_euler", f, -sec * math.radians(6), 2)
    key(csec, "rotation_euler", f + 3, -(sec + 1) * math.radians(6), 2)
ease_all(csec)
key(cmin, "rotation_euler", 206, 0.0, 2)
key(cmin, "rotation_euler", 300, -math.radians(170), 2)
key(chour, "rotation_euler", 206, chour.rotation_euler[2], 2)
key(chour, "rotation_euler", 300, chour.rotation_euler[2] - math.radians(14), 2)
linear_all(cmin); linear_all(chour)

# seated worker (only visible from shot 3)
sit = kit.person("sitter", (X, 1.3, 0.0), rot_z=0, shirt=(0.45, 0.7, 0.98), face="worried", seated=True)
for sh in sit["arms"]:
    sh.rotation_euler[0] = math.radians(-55)
# keep him out of the room until shot 3 (empty-room shot)
key(sit["root"], "location", 205, -20.0, 2)
key(sit["root"], "location", 206, 0.0, 2)
for fc in sit["root"].animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "CONSTANT"
# slow sigh: head droops, then a small lift on 'until you quit'
key(sit["head"], "rotation_euler", 206, 0.0, 0)
key(sit["head"], "rotation_euler", 250, math.radians(-8), 0)
key(sit["head"], "rotation_euler", 275, math.radians(4), 0)
key(sit["head"], "rotation_euler", 300, math.radians(-3), 0)
ease_all(sit["head"])
key(sit["torso"], "location", 206, 0.0, 2)
key(sit["torso"], "location", 250, -0.03, 2)
key(sit["torso"], "location", 300, -0.01, 2)
ease_all(sit["torso"])
kit.blink(sit["eyes"], [222, 262, 290])

# camera 2: high angle, slow drift + push toward the empty desk
cam2 = kit.camera("cam2", (X - 1.6, -2.6, 2.75), (X - 0.05, 0.7, 0.9), lens=24)
key(cam2, "location", 101, cam2.location.copy())
key(cam2, "rotation_euler", 101, cam2.rotation_euler.copy())
cam2.location = (X - 0.6, -1.5, 2.35)
kit.aim(cam2, (X + 0.05, 0.75, 0.85))
key(cam2, "location", 205, cam2.location.copy())
key(cam2, "rotation_euler", 205, cam2.rotation_euler.copy())
ease_all(cam2)
kit.handheld(cam2, 0.003, 40)
# punch-in on the cut
key(cam2.data, "lens", 101, 20)
key(cam2.data, "lens", 108, 24)
ease_all(cam2.data)

# camera 3: eye level across the desk, slow push-in
cam3 = kit.camera("cam3", (X + 0.1, -2.2, 1.45), (X, 1.3, 1.45), lens=30, dof_target=sit["head"], fstop=2.0)
key(cam3, "location", 206, cam3.location.copy())
key(cam3, "rotation_euler", 206, cam3.rotation_euler.copy())
cam3.location = (X + 0.03, -0.75, 1.52)
kit.aim(cam3, (X, 1.3, 1.5))
key(cam3, "location", 300, cam3.location.copy())
key(cam3, "rotation_euler", 300, cam3.rotation_euler.copy())
ease_all(cam3)
kit.handheld(cam3, 0.003, 40)
key(cam3.data, "lens", 206, 26)
key(cam3.data, "lens", 212, 30)
ease_all(cam3.data)

# cameras per shot
for f, c in ((1, cam1), (101, cam2), (206, cam3)):
    s.timeline_markers.new(c.name, frame=f).camera = c
s.camera = cam1

# ------------------------------------------------------------------ render
os.makedirs(OUT, exist_ok=True)
s.render.image_settings.file_format = "PNG"
s.render.filepath = os.path.join(OUT, "f_")
if len(argv) >= 3:
    s.frame_start, s.frame_end = int(argv[1]), int(argv[2])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "scene.blend"))
if os.environ.get("NO_RENDER") != "1":
    bpy.ops.render.render(animation=True)
