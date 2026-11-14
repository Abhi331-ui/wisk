# Mine-cave corner set (no character): faceted layered rock walls + overhang, wooden support post & beam,
# hanging red lantern, wall candle, glowing crystal vein, two crates with kettle/burner/cup/jars,
# ringed stump, dusty floor with stones, warm volumetric haze. Wide lens, slightly high camera.
# Prints screen anchors (seat, stump top) for compositing a 2D character on top.
import bpy, math, json, sys, os, random
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/bg2"
random.seed(4)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.view_settings.view_transform = "Filmic"; sc.view_settings.look = "Medium High Contrast"; sc.view_settings.exposure = -0.55
e = sc.eevee
e.taa_render_samples = 32; e.use_gtao = True; e.gtao_distance = 1.0; e.use_soft_shadows = True
e.use_bloom = True; e.bloom_intensity = 0.08; e.bloom_threshold = 0.8; e.bloom_radius = 6
e.use_volumetric_lights = True; e.volumetric_tile_size = "8"; e.volumetric_samples = 48; e.volumetric_end = 20
e.shadow_cube_size = "1024"

def hexc(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)

def mat(name, col=None, rough=0.8, metal=0.0, emit=None, strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    if col: b.inputs["Base Color"].default_value = hexc(col)
    b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = hexc(emit); b.inputs["Emission Strength"].default_value = strength
    return m

def ramp(nt, stops):
    r = nt.nodes.new("ShaderNodeValToRGB"); el = r.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], hexc(stops[0][1]); el[1].position, el[1].color = stops[-1][0], hexc(stops[-1][1])
    for p, c in stops[1:-1]: el.new(p).color = hexc(c)
    return r

def noise(nt, src, scale, detail=8):
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale; n.inputs["Detail"].default_value = detail
    if src is not None: nt.links.new(src, n.inputs[0])
    return n

def mathn(nt, op, a, b):
    n = nt.nodes.new("ShaderNodeMath"); n.operation = op
    for i, v in enumerate((a, b)):
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: nt.links.new(v, n.inputs[i])
    return n.outputs[0]

# ---------------- rock: layered sandstone strata + cracks, faceted geometry ----------------
def rock_mat():
    m = bpy.data.materials.new("rock"); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    co = nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
    wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "Z"
    wv.inputs["Scale"].default_value = 0.5; wv.inputs["Distortion"].default_value = 1.2; wv.inputs["Detail"].default_value = 1
    nt.links.new(co, wv.inputs[0])
    strata = ramp(nt, [(0.0, "#6a4c38"), (0.4, "#94735a"), (0.7, "#b08e70"), (1.0, "#7c5e48")])
    nt.links.new(wv.outputs["Fac"], strata.inputs[0])
    dirt = ramp(nt, [(0.3, "#5a3a22"), (0.7, "#ffffff")]); nt.links.new(noise(nt, co, 2.2).outputs["Fac"], dirt.inputs[0])
    mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs[0].default_value = 0.85
    nt.links.new(strata.outputs[0], mul.inputs[6]); nt.links.new(dirt.outputs[0], mul.inputs[7])
    v = nt.nodes.new("ShaderNodeTexVoronoi"); v.feature = "DISTANCE_TO_EDGE"; v.inputs["Scale"].default_value = 1.3
    nt.links.new(co, v.inputs[0])
    crack = mathn(nt, "MULTIPLY", mathn(nt, "LESS_THAN", v.outputs["Distance"], 0.006), mathn(nt, "GREATER_THAN", noise(nt, co, 1.2, 3).outputs["Fac"], 0.52))
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    nt.links.new(crack, mix.inputs[0]); nt.links.new(mul.outputs[2], mix.inputs[6]); mix.inputs[7].default_value = hexc("#2a170a")
    nt.links.new(mix.outputs[2], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.9
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.12
    nt.links.new(noise(nt, co, 7).outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs[0], b.inputs["Normal"])
    return m
ROCK = rock_mat()
vtex = bpy.data.textures.new("facets", "VORONOI"); vtex.noise_scale = 1.6; vtex.distance_metric = "DISTANCE"
ctex = bpy.data.textures.new("clouds", "CLOUDS"); ctex.noise_scale = 1.4

def rock_surface(name, loc, rot, size, strength=0.6, subdiv=90, flat=False):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=subdiv, y_subdivisions=subdiv, size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = (size[0], size[1], 1); bpy.ops.object.transform_apply(scale=True)
    for t, st in ((vtex, strength * 0.35), (ctex, strength * 0.35)):
        d = o.modifiers.new("d", "DISPLACE"); d.texture = t; d.strength = st; d.texture_coords = "GLOBAL"
    o.data.materials.append(ROCK)
    for p in o.data.polygons: p.use_smooth = not flat
    return o

rock_surface("wall_back", (0.4, 3.2, 2.2), (math.pi / 2, 0, 0), (7, 6), 0.7)
rock_surface("wall_left", (-2.4, 1.0, 2.2), (math.pi / 2, 0, math.radians(65)), (7, 6), 0.6)
rock_surface("wall_right", (2.7, 0.6, 2.2), (math.pi / 2, 0, math.radians(-62)), (7, 6), 0.8)
rock_surface("ceiling", (0.3, 0.8, 4.3), (math.radians(8), 0, 0), (8, 7), 0.9)
# overhanging outcrop top-right and a boulder lump on the right wall
for nm, loc, sc_ in (("outcrop", (1.2, 1.6, 3.55), (1.6, 1.0, 0.55)), ("lump_r", (2.1, 0.2, 1.6), (0.6, 0.7, 1.1))):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1, location=loc)
    o = bpy.context.object; o.name = nm; o.scale = sc_; bpy.ops.object.transform_apply(scale=True)
    d = o.modifiers.new("d", "DISPLACE"); d.texture = ctex; d.strength = 0.12; d.texture_coords = "GLOBAL"
    o.data.materials.append(ROCK)
    for p_ in o.data.polygons: p_.use_smooth = True
    o.modifiers.new("s", "SUBSURF").levels = 1

# dusty floor
fm = bpy.data.materials.new("floor"); fm.use_nodes = True; fnt = fm.node_tree; fb = fnt.nodes["Principled BSDF"]
fco = fnt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
fr = ramp(fnt, [(0.3, "#4a3b30"), (0.55, "#6f5d4c"), (0.8, "#8f7c68")]); fnt.links.new(noise(fnt, fco, 1.5).outputs["Fac"], fr.inputs[0])
fnt.links.new(fr.outputs[0], fb.inputs["Base Color"]); fb.inputs["Roughness"].default_value = 1.0
bpy.ops.mesh.primitive_grid_add(x_subdivisions=60, y_subdivisions=60, size=12)
fl = bpy.context.object; d = fl.modifiers.new("d", "DISPLACE"); d.texture = ctex; d.strength = 0.08
fl.data.materials.append(fm)
STONE = mat("stone", "#cfc6ba", 0.7)
for i in range(16):
    x, y = random.uniform(0.6, 2.2), random.uniform(-2.2, 1.6)
    if i < 3: x, y = random.uniform(-1.6, -0.8), random.uniform(-1.6, -0.6)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=random.uniform(0.05, 0.16), location=(x, y, 0.04))
    o = bpy.context.object; o.scale = (1, random.uniform(0.7, 1.3), random.uniform(0.4, 0.8)); o.rotation_euler.z = random.random() * 3
    o.data.materials.append(STONE)

# ---------------- wood: mine support post + beam ----------------
def wood(name, base, dark, scale=3.0, direction="Z"):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes["Principled BSDF"]
    co = nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
    st = nt.nodes.new("ShaderNodeVectorMath"); st.operation = "MULTIPLY"
    st.inputs[1].default_value = (0.4, 0.4, 7) if direction == "Z" else (7, 0.4, 0.4)
    nt.links.new(co, st.inputs[0])
    g = ramp(nt, [(0.3, dark), (0.65, base)]); nt.links.new(noise(nt, st.outputs[0], 2.0, 6).outputs["Fac"], g.inputs[0])
    nt.links.new(g.outputs[0], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.7
    return m
def cube(name, loc, size, m, bevel=0.02, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.scale = [s / 2 for s in size]; bpy.ops.object.transform_apply(scale=True)
    if bevel: bv = o.modifiers.new("bv", "BEVEL"); bv.width = bevel; bv.segments = 2
    o.data.materials.append(m); return o
POST = wood("post", "#d8b276", "#9a7442", 3, "Z")
cube("post", (-0.95, 1.7, 2.0), (0.32, 0.32, 4.2), POST)
cube("beam", (-1.6, 1.4, 3.75), (2.6, 0.34, 0.34), wood("beam", "#d6ad70", "#94693a", 3, "X"), rot=(0, 0, math.radians(25)))

# hanging red lantern (hook + bail + body + glowing glass)
IRON = mat("iron", "#2a2622", 0.5, 0.8)
LX, LY, LZ = -1.15, 1.1, 2.6
bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.45, location=(LX + 0.2, LY, 3.45), rotation=(0, math.radians(50), 0)); bpy.context.object.data.materials.append(IRON)
bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=0.35, location=(LX, LY, 3.3)); bpy.context.object.data.materials.append(IRON)
RED = mat("lantern_red", "#a0201a", 0.4, 0.3)
bpy.ops.mesh.primitive_cylinder_add(radius=0.16, depth=0.07, location=(LX, LY, LZ + 0.25)); bpy.context.object.data.materials.append(RED)
bpy.ops.mesh.primitive_cone_add(radius1=0.16, radius2=0.04, depth=0.12, location=(LX, LY, LZ + 0.34)); bpy.context.object.data.materials.append(RED)
bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.38, location=(LX, LY, LZ)); bpy.context.object.data.materials.append(mat("glass", "#ffcf8a", 0.2, emit="#ffb860", strength=1.2))
bpy.ops.mesh.primitive_cylinder_add(radius=0.17, depth=0.09, location=(LX, LY, LZ - 0.23)); bpy.context.object.data.materials.append(RED)
for k in range(4):
    a = k * math.pi / 2 + 0.4
    bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.42, location=(LX + 0.13 * math.cos(a), LY + 0.13 * math.sin(a), LZ)); bpy.context.object.data.materials.append(RED)
bpy.ops.object.light_add(type="POINT", location=(LX, LY - 0.05, LZ)); L = bpy.context.object; L.data.energy = 70; L.data.color = (1, 0.65, 0.3); L.data.shadow_soft_size = 0.1

# smooth right wall slab that carries the candle and the crystal
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1, location=(1.75, 0.7, 1.7))
slab = bpy.context.object; slab.scale = (0.75, 1.3, 1.9); bpy.ops.object.transform_apply(scale=True)
d = slab.modifiers.new("d", "DISPLACE"); d.texture = ctex; d.strength = 0.1; d.texture_coords = "GLOBAL"
slab.data.materials.append(ROCK)
for p_ in slab.data.polygons: p_.use_smooth = True
# wall candle with small iron sconce (right wall) + glowing crystal vein below it
CX, CY, CZ = 0.98, 0.35, 2.05
cube("sconce", (CX, CY + 0.05, CZ - 0.05), (0.12, 0.12, 0.03), IRON, 0)
bpy.ops.mesh.primitive_cylinder_add(radius=0.035, depth=0.18, location=(CX, CY, CZ + 0.05)); bpy.context.object.data.materials.append(mat("wax", "#f3ead8", 0.5, emit="#ffd9a0", strength=0.4))
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.025, location=(CX, CY, CZ + 0.18)); o = bpy.context.object; o.scale.z = 1.8
o.data.materials.append(mat("flame", "#fff2c0", 0.5, emit="#ffd070", strength=12))
bpy.ops.object.light_add(type="POINT", location=(CX - 0.1, CY - 0.15, CZ + 0.2)); L = bpy.context.object; L.data.energy = 45; L.data.color = (1, 0.7, 0.35); L.data.shadow_soft_size = 0.05
GOLD = mat("crystal", "#ffd36a", 0.2, emit="#ffc23a", strength=5)
for i in range(9):
    bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.035, depth=random.uniform(0.08, 0.2),
        location=(CX + 0.02 + random.uniform(-0.07, 0.07), CY - 0.05 + random.uniform(-0.04, 0.04), 1.55 + random.uniform(-0.1, 0.1)),
        rotation=(random.uniform(0.5, 1.6), random.uniform(-0.8, 0.8), random.uniform(0, 3)))
    bpy.context.object.data.materials.append(GOLD)
bpy.ops.object.light_add(type="POINT", location=(CX - 0.1, CY - 0.3, 1.55)); L = bpy.context.object; L.data.energy = 20; L.data.color = (1, 0.8, 0.3)

# ---------------- crates (two, side by side) + props ----------------
CR = wood("crate", "#e2c48e", "#b08c58", 2.5, "X")
def crate(name, loc, size, label=None):
    x, y, z = loc; w, dpt, h = size
    cube(name, (x, y, z + h / 2), size, CR, 0.01)
    LINE = mat("plankgap", "#7a5a34", 0.9)
    for k in range(1, 4):  # plank gaps on the front
        cube(f"{name}_gap{k}", (x, y - dpt / 2 - 0.002, z + h * k / 4), (w * 0.98, 0.004, 0.012), LINE, 0)
    for sx in (-1, 1):
        cube(f"{name}_bat{sx}", (x + sx * (w / 2 - 0.04), y - dpt / 2 - 0.012, z + h / 2), (0.08, 0.025, h), CR, 0.005)
    if label:
        for i, (txt, sz, dz) in enumerate(label):
            cu = bpy.data.curves.new(f"{name}_t{i}", "FONT"); cu.body = txt; cu.size = sz; cu.align_x = "CENTER"
            t = bpy.data.objects.new(f"{name}_t{i}", cu); bpy.context.collection.objects.link(t)
            t.location = (x, y - dpt / 2 - 0.004, z + h / 2 + dz); t.rotation_euler = (math.radians(90), 0, 0)
            cu.materials.append(mat("stencil", "#5a2a1a", 0.9))
SEAT = 1.0
crate("crate_l", (-0.75, 0.15, 0.0), (0.95, 0.75, SEAT), [("CANDLES", 0.09, 0.02), ("40 LBS", 0.06, -0.1)])
crate("crate_r", (0.15, 0.35, 0.0), (0.95, 0.75, SEAT - 0.05), [("MOUNTAIN SUPPLY", 0.06, 0.32)])
# kettle on a little burner, cup, two jars on the left crate
ENAMEL = mat("enamel", "#3d5f8f", 0.25, 0.1)
KX, KY, KZ = -0.95, 0.1, SEAT
bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.12, location=(KX, KY, KZ + 0.06)); bpy.context.object.data.materials.append(IRON)
for i in range(6):
    a = i * math.pi / 3
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.012, location=(KX + 0.105 * math.cos(a), KY + 0.105 * math.sin(a), KZ + 0.06))
    bpy.context.object.data.materials.append(mat("ember", "#ffcc66", 0.5, emit="#ffb040", strength=20))
bpy.ops.object.light_add(type="POINT", location=(KX, KY - 0.15, KZ + 0.08)); L = bpy.context.object; L.data.energy = 25; L.data.color = (1, 0.7, 0.3)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(KX, KY, KZ + 0.24)); o = bpy.context.object; o.scale.z = 0.85; o.data.materials.append(ENAMEL)
bpy.ops.mesh.primitive_cone_add(radius1=0.06, radius2=0.02, depth=0.14, location=(KX, KY, KZ + 0.38)); bpy.context.object.data.materials.append(ENAMEL)
bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.22, location=(KX - 0.17, KY, KZ + 0.3), rotation=(0, math.radians(-55), 0)); bpy.context.object.data.materials.append(ENAMEL)
bpy.ops.mesh.primitive_torus_add(major_radius=0.1, minor_radius=0.012, location=(KX + 0.04, KY, KZ + 0.4), rotation=(math.radians(90), 0, 0)); bpy.context.object.data.materials.append(IRON)
bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.08, location=(-0.72, 0.0, SEAT + 0.04)); bpy.context.object.data.materials.append(mat("cup", "#8a9098", 0.35, 0.2))
GLASS = mat("jar", "#e8eef2", 0.1); GLASS.blend_method = "BLEND"
GLASS.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.55
for i, x in enumerate((-0.55, -0.43)):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.13, location=(x, 0.05, SEAT + 0.065)); bpy.context.object.data.materials.append(GLASS)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.042, depth=0.03, location=(x, 0.05, SEAT + 0.14)); bpy.context.object.data.materials.append(mat("lid", "#b8b8b0", 0.4, 0.6))

# ---------------- stump in front ----------------
ST = Vector((-0.2, -0.75, 0.0)); ST_R, ST_H = 0.3, 0.42
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=ST_R, depth=ST_H, location=(ST.x, ST.y, ST_H / 2))
stump = bpy.context.object; stump.data.materials.append(wood("bark", "#6a4a2e", "#3a2616", 1.2, "Z"))
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=ST_R - 0.004, depth=0.01, location=(ST.x, ST.y, ST_H + 0.004))
top = bpy.context.object
rm = bpy.data.materials.new("rings"); rm.use_nodes = True; rnt = rm.node_tree; rb = rnt.nodes["Principled BSDF"]
wv = rnt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "RINGS"; wv.rings_direction = "Z"
wv.inputs["Scale"].default_value = 6; wv.inputs["Distortion"].default_value = 0.8
rnt.links.new(rnt.nodes.new("ShaderNodeTexCoord").outputs["Object"], wv.inputs[0])
rr = ramp(rnt, [(0.0, "#9a6c3a"), (0.12, "#d8b07a"), (1.0, "#e6c48e")]); rnt.links.new(wv.outputs["Fac"], rr.inputs[0])
rnt.links.new(rr.outputs[0], rb.inputs["Base Color"]); top.data.materials.append(rm)

# ---------------- light, haze, camera ----------------
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = hexc("#2a1a10"); bg.inputs[1].default_value = 0.25
vol = w.node_tree.nodes.new("ShaderNodeVolumeScatter"); vol.inputs["Density"].default_value = 0.012; vol.inputs["Color"].default_value = hexc("#d8d4cc")
w.node_tree.links.new(vol.outputs[0], w.node_tree.nodes["World Output"].inputs["Volume"])
bpy.ops.object.light_add(type="SPOT", location=(1.0, -1.5, 4.2)); L = bpy.context.object
L.data.energy = 1100; L.data.color = (1, 0.78, 0.5); L.data.spot_size = math.radians(70); L.data.spot_blend = 0.6
L.rotation_euler = (math.radians(25), math.radians(-10), 0)
bpy.ops.object.light_add(type="AREA", location=(0.5, -4.0, 3.0)); L = bpy.context.object
L.data.energy = 220; L.data.size = 3; L.data.color = (1, 0.85, 0.7); L.rotation_euler = (math.radians(65), 0, 0)

bpy.ops.object.camera_add(location=(-0.1, -2.85, 1.95))
cam = bpy.context.object; sc.camera = cam
cam.data.lens = 21; cam.data.sensor_fit = "VERTICAL"; cam.data.sensor_height = 36
dv = Vector((-0.2, 0.6, 1.3)) - cam.location; cam.rotation_euler = dv.to_track_quat("-Z", "Y").to_euler()

bpy.context.view_layer.update()
def px(p):
    v = world_to_camera_view(sc, cam, Vector(p)); return [round(v.x * 1080, 1), round((1 - v.y) * 1920, 1)]
crate_front_y = 0.15 - 0.375
info = dict(seat_front_center=px((-0.4, crate_front_y, SEAT)), seat_front_left=px((-1.2, crate_front_y, SEAT)),
            seat_front_right=px((0.6, crate_front_y, SEAT)), stump_top_center=px((ST.x, ST.y, ST_H)),
            stump_top_left=px((ST.x - ST_R, ST.y, ST_H)), stump_top_right=px((ST.x + ST_R, ST.y, ST_H)))
a, b = px((-0.4, crate_front_y, SEAT)), px((0.6, crate_front_y, SEAT)); info["px_per_metre_at_seat"] = round(b[0] - a[0], 1)
os.makedirs(OUT, exist_ok=True); json.dump(info, open(os.path.join(OUT, "anchors.json"), "w"), indent=1)
sc.render.filepath = os.path.join(OUT, "bg2.png")
bpy.ops.render.render(write_still=True)
print("ANCHORS", json.dumps(info))
