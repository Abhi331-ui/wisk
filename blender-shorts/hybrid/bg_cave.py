# Background set only (no character): displaced rock cave wall with dark cracks + glowing gold veins,
# wooden structure top-left, stacked produce crates, ringed log stump, dirt floor with pebbles.
# Semi-realistic (Principled) so the 2D character pops on top. Prints screen positions for compositing.
import bpy, math, json, sys, os
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/bg"
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "BLENDER_EEVEE"
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.view_settings.view_transform = "Filmic"; sc.view_settings.look = "High Contrast"; sc.view_settings.exposure = -0.9
e = sc.eevee
e.taa_render_samples = 32; e.use_gtao = True; e.gtao_distance = 0.8; e.use_soft_shadows = True
e.use_bloom = True; e.bloom_intensity = 0.06; e.bloom_threshold = 0.9; e.bloom_radius = 5

def hexc(h, a=1.0):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (a,)

def mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]; return m, nt, bsdf

def node(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items(): setattr(n, k, v)
    return n

def ramp(nt, stops, interp="LINEAR"):
    r = nt.nodes.new("ShaderNodeValToRGB"); r.color_ramp.interpolation = interp
    el = r.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], hexc(stops[0][1]); el[1].position, el[1].color = stops[-1][0], hexc(stops[-1][1])
    for p, c in stops[1:-1]: el.new(p).color = hexc(c)
    return r

def noise(nt, src, scale, detail=8, rough=0.6):
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail; n.inputs["Roughness"].default_value = rough
    if src is not None: nt.links.new(src, n.inputs[0])
    return n

def math_n(nt, op, a, b):
    n = nt.nodes.new("ShaderNodeMath"); n.operation = op
    for i, v in enumerate((a, b)):
        if isinstance(v, (int, float)): n.inputs[i].default_value = v
        else: nt.links.new(v, n.inputs[i])
    return n.outputs[0]

def edges(nt, src, scale, width):
    v = nt.nodes.new("ShaderNodeTexVoronoi"); v.feature = "DISTANCE_TO_EDGE"; v.inputs["Scale"].default_value = scale
    nt.links.new(src, v.inputs[0])
    return math_n(nt, "LESS_THAN", v.outputs["Distance"], width)

def warp(nt, co, amount, scale):
    n = noise(nt, co, scale, 6)
    s = nt.nodes.new("ShaderNodeVectorMath"); s.operation = "SCALE"; s.inputs[3].default_value = amount
    nt.links.new(n.outputs["Color"], s.inputs[0])
    a = nt.nodes.new("ShaderNodeVectorMath"); a.operation = "ADD"
    nt.links.new(co, a.inputs[0]); nt.links.new(s.outputs[0], a.inputs[1]); return a.outputs[0]

# ---------------- rock wall (real displacement) ----------------
def rock_mat():
    m, nt, b = mat("rock")
    co = nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
    wc = warp(nt, co, 0.6, 1.3)
    base = noise(nt, wc, 1.8, 12, 0.62)
    col = ramp(nt, [(0.28, "#4a2c18"), (0.45, "#8c5a32"), (0.6, "#c48a52"), (0.75, "#e8b77a")])
    nt.links.new(base.outputs["Fac"], col.inputs[0])
    cw = warp(nt, co, 1.0, 2.0)
    m1 = math_n(nt, "GREATER_THAN", noise(nt, co, 1.4, 4).outputs["Fac"], 0.47)
    m2 = math_n(nt, "GREATER_THAN", noise(nt, co, 2.2, 4).outputs["Fac"], 0.55)
    crack = math_n(nt, "MAXIMUM", math_n(nt, "MULTIPLY", edges(nt, cw, 0.9, 0.014), m1), math_n(nt, "MULTIPLY", edges(nt, cw, 2.4, 0.008), m2))
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
    nt.links.new(crack, mix.inputs[0]); nt.links.new(col.outputs[0], mix.inputs[6]); mix.inputs[7].default_value = hexc("#1c0e06")
    nt.links.new(mix.outputs[2], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.85
    # gold veins (emission), mostly on the right half
    vw = warp(nt, co, 1.2, 1.7)
    vm1 = math_n(nt, "GREATER_THAN", noise(nt, co, 1.0, 3).outputs["Fac"], 0.52)
    vm2 = math_n(nt, "GREATER_THAN", noise(nt, co, 1.7, 3).outputs["Fac"], 0.58)
    vein = math_n(nt, "MAXIMUM", math_n(nt, "MULTIPLY", edges(nt, vw, 0.7, 0.006), vm1), math_n(nt, "MULTIPLY", edges(nt, vw, 1.8, 0.0035), vm2))
    sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(co, sep.inputs[0])
    side = nt.nodes.new("ShaderNodeMapRange"); side.inputs[1].default_value = -0.4; side.inputs[2].default_value = 1.2
    nt.links.new(sep.outputs[0], side.inputs[0])
    vstr = math_n(nt, "MULTIPLY", math_n(nt, "MULTIPLY", vein, side.outputs[0]), 9.0)
    b.inputs["Emission Color"].default_value = hexc("#ffc23a")
    nt.links.new(vstr, b.inputs["Emission Strength"])
    # bump for small detail
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35
    nt.links.new(noise(nt, co, 9, 8).outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs[0], b.inputs["Normal"])
    return m

bpy.ops.mesh.primitive_grid_add(x_subdivisions=220, y_subdivisions=200, size=1, location=(0.6, 3.0, 2.6), rotation=(math.pi / 2, 0, 0))
wall = bpy.context.object; wall.scale = (11, 9, 1); bpy.ops.object.transform_apply(scale=True)
tex = bpy.data.textures.new("rockdisp", "CLOUDS"); tex.noise_scale = 0.9; tex.noise_depth = 4
d = wall.modifiers.new("disp", "DISPLACE"); d.texture = tex; d.strength = 0.55; d.mid_level = 0.5; d.texture_coords = "GLOBAL"
wall.data.materials.append(rock_mat())
for p in wall.data.polygons: p.use_smooth = True

# ---------------- wood ----------------
def wood_mat(name, base, dark, direction="Z", scale=3.0):
    m, nt, b = mat(name)
    co = nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
    wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = direction
    wv.inputs["Scale"].default_value = scale; wv.inputs["Distortion"].default_value = 0.6
    nt.links.new(co, wv.inputs[0])
    gaps = ramp(nt, [(0.0, "#3a2210"), (0.05, dark), (0.12, base), (1.0, base)])
    nt.links.new(wv.outputs["Fac"], gaps.inputs[0])
    st = nt.nodes.new("ShaderNodeVectorMath"); st.operation = "MULTIPLY"
    st.inputs[1].default_value = (0.3, 0.3, 8.0) if direction == "Z" else (8.0, 0.3, 0.3)
    nt.links.new(co, st.inputs[0])
    grain = ramp(nt, [(0.3, "#c9a77a"), (0.7, "#ffffff")]); nt.links.new(noise(nt, st.outputs[0], 2.5, 4).outputs["Fac"], grain.inputs[0])
    mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs[0].default_value = 1
    nt.links.new(gaps.outputs[0], mul.inputs[6]); nt.links.new(grain.outputs[0], mul.inputs[7])
    nt.links.new(mul.outputs[2], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.75
    return m

def cube(name, loc, size, m, bevel=0.012):
    bpy.ops.mesh.primitive_cube_add(location=loc); o = bpy.context.object; o.name = name
    o.scale = [s / 2 for s in size]; bpy.ops.object.transform_apply(scale=True)
    if bevel: bv = o.modifiers.new("bv", "BEVEL"); bv.width = bevel; bv.segments = 2
    o.data.materials.append(m); return o

CRATE = wood_mat("crate", "#d8b47a", "#8a6234", "Z", 2.4)
SEAT = 2.45
for i, (w, x) in enumerate(((1.7, -0.25), (1.6, -0.2), (1.65, -0.22))):
    cube(f"crate{i}", (x, 0.55, 0.41 + 0.815 * i), (w, 1.1, 0.8), CRATE)
    for sx in (-1, 1):  # corner battens
        cube(f"batten{i}{sx}", (x + sx * (w / 2 - 0.05), -0.01, 0.41 + 0.815 * i), (0.1, 0.03, 0.8), wood_mat("batten", "#c39d63", "#7a5428", "X", 6))
for i, (txt, z, size) in enumerate((("HILLSIDE PRODUCE CO.", SEAT - 0.33, 0.11), ("40 lb", SEAT - 0.48, 0.09))):
    cu = bpy.data.curves.new(f"st{i}", "FONT"); cu.body = txt; cu.size = size; cu.align_x = "CENTER"
    t = bpy.data.objects.new(f"st{i}", cu); bpy.context.collection.objects.link(t)
    t.location = (-0.25, -0.006, z); t.rotation_euler = (math.radians(90), 0, math.radians(-2))
    sm, snt, sb = mat("stencil"); sb.inputs["Base Color"].default_value = hexc("#7a2416"); sb.inputs["Roughness"].default_value = 0.9
    cu.materials.append(sm)

# wooden hut wall / beams top-left
BEAM = wood_mat("beam", "#b07a40", "#5e3a1a", "X", 2.2)
cube("post", (-1.75, 1.6, 3.2), (0.55, 0.45, 6.4), BEAM)
cube("planks", (-1.9, 2.2, 3.2), (1.8, 0.2, 6.4), wood_mat("planks", "#9c6a36", "#4e2f14", "X", 3.5), 0)
cube("lintel", (-0.6, 1.8, 4.75), (2.8, 0.4, 0.38), wood_mat("lintel", "#b78246", "#5e3a1a", "Z", 1.2))

# ---------------- stump ----------------
ST = Vector((0.25, -0.7, 0.0)); ST_R, ST_H = 0.46, 0.5
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=ST_R, depth=ST_H, location=(ST.x, ST.y, ST_H / 2))
stump = bpy.context.object
m, nt, b = mat("bark")
co = nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
st = nt.nodes.new("ShaderNodeVectorMath"); st.operation = "MULTIPLY"; st.inputs[1].default_value = (4, 4, 0.6); nt.links.new(co, st.inputs[0])
bc = ramp(nt, [(0.35, "#6a4424"), (0.65, "#a8794a")]); nt.links.new(noise(nt, st.outputs[0], 3, 6).outputs["Fac"], bc.inputs[0])
nt.links.new(bc.outputs[0], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.9
stump.data.materials.append(m)
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=ST_R - 0.005, depth=0.01, location=(ST.x, ST.y, ST_H + 0.004))
top = bpy.context.object
m, nt, b = mat("rings")
co = nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "RINGS"; wv.rings_direction = "Z"
wv.inputs["Scale"].default_value = 5.5; wv.inputs["Distortion"].default_value = 0.8; nt.links.new(co, wv.inputs[0])
rc = ramp(nt, [(0.0, "#9c6e3c"), (0.1, "#d9b47c"), (0.5, "#ecca92"), (1.0, "#e2bd85")]); nt.links.new(wv.outputs["Fac"], rc.inputs[0])
nt.links.new(rc.outputs[0], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.8
top.data.materials.append(m)

# ---------------- floor + pebbles ----------------
m, nt, b = mat("dirt")
co = nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]
dc = ramp(nt, [(0.35, "#2e1d12"), (0.7, "#6a4a30")]); nt.links.new(noise(nt, co, 3, 8).outputs["Fac"], dc.inputs[0])
nt.links.new(dc.outputs[0], b.inputs["Base Color"]); b.inputs["Roughness"].default_value = 0.95
bpy.ops.mesh.primitive_plane_add(size=20); bpy.context.object.data.materials.append(m)
pm, pnt, pb = mat("pebble"); pb.inputs["Base Color"].default_value = hexc("#d8d0c4"); pb.inputs["Roughness"].default_value = 0.6
import random; random.seed(3)
for i in range(9):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=random.uniform(0.03, 0.07),
                                          location=(random.uniform(0.9, 1.6), random.uniform(-1.2, 0.4), 0.03))
    o = bpy.context.object; o.scale.z = 0.6; o.data.materials.append(pm)

# ---------------- lights ----------------
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = hexc("#3a2414"); w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
def light(t, loc, energy, col, rot=None, size=None):
    bpy.ops.object.light_add(type=t, location=loc); L = bpy.context.object
    L.data.energy = energy; L.data.color = hexc(col)[:3]
    if rot: L.rotation_euler = rot
    if size and t == "AREA": L.data.size = size
    return L
light("AREA", (-1.5, -4.5, 5.0), 1400, "#ffd7a0", (math.radians(55), 0, math.radians(-20)), 4)   # warm key from front-left
light("POINT", (1.6, 1.6, 3.5), 900, "#ffb347")        # gold glow from the veins
light("POINT", (1.2, 1.8, 1.2), 500, "#ff9a3a")
light("AREA", (2.5, -3, 2.5), 300, "#9fb4ff", (math.radians(70), 0, math.radians(40)), 3)          # cool fill right

# ---------------- camera ----------------
bpy.ops.object.camera_add(location=(0.15, -7.6, 2.45))
cam = bpy.context.object; sc.camera = cam
cam.data.lens = 50; cam.data.sensor_fit = "VERTICAL"; cam.data.sensor_height = 36
dvec = Vector((0.15, 0, 2.3)) - cam.location; cam.rotation_euler = dvec.to_track_quat("-Z", "Y").to_euler()
cam.data.dof.use_dof = True; cam.data.dof.focus_distance = 7.6; cam.data.dof.aperture_fstop = 1.2

# ---------------- screen positions for the 2D character ----------------
bpy.context.view_layer.update()
def px(p):
    v = world_to_camera_view(sc, cam, Vector(p))
    return [round(v.x * 1080, 1), round((1 - v.y) * 1920, 1)]
info = dict(
    seat_front_center=px((0.0, -0.02, SEAT)), seat_left=px((-0.6, -0.02, SEAT)), seat_right=px((0.6, -0.02, SEAT)),
    stump_top_center=px((ST.x, ST.y, ST_H)), stump_top_left=px((ST.x - ST_R, ST.y, ST_H)), stump_top_right=px((ST.x + ST_R, ST.y, ST_H)),
    floor_left_front=px((-0.45, -1.0, 0.0)), metres_per_px_at_seat=None,
)
a, b2 = px((0, -0.02, SEAT)), px((1, -0.02, SEAT)); info["px_per_metre_at_seat"] = round(b2[0] - a[0], 1)
os.makedirs(OUT, exist_ok=True)
json.dump(info, open(os.path.join(OUT, "anchors.json"), "w"), indent=1)
sc.render.filepath = os.path.join(OUT, "bg.png")
bpy.ops.render.render(write_still=True)
print("ANCHORS", json.dumps(info))
