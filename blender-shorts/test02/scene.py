"""Test short #2 — 'The line-standing job' (10 s, 1080x1920 @30fps). Original story, toon-3D style.
Shot A  f1-100    night street: long queue outside a closed shop, low wide angle, slow dolly.
Shot B  f101-165  close on the hero at the front of the line: tired, yawns.
Shot C  f166-205  insert: phone lock screen 5:59 AM.
Shot D  f206-300  dawn: shutter rolls up, client in sunglasses arrives, ticket for cash, hero grins.
Run:  xvfb-run -a blender -b -P scene.py -- <out_dir> [frame_start frame_end]
"""
import sys, os, math, random, bpy
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import kit
from kit import box, ball, toon, flat, key, ease_all, linear_all, stroke, text

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/render"
s = kit.reset(frames=300)
s.eevee.bloom_intensity = 0.07
s.eevee.bloom_threshold = 0.9
s.eevee.bloom_radius = 5.0
s.eevee.taa_render_samples = 10
s.eevee.shadow_cube_size = "512"
s.eevee.shadow_cascade_size = "1024"
random.seed(7)
DAWN = 206

# ------------------------------------------------------------------ sky (world): night -> dawn
w = s.world; nt = w.node_tree
bg = nt.nodes["Background"]
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(tc.outputs["Generated"], sep.inputs[0])
def sky_ramp(stops):
    r = nt.nodes.new("ShaderNodeValToRGB")
    el = r.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], (*kit.lin(stops[0][1]), 1)
    el[1].position, el[1].color = stops[-1][0], (*kit.lin(stops[-1][1]), 1)
    for p, c in stops[1:-1]:
        e = el.new(p); e.color = (*kit.lin(c), 1)
    nt.links.new(sep.outputs[2], r.inputs[0])
    return r
night = sky_ramp([(0.0, (0.55, 0.3, 0.55)), (0.12, (0.25, 0.2, 0.5)), (0.35, (0.07, 0.08, 0.25)), (1.0, (0.02, 0.03, 0.1))])
dawn = sky_ramp([(0.0, (1.0, 0.62, 0.35)), (0.15, (1.0, 0.75, 0.55)), (0.4, (0.55, 0.7, 0.95)), (1.0, (0.35, 0.55, 0.9))])
mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
nt.links.new(night.outputs[0], mix.inputs[6]); nt.links.new(dawn.outputs[0], mix.inputs[7])
nt.links.new(mix.outputs[2], bg.inputs[0])
kit.anim_value(mix.inputs[0], [(DAWN - 1, 0.0), (DAWN, 1.0)])
kit.anim_value(bg.inputs[1], [(DAWN - 1, 0.5), (DAWN, 1.0)])
for fc in w.node_tree.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "CONSTANT"

# global colour grade for every toon material
kit.set_tint(1, (0.5, 0.56, 0.92))
kit.set_tint(DAWN - 1, (0.5, 0.56, 0.92))
kit.set_tint(DAWN, (1.0, 0.9, 0.82))
for fc in kit.tint_group().animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "CONSTANT"

bpy.ops.object.light_add(type="SUN", location=(0, 0, 20))
sun = bpy.context.object
sun.data.angle = math.radians(4)
sun.rotation_euler = (math.radians(60), 0, math.radians(-40))
sun.data.energy = 0.8; sun.data.keyframe_insert("energy", frame=DAWN - 1)
sun.data.energy = 3.2; sun.data.keyframe_insert("energy", frame=DAWN)
sun.data.color = (0.7, 0.75, 1.0); sun.data.keyframe_insert("color", frame=DAWN - 1)
sun.data.color = (1.0, 0.8, 0.6); sun.data.keyframe_insert("color", frame=DAWN)

# ------------------------------------------------------------------ street
# x = along the street, shop door at x=0. Building fronts at y=1.5, sidewalk y in [-1.6, 1.5], road y < -1.6
box("road", (60, 30, 0.1), (0, -16.6, -0.07), toon("asphalt", (0.3, 0.32, 0.4), shade=0.7), 0)
box("sidewalk", (60, 3.1, 0.14), (0, -0.05, 0.0), toon("pave", None, shade=0.72, tex=kit.checker_tex((0.72, 0.72, 0.78), (0.66, 0.66, 0.73), 1.6)), 0)
box("curb", (60, 0.18, 0.18), (0, -1.6, 0.02), toon("curb", (0.82, 0.82, 0.86)), 0.01)
for i in range(-12, 13):
    box(f"dash{i}", (1.4, 0.14, 0.02), (i * 2.6, -4.6, -0.015), toon("roadline", (0.95, 0.95, 0.9)), 0)
box("zebra_base", (0.01, 0.01, 0.01), (0, 0, -5), toon("roadline", (0.95, 0.95, 0.9)), 0)
for i in range(6):
    box(f"zebra{i}", (0.45, 3.2, 0.02), (6.5 + i * 0.85, -3.4, -0.015), toon("roadline", (0.95, 0.95, 0.9)), 0)

WIN = kit.windows_mat("windows", scale=1.0, bias=-0.15)
WIN_FAR = kit.windows_mat("windows_far", lit=(1.0, 0.8, 0.5), dark=(0.08, 0.1, 0.22), scale=2.2, bias=-0.35)
for m in (WIN, WIN_FAR):
    em = m.node_tree.nodes["EM"].inputs[1]
    kit.anim_value(em, [(DAWN - 1, 1.6), (DAWN, 0.35)])

def building(name, x, width, height, color, depth=6.0, y=1.5, win=WIN, ground_floor=True):
    box(name, (width, depth, height), (x, y + depth / 2, height / 2), toon(name + "_c", color, shade=0.66), 0.02)
    z0 = 3.6 if ground_floor else 0.5
    if height - z0 > 1.2:
        kit.plane_xz(name + "_win", width - 0.6, height - z0 - 0.6, (x, y - 0.012, z0 + (height - z0 - 0.6) / 2 + 0.1), win)
    box(name + "_roof", (width + 0.15, depth + 0.15, 0.18), (x, y + depth / 2, height + 0.09), toon("roofedge", (0.25, 0.27, 0.38)), 0.012)

# the shop (center), neighbours, and a far skyline
# shop building with an open ground floor so the interior shows when the shutter rolls up
SB = toon("shop_bld_c", (0.88, 0.84, 0.78), shade=0.66)
box("shop_upper", (4.4, 6.0, 5.8), (0, 1.5 + 3.0, 2.7 + 2.9), SB, 0.02)
kit.plane_xz("shop_upper_win", 3.8, 4.3, (0, 1.5 - 0.012, 3.6 + 2.15 + 0.1), WIN)
box("shop_roof", (4.55, 6.15, 0.18), (0, 4.5, 8.59), toon("roofedge", (0.25, 0.27, 0.38)), 0.012)
for sx in (-1, 1):
    box(f"shop_side{sx}", (0.3, 3.0, 2.7), (sx * 2.05, 3.0, 1.35), SB, 0.015)
box("shop_floor_in", (3.8, 2.6, 0.05), (0, 2.8, 0.08), toon("shopfloor", (0.85, 0.75, 0.6)), 0)
building("bld_l1", -4.7, 5.0, 11.0, (0.62, 0.7, 0.82))
building("bld_l2", -9.8, 5.2, 7.5, (0.86, 0.66, 0.55))
building("bld_l3", -15.0, 5.2, 13.0, (0.7, 0.75, 0.72))
building("bld_l4", -20.3, 5.4, 9.0, (0.9, 0.8, 0.6))
building("bld_r1", 4.9, 5.4, 10.0, (0.72, 0.68, 0.84))
building("bld_r2", 10.4, 5.6, 14.0, (0.62, 0.66, 0.74))
for i in range(16):
    h = random.uniform(14, 34); x = -34 + i * 4.6 + random.uniform(-0.6, 0.6)
    building(f"far{i}", x, random.uniform(3.4, 4.4), h, (0.3, 0.33, 0.5), depth=3, y=26 + random.uniform(0, 6), win=WIN_FAR, ground_floor=False)
# across-the-street buildings (behind the camera side, visible in reverse angles)
for i in range(6):
    building(f"opp{i}", -14 + i * 5.4, 5.2, random.uniform(7, 12), random.choice([(0.8, 0.7, 0.62), (0.66, 0.72, 0.84), (0.78, 0.78, 0.7)]), depth=5, y=-9.5 - 5)
# stars + moon
for i in range(70):
    ball(f"star{i}", (0.06, 0.06, 0.06), (random.uniform(-40, 40), random.uniform(55, 70), random.uniform(18, 45)), flat("star", (1, 1, 0.9), 3), 0, seg=6)
moon = ball("moon", (1.6, 0.4, 1.6), (-12, 60, 32), flat("moon", (1, 0.96, 0.8), 2.5), 0)
for o in [bpy.data.objects[f"star{i}"] for i in range(70)] + [moon]:
    kit.show(o, DAWN - 1, True); kit.show(o, DAWN, False)

# --- shop front
SHOP_Y = 1.5
box("awning", (4.2, 1.0, 0.1), (0, SHOP_Y - 0.5, 3.05), toon("awning", (0.85, 0.15, 0.2)), 0.015, rot=(math.radians(-12), 0, 0))
for i in range(7):
    box(f"awn_stripe{i}", (0.3, 1.02, 0.11), (-1.8 + i * 0.6, SHOP_Y - 0.5, 3.05), toon("awnw", (0.97, 0.95, 0.92)), 0, rot=(math.radians(-12), 0, 0))
box("signboard", (3.6, 0.2, 0.9), (0, SHOP_Y - 0.12, 3.75), toon("signbg", (0.12, 0.13, 0.2)), 0.02)
sgn = text("sign_t", "SNEAKER LAB", (0, SHOP_Y - 0.24, 3.8), 0.48, flat("neon", (1.0, 0.85, 0.35), 3.0))
text("sign_t2", "LIMITED DROP  6:00", (0, SHOP_Y - 0.24, 3.43), 0.17, flat("neon2", (0.4, 0.95, 1.0), 2.5))
# interior (seen once the shutter rolls up)
box("interior", (3.2, 0.1, 2.6), (0, SHOP_Y + 1.6, 1.3), flat("interior", (1.0, 0.86, 0.62), 1.2), 0)
for r in range(3):
    box(f"shelf{r}", (3.0, 0.4, 0.05), (0, SHOP_Y + 1.35, 0.6 + r * 0.7), toon("shelf2", (0.55, 0.38, 0.25)), 0.01)
    for c in range(7):
        box(f"shoebox{r}{c}", (0.32, 0.3, 0.2), (-1.3 + c * 0.43, SHOP_Y + 1.35, 0.73 + r * 0.7), toon(f"sb{(r + c) % 4}", [(0.95, 0.5, 0.2), (0.3, 0.6, 0.95), (0.95, 0.95, 0.95), (0.2, 0.75, 0.5)][(r + c) % 4]), 0.008)
for sx in (-1, 1):
    box(f"pillar{sx}", (0.5, 0.3, 2.7), (sx * 1.85, SHOP_Y - 0.1, 1.35), toon("pillar", (0.78, 0.74, 0.7)), 0.015)
# rolling shutter (origin at the top so scaling z rolls it up)
bpy.ops.mesh.primitive_cube_add(size=1)
sh = bpy.context.object; sh.name = "shutter"
for v in sh.data.vertices:
    v.co.z -= 0.5
sh.scale = (3.2, 0.08, 2.6); sh.location = (0, SHOP_Y - 0.05, 2.62)
bpy.ops.object.transform_apply(scale=True, location=False)
sh.scale = (1, 1, 1)
def shutter_tex(nt):
    co = kit._plane_coords(nt, "xz")
    wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "Y"
    wv.inputs["Scale"].default_value = 6.0
    nt.links.new(co.outputs[0], wv.inputs[0])
    r = nt.nodes.new("ShaderNodeValToRGB"); r.color_ramp.interpolation = "CONSTANT"
    r.color_ramp.elements[0].color = (*kit.lin((0.62, 0.66, 0.74)), 1)
    r.color_ramp.elements[1].position = 0.55; r.color_ramp.elements[1].color = (*kit.lin((0.74, 0.78, 0.86)), 1)
    nt.links.new(wv.outputs[0], r.inputs[0])
    return r.outputs[0]
kit._finish(sh, toon("shutter", None, shade=0.7, tex=shutter_tex), 0.015, smooth=False)
box("shutter_bar", (3.25, 0.12, 0.1), (0, SHOP_Y - 0.12, 0.08), toon("bar", (0.4, 0.42, 0.5)), 0.008)
bar = bpy.data.objects["shutter_bar"]
key(sh, "scale", DAWN + 8, 1.0, 2); key(sh, "scale", DAWN + 50, 0.06, 2); ease_all(sh)
key(bar, "location", DAWN + 8, 0.08, 2); key(bar, "location", DAWN + 50, 2.5, 2); ease_all(bar)
# "CLOSED" paper on the shutter
box("closed_note", (0.7, 0.02, 0.4), (0, SHOP_Y - 0.1, 1.5), toon("paper", (0.98, 0.98, 0.95)), 0.006)
text("closed_t", "OPENS 6:00", (0, SHOP_Y - 0.115, 1.5), 0.12, flat("redink", (0.85, 0.1, 0.1)))
for o in ("closed_note", "closed_t"):
    ob = bpy.data.objects[o]; ob.parent = sh; ob.matrix_parent_inverse = sh.matrix_world.inverted()

# --- vending machines (glowing), utility poles, wires, street lamps, plants, bicycle
def vending(name, x, body, rot=0):
    r = kit.empty(name, (x, 1.12, 0.07)); r.rotation_euler[2] = rot
    box(name + "_b", (0.95, 0.75, 1.85), (0, 0, 0.92), toon(name + "_c", body), 0.016, r)
    box(name + "_win", (0.8, 0.02, 0.9), (0, -0.38, 1.3), flat(name + "_glow", (0.92, 0.97, 1.0), 1.6), 0, r)
    cols = [(0.9, 0.2, 0.2), (0.2, 0.5, 0.95), (0.95, 0.8, 0.2), (0.25, 0.75, 0.4), (0.95, 0.5, 0.2), (0.6, 0.3, 0.8)]
    for row in range(3):
        for c in range(6):
            box(f"{name}_can{row}{c}", (0.08, 0.04, 0.17), (-0.31 + c * 0.124, -0.4, 1.0 + row * 0.29), flat(f"can{(row * 2 + c) % 6}", cols[(row * 2 + c) % 6], 1.1), 0, r)
            box(f"{name}_btn{row}{c}", (0.05, 0.03, 0.025), (-0.31 + c * 0.124, -0.4, 0.9 + row * 0.29), flat("btn", (0.3, 1.0, 0.4), 2), 0, r)
    box(name + "_slot", (0.6, 0.05, 0.2), (0, -0.38, 0.35), toon("slot", (0.15, 0.15, 0.2)), 0.008, r)
    bpy.ops.object.light_add(type="AREA", location=(x, 0.5, 1.4))
    L = bpy.context.object; L.data.energy = 60; L.data.size = 0.8; L.data.color = (0.8, 0.9, 1.0)
    L.rotation_euler = (math.radians(90), 0, 0)
    L.data.keyframe_insert("energy", frame=DAWN - 1); L.data.energy = 10; L.data.keyframe_insert("energy", frame=DAWN)
vending("vend1", -6.2, (0.85, 0.12, 0.15))
vending("vend2", -7.25, (0.95, 0.95, 0.97))

wire_m = flat("wire", (0.05, 0.05, 0.08))
poles = [(-11.5, -1.35), (-3.0, -1.35), (5.5, -1.35), (14, -1.35)]
for i, (x, y) in enumerate(poles):
    kit.cyl(f"pole{i}", 0.13, 9.0, (x, y, 4.5), toon("pole", (0.7, 0.7, 0.72)), 0.016)
    box(f"pole_arm{i}", (1.6, 0.12, 0.12), (x, y, 8.2), toon("pole", (0.7, 0.7, 0.72)), 0.01)
    box(f"transformer{i}", (0.45, 0.45, 0.7), (x, y + 0.35, 6.8), toon("transf", (0.55, 0.58, 0.62)), 0.012) if i % 2 else None
    # street lamp
    stroke(f"lamp_arm{i}", [(x, y, 5.2), (x, y - 0.4, 5.5), (x, y - 0.9, 5.45)], toon("pole", (0.7, 0.7, 0.72)), 0.05)
    ball(f"lamp_head{i}", (0.28, 0.2, 0.1), (x, y - 0.95, 5.4), toon("lamph", (0.3, 0.32, 0.38)), 0.01)
    bulb = ball(f"lamp_bulb{i}", (0.2, 0.14, 0.05), (x, y - 0.95, 5.32), flat("bulb", (1.0, 0.85, 0.55), 6), 0, seg=16)
    bpy.ops.object.light_add(type="SPOT", location=(x, y - 0.95, 5.2))
    L = bpy.context.object; L.data.energy = 4000; L.data.color = (1.0, 0.78, 0.45)
    L.data.spot_size = math.radians(95); L.data.spot_blend = 0.5; L.data.shadow_soft_size = 0.3
    L.data.keyframe_insert("energy", frame=DAWN - 1); L.data.energy = 0; L.data.keyframe_insert("energy", frame=DAWN)
for zz in (8.2, 7.7, 7.2):
    for a, b in zip(poles[:-1], poles[1:]):
        pts = []
        for t in range(13):
            u = t / 12
            pts.append((a[0] + (b[0] - a[0]) * u, -1.35 + (0.6 if zz == 8.2 else 0) * (1 - abs(2 * u - 1)) * 0, zz - 0.55 * math.sin(math.pi * u)))
        stroke(f"wire{zz}_{a[0]}", pts, wire_m, 0.012)
for i, (x, y) in enumerate(poles[1:3]):
    stroke(f"drop{i}", [(x, -1.35, 7.4), (x + 0.4, 0.0, 6.6), (x + 0.6, 1.49, 6.2)], wire_m, 0.01)

for i, x in enumerate((-2.6, 2.6)):
    kit.cyl(f"planter{i}", 0.28, 0.55, (x, 1.15, 0.35), toon("planter", (0.45, 0.47, 0.55)), 0.012)
    for j in range(5):
        ball(f"bush{i}{j}", (0.22, 0.22, 0.25), (x + random.uniform(-0.15, 0.15), 1.15 + random.uniform(-0.1, 0.1), 0.75 + random.uniform(0, 0.25)), toon("bush", (0.25, 0.62, 0.32)), 0.012)
# parked bicycle
bk = kit.empty("bike", (3.4, 0.9, 0.07))
for sx in (-1, 1):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.32, minor_radius=0.025, location=(sx * 0.5, 0, 0.34), rotation=(math.radians(90), 0, 0))
    t = bpy.context.object; t.name = f"bike_w{sx}"; t.data.materials.append(kit.ink()); t.parent = bk
stroke("bike_frame", [(-0.5, 0, 0.34), (-0.1, 0, 0.75), (0.35, 0, 0.75), (0.5, 0, 0.34), (0.0, 0, 0.34), (-0.1, 0, 0.75)], toon("bikef", (0.2, 0.6, 0.85)), 0.025, bk)
box("bike_seat", (0.22, 0.08, 0.05), (-0.12, 0, 0.82), kit.ink(), 0, bk)
stroke("bike_bar", [(0.35, 0, 0.75), (0.4, 0, 0.92), (0.4, -0.2, 0.95), (0.4, 0.2, 0.95)], kit.ink(), 0.018, bk)
box("bike_basket", (0.3, 0.3, 0.2), (0.62, 0, 0.88), toon("basket", (0.75, 0.75, 0.78)), 0.008, bk)

# ------------------------------------------------------------------ people
HERO_X = -0.95
hero = kit.person("hero", (HERO_X, 0.25, 0.07), rot_z=math.radians(90), shirt=(0.25, 0.68, 0.48), cap=(0.92, 0.25, 0.22),
                  pants=(0.2, 0.25, 0.45), eyes="tired", mouth="flat", brows="neutral")
# folding stool + thermos next to hero (he's been here all night)
box("stool", (0.35, 0.35, 0.04), (HERO_X - 0.6, 0.65, 0.45), toon("stool", (0.25, 0.55, 0.9)), 0.008)
stroke("stool_l1", [(HERO_X - 0.75, 0.5, 0.07), (HERO_X - 0.45, 0.8, 0.45)], kit.ink(), 0.015)
stroke("stool_l2", [(HERO_X - 0.45, 0.5, 0.07), (HERO_X - 0.75, 0.8, 0.45)], kit.ink(), 0.015)
kit.cyl("thermos", 0.07, 0.3, (HERO_X - 0.55, 0.62, 0.62), toon("thermos", (0.85, 0.3, 0.25)), 0.008)

queue = []
looks = [
    dict(shirt=(0.95, 0.75, 0.2), hair_style="side", glasses=True),
    dict(shirt=(0.55, 0.35, 0.8), hair_style="long", hair=(0.35, 0.2, 0.12), blush=True),
    dict(shirt=(0.9, 0.45, 0.25), hair_style="bowl", cap=(0.15, 0.2, 0.3)),
    dict(shirt=(0.3, 0.5, 0.9), hair_style="bun", hair=(0.1, 0.08, 0.06)),
    dict(shirt=(0.85, 0.85, 0.88), hair_style="side", tie=(0.2, 0.3, 0.7)),
    dict(shirt=(0.2, 0.7, 0.75), hair_style="bowl", glasses=True),
    dict(shirt=(0.95, 0.55, 0.65), hair_style="long", hair=(0.08, 0.06, 0.06)),
    dict(shirt=(0.45, 0.45, 0.5), hair_style="grey", hair=(0.6, 0.6, 0.64)),
    dict(shirt=(0.7, 0.85, 0.3), hair_style="side", cap=(0.95, 0.95, 0.95)),
    dict(shirt=(0.35, 0.3, 0.6), hair_style="bowl"),
    dict(shirt=(0.9, 0.3, 0.35), hair_style="bun", hair=(0.4, 0.25, 0.1)),
    dict(shirt=(0.3, 0.6, 0.4), hair_style="side", glasses=True),
]
for i, lk in enumerate(looks):
    x = HERO_X - 1.25 - i * 0.88 + random.uniform(-0.1, 0.1)
    ry = math.radians(90 + random.uniform(-35, 35))
    face = random.choice([("open", "flat"), ("tired", "flat"), ("open", "frown"), ("shut", "flat")])
    p = kit.person(f"q{i}", (x, 0.3 + random.uniform(-0.12, 0.12), 0.07), rot_z=ry, eyes=face[0], mouth=face[1],
                   pants=random.choice([(0.2, 0.25, 0.45), (0.25, 0.25, 0.28), (0.45, 0.35, 0.25)]), scale=random.uniform(0.93, 1.05), **lk)
    queue.append(p)
    ph = random.random() < 0.55
    if ph:  # looking down at a glowing phone
        p["arms"][1].rotation_euler[0] = math.radians(-65)
        kit.phone(f"q{i}_ph", p["hands"][1], (0, -0.02, 0.0), rot=(math.radians(60), 0, 0))
        p["head"].rotation_euler[0] = math.radians(-14)
    kit.bob(p["torso"], 1, 300, amp=0.012, period=random.choice([40, 46, 52]), base=0.0)
    kit.blink(p["face"]["eyes"]["open"], [random.randint(10, 280) for _ in range(2)])

# hero animation: idle sway (night), yawn + stretch in shot B, turn + exchange at dawn
kit.bob(hero["torso"], 1, 200, amp=0.012, period=44, base=0.0)
kit.blink(hero["face"]["eyes"]["tired"], [40, 85])
# yawn (shot B): f118-150
kit.set_face(hero, 117, eyes="tired", mouth="flat")
kit.set_face(hero, 118, eyes="shut", mouth="open")
for f, sc in ((118, 0.4), (126, 1.25), (140, 1.3), (148, 0.5)):
    key(hero["face"]["mouth"]["open"][0], "scale", f, sc, 2)
ease_all(hero["face"]["mouth"]["open"][0])
kit.set_face(hero, 149, eyes="tired", mouth="flat")
for sh_, sgn_ in zip(hero["arms"], (-1, 1)):
    key(sh_, "rotation_euler", 116, 0.0, 1)
    key(sh_, "rotation_euler", 128, sgn_ * math.radians(150), 1)
    key(sh_, "rotation_euler", 142, sgn_ * math.radians(150), 1)
    key(sh_, "rotation_euler", 154, 0.0, 1)
    ease_all(sh_)
key(hero["head"], "rotation_euler", 116, 0.0, 0)
key(hero["head"], "rotation_euler", 128, math.radians(14), 0)
key(hero["head"], "rotation_euler", 146, math.radians(14), 0)
key(hero["head"], "rotation_euler", 156, 0.0, 0)
ease_all(hero["head"])
key(hero["torso"], "scale", 116, 1.0, 2); key(hero["torso"], "scale", 130, 1.06, 2); key(hero["torso"], "scale", 150, 1.0, 2)
ease_all(hero["torso"])

# dawn: hero holds ticket, client arrives from the right, swap ticket for cash envelope
kit.set_face(hero, DAWN, eyes="open", mouth="flat", brows="neutral")
key(hero["root"], "rotation_euler", DAWN, math.radians(90), 2)
key(hero["root"], "rotation_euler", DAWN + 30, math.radians(45), 2)
ease_all(hero["root"])
ticket = kit.empty("ticket", (0, 0, 0))
box("ticket_card", (0.2, 0.01, 0.1), (0, 0, 0), toon("ticketc", (1.0, 0.85, 0.3), shade=0.85), 0.006, ticket)
text("ticket_t", "No.001", (0, -0.008, 0), 0.04, kit.ink(), parent=ticket)
cash = kit.empty("cash", (0, 0, 0))
box("cash_env", (0.22, 0.02, 0.13), (0, 0, 0), toon("envelope", (0.95, 0.92, 0.85), shade=0.85), 0.006, cash)
text("cash_t", "¥", (0, -0.012, 0), 0.08, flat("redink", (0.85, 0.1, 0.1)), parent=cash)

client = kit.person("client", (3.2, 0.1, 0.07), rot_z=math.radians(-90), shirt=(0.12, 0.12, 0.16), tie=(0.85, 0.7, 0.2),
                    hair_style="side", hair=(0.08, 0.06, 0.05), sunglasses=True, eyes="open", mouth="smile", pants=(0.1, 0.1, 0.14))
key(client["root"], "location", DAWN, 3.6, 0)
key(client["root"], "location", DAWN + 38, -0.05, 0)
key(client["root"], "rotation_euler", DAWN + 30, math.radians(-90), 2)
key(client["root"], "rotation_euler", DAWN + 42, math.radians(-45), 2)
ease_all(client["root"])
for f in range(DAWN, DAWN + 38, 8):  # walk bounce + arm swing
    key(client["torso"], "location", f, 0.0, 2); key(client["torso"], "location", f + 4, 0.035, 2)
    for i, a in enumerate(client["arms"]):
        key(a, "rotation_euler", f, math.radians(20 if (f // 8 + i) % 2 else -20), 0)
for a in client["arms"]:
    key(a, "rotation_euler", DAWN + 40, 0.0, 0)
key(client["torso"], "location", DAWN + 40, 0.0, 2)
for o in (client["root"],):
    kit.show(o, DAWN - 1, False); kit.show(o, DAWN, True)
for o in client["root"].children_recursive:
    if o.type in ("MESH", "CURVE", "FONT") and not o.hide_render:
        kit.show(o, DAWN - 1, False); kit.show(o, DAWN, True)
# arms reach out (hero gives ticket with left/near arm, client gives cash)
H_ARM, C_ARM = hero["arms"][1], client["arms"][0]
key(H_ARM, "rotation_euler", DAWN + 30, 0.0, 0); key(H_ARM, "rotation_euler", DAWN + 44, math.radians(-80), 0)
key(H_ARM, "rotation_euler", DAWN + 70, math.radians(-80), 0); key(H_ARM, "rotation_euler", DAWN + 80, math.radians(-30), 0)
ease_all(H_ARM)
key(C_ARM, "rotation_euler", DAWN + 40, 0.0, 0); key(C_ARM, "rotation_euler", DAWN + 52, math.radians(-80), 0)
key(C_ARM, "rotation_euler", DAWN + 70, math.radians(-80), 0); key(C_ARM, "rotation_euler", DAWN + 80, math.radians(-20), 0)
ease_all(C_ARM)
# ticket follows hero hand until handoff, then client hand; cash the other way (child-of constraints with influence keys)
def follow(obj, a, b, f_switch):
    c1 = obj.constraints.new("COPY_LOCATION"); c1.target = a
    c2 = obj.constraints.new("COPY_LOCATION"); c2.target = b
    for c, before, after in ((c1, 1.0, 0.0), (c2, 0.0, 1.0)):
        c.influence = before; c.keyframe_insert("influence", frame=f_switch - 1)
        c.influence = after; c.keyframe_insert("influence", frame=f_switch)
follow(ticket, hero["hands"][1], client["hands"][0], DAWN + 58)
follow(cash, client["hands"][0], hero["hands"][1], DAWN + 58)
for o in [ticket] + list(ticket.children):
    kit.show(o, DAWN - 1, False); kit.show(o, DAWN, True)
for o in [cash] + list(cash.children):
    kit.show(o, DAWN + 49, False); kit.show(o, DAWN + 50, True)
# hero grins once paid
kit.set_face(hero, DAWN + 62, eyes="happy", mouth="grin", brows="neutral")
key(hero["torso"], "location", DAWN + 60, 0.0, 2); key(hero["torso"], "location", DAWN + 66, 0.06, 2)
key(hero["torso"], "location", DAWN + 72, 0.0, 2); key(hero["torso"], "location", DAWN + 78, 0.04, 2); key(hero["torso"], "location", DAWN + 84, 0.0, 2)

# ------------------------------------------------------------------ phone insert set (far away)
PX = 200
ph = kit.phone("bigphone", None, (PX, 0, 1.5), rot=(0, 0, 0), screen=(0.12, 0.16, 0.35), size=10)
text("ph_time", "5:59", (PX, -0.12, 1.85), 0.42, flat("phtxt", (1, 1, 1), 1.2))
text("ph_ampm", "AM", (PX, -0.12, 1.55), 0.14, flat("phtxt", (1, 1, 1), 1.2))
text("ph_date", "Saturday, March 14", (PX, -0.12, 2.08), 0.09, flat("phtxt", (1, 1, 1), 1.2))
box("ph_notif", (0.58, 0.01, 0.16), (PX, -0.105, 1.1), flat("notif", (0.9, 0.92, 0.98), 1.0), 0)
text("ph_notif_t", "Client: on my way!", (PX, -0.13, 1.1), 0.05, kit.ink())
ph_n = [bpy.data.objects["ph_notif"], bpy.data.objects["ph_notif_t"]]
for o in ph_n:
    kit.show(o, 183, False); kit.show(o, 184, True)
bpy.ops.object.light_add(type="AREA", location=(PX, -1.0, 1.5)); bpy.context.object.data.energy = 30
box("ph_bg", (8, 0.1, 8), (PX, 3, 1.5), toon("phbg", (0.2, 0.22, 0.45)), 0)

# ------------------------------------------------------------------ cameras
def cam_move(c, f0, f1, loc1, look1):
    key(c, "location", f0, c.location.copy()); key(c, "rotation_euler", f0, c.rotation_euler.copy())
    c.location = loc1; kit.aim(c, look1)
    key(c, "location", f1, c.location.copy()); key(c, "rotation_euler", f1, c.rotation_euler.copy())
    ease_all(c)

# A: low wide angle from the curb, looking down the line toward the glowing vending machines; slow dolly back + rise
camA = kit.camera("camA", (1.3, -2.6, 0.55), (-4.5, 0.6, 2.0), lens=17, dof_target=hero["head"], fstop=4.0)
cam_move(camA, 1, 100, (1.9, -3.1, 0.75), (-4.0, 0.6, 2.4))
camA.rotation_euler[1] += 0; kit.handheld(camA, 0.003, 45)
# B: medium close on the hero (3/4 front), push in
camB = kit.camera("camB", (HERO_X + 1.9, -1.15, 1.45), (HERO_X, 0.3, 1.5), lens=32, dof_target=hero["head"], fstop=1.8)
cam_move(camB, 101, 165, (HERO_X + 1.45, -0.85, 1.5), (HERO_X, 0.3, 1.55))
kit.handheld(camB, 0.003, 40)
key(camB.data, "lens", 101, 26); key(camB.data, "lens", 107, 32); ease_all(camB.data)
# C: phone insert, slow push
camC = kit.camera("camC", (PX + 0.2, -3.2, 1.7), (PX, 0, 1.6), lens=40)
cam_move(camC, 166, 205, (PX + 0.05, -2.6, 1.65), (PX, 0, 1.6))
kit.handheld(camC, 0.004, 30)
# D: dawn, 3/4 from the street, slightly high, pushing toward the exchange
camD = kit.camera("camD", (-0.35, -3.4, 1.75), (-0.4, 0.4, 1.45), lens=24, dof_target=hero["head"], fstop=3.5)
cam_move(camD, DAWN, 300, (-0.42, -2.45, 1.6), (-0.45, 0.4, 1.4))
kit.handheld(camD, 0.003, 40)
key(camD.data, "lens", DAWN, 20); key(camD.data, "lens", DAWN + 6, 24); ease_all(camD.data)

for f, c in ((1, camA), (101, camB), (166, camC), (DAWN, camD)):
    s.timeline_markers.new(c.name, frame=f).camera = c
s.camera = camA

# ------------------------------------------------------------------ render
os.makedirs(OUT, exist_ok=True)
s.render.image_settings.file_format = "PNG"
s.render.filepath = os.path.join(OUT, "f_")
if len(argv) >= 3:
    s.frame_start, s.frame_end = int(argv[1]), int(argv[2])
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "scene.blend"))
if os.environ.get("NO_RENDER") != "1":
    bpy.ops.render.render(animation=True)
