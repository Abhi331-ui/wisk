# Blender 5.3 background showcase for video 16 (San Francisco, 1870s): realistic forms, painted-anime finish.
# usage: python bg.py <shot> <out.png> [W H samples]
import bpy, bmesh, math, random, sys
from mathutils import Vector, Euler

SHOT = sys.argv[1]; OUT = sys.argv[2]
W, H, SPP = (int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (1080, 1920, 48)
bpy.ops.wm.read_factory_settings(use_empty=True)
S = bpy.context.scene
R = random.Random(7)

def setp(node, name, val):
    if name in node.inputs:
        try: node.inputs[name].default_value = val; return
        except Exception: pass
    try: setattr(node, name.lower().replace(" ", "_"), val)
    except Exception as e: print("setp fail", node.bl_idname, name, e)

# ---------------------------------------------------------------- materials
MATS = {}
def mat(name, build):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial"); bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    build(nt, bsdf, out); MATS[name] = m; return m

def coord(nt, scale=1.0):
    tc = nt.nodes.new("ShaderNodeNewGeometry"); mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale); nt.links.new(tc.outputs["Position"], mp.inputs[0]); return mp.outputs[0]

def wallc(nt):
    g = nt.nodes.new("ShaderNodeNewGeometry"); sp = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(g.outputs["Position"], sp.inputs[0])
    ad = nt.nodes.new("ShaderNodeMath"); ad.operation = "ADD"; nt.links.new(sp.outputs["X"], ad.inputs[0]); nt.links.new(sp.outputs["Y"], ad.inputs[1])
    cb = nt.nodes.new("ShaderNodeCombineXYZ"); nt.links.new(ad.outputs[0], cb.inputs["X"]); nt.links.new(sp.outputs["Z"], cb.inputs["Y"]); return cb.outputs[0]

def deck(name, col="#7a5634"):
    def b(nt, bsdf, out):
        v = coord(nt); br = nt.nodes.new("ShaderNodeTexBrick"); nt.links.new(v, br.inputs["Vector"])
        br.inputs["Scale"].default_value = 1.0; br.inputs["Mortar Size"].default_value = 0.012; br.inputs["Brick Width"].default_value = 3.2; br.inputs["Row Height"].default_value = 0.24
        c = hexc(col); br.inputs["Color1"].default_value = (*c, 1); br.inputs["Color2"].default_value = (*tuple(x * 0.7 for x in c), 1); br.inputs["Mortar"].default_value = (0.03, 0.02, 0.015, 1)
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (0.3, 6, 1); nt.links.new(v, mp.inputs[0]); n = noise(nt, mp.outputs[0], 2.5, 8, 0.7)
        mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.blend_type = "MULTIPLY"; mx.inputs[0].default_value = 0.6
        nt.links.new(br.outputs["Color"], mx.inputs[6]); nt.links.new(ramp(nt, n.outputs["Fac"], [(0.3, (0.6, 0.55, 0.5)), (0.7, (1, 1, 1))]), mx.inputs[7])
        nt.links.new(mx.outputs[2], bsdf.inputs["Base Color"]); bsdf.inputs["Roughness"].default_value = 0.75
        inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1; nt.links.new(br.outputs["Fac"], inv.inputs[1])
        ad = nt.nodes.new("ShaderNodeMath"); ad.operation = "MULTIPLY_ADD"; nt.links.new(n.outputs["Fac"], ad.inputs[0]); ad.inputs[1].default_value = 0.15; nt.links.new(inv.outputs[0], ad.inputs[2])
        bump(nt, bsdf, ad.outputs[0], 0.6, 0.02)
    return mat(name, b)

def ramp(nt, fac, cols):
    r = nt.nodes.new("ShaderNodeValToRGB"); e = r.color_ramp.elements
    e[0].position, e[0].color = cols[0][0], (*cols[0][1], 1); e[1].position, e[1].color = cols[-1][0], (*cols[-1][1], 1)
    for p, c in cols[1:-1]: el = e.new(p); el.color = (*c, 1)
    nt.links.new(fac, r.inputs[0]); return r.outputs[0]

def bump(nt, bsdf, h, strength=0.3, dist=0.05):
    b = nt.nodes.new("ShaderNodeBump"); b.inputs["Strength"].default_value = strength; b.inputs["Distance"].default_value = dist
    nt.links.new(h, b.inputs["Height"]); nt.links.new(b.outputs[0], bsdf.inputs["Normal"])

def noise(nt, v, scale, detail=6, rough=0.6):
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = scale; n.inputs["Detail"].default_value = detail; n.inputs["Roughness"].default_value = rough
    nt.links.new(v, n.inputs["Vector"]); return n

def hexc(h): h = h.lstrip("#"); return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))

def plain(name, col, rough=0.6, metal=0.0, nscale=4.0, nvar=0.12):
    def b(nt, bsdf, out):
        v = coord(nt); n = noise(nt, v, nscale)
        c = hexc(col); d = tuple(x * (1 - nvar) for x in c); l = tuple(min(1, x * (1 + nvar)) for x in c)
        nt.links.new(ramp(nt, n.outputs["Fac"], [(0.3, d), (0.7, l)]), bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = rough; bsdf.inputs["Metallic"].default_value = metal
        bump(nt, bsdf, n.outputs["Fac"], 0.08)
    return mat(name, b)

def brick(name, col="#9a4430", mortar="#c9bca4"):
    def b(nt, bsdf, out):
        v = wallc(nt); br = nt.nodes.new("ShaderNodeTexBrick"); nt.links.new(v, br.inputs["Vector"])
        br.inputs["Scale"].default_value = 4.2; br.inputs["Mortar Size"].default_value = 0.018; br.inputs["Brick Width"].default_value = 0.5; br.inputs["Row Height"].default_value = 0.22
        c = hexc(col); br.inputs["Color1"].default_value = (*c, 1); br.inputs["Color2"].default_value = (*tuple(x * 0.72 for x in c), 1); br.inputs["Mortar"].default_value = (*hexc(mortar), 1)
        n = noise(nt, v, 9); mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.blend_type = "MULTIPLY"; mix.inputs["Factor"].default_value = 0.35
        nt.links.new(br.outputs["Color"], mix.inputs["A"]); nt.links.new(ramp(nt, n.outputs["Fac"], [(0.3, (0.75, 0.72, 0.7)), (0.7, (1, 1, 1))]), mix.inputs["B"])
        nt.links.new(mix.outputs["Result"], bsdf.inputs["Base Color"]); bsdf.inputs["Roughness"].default_value = 0.85
        inv = nt.nodes.new("ShaderNodeMath"); inv.operation = "SUBTRACT"; inv.inputs[0].default_value = 1; nt.links.new(br.outputs["Fac"], inv.inputs[1])
        bump(nt, bsdf, inv.outputs[0], 0.5, 0.02)
    return mat(name, b)

def clap(name, col):
    def b(nt, bsdf, out):
        v = coord(nt); wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "Z"; wv.wave_profile = "SAW"
        wv.inputs["Scale"].default_value = 2.6; wv.inputs["Distortion"].default_value = 0.0; nt.links.new(v, wv.inputs["Vector"])
        n = noise(nt, v, 3.0); c = hexc(col)
        nt.links.new(ramp(nt, n.outputs["Fac"], [(0.25, tuple(x * 0.82 for x in c)), (0.75, c)]), bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.7; bump(nt, bsdf, wv.outputs["Fac"], 0.35, 0.03)
    return mat(name, b)

def wood(name, col="#6a4428", scale=1.0):
    def b(nt, bsdf, out):
        v = coord(nt, scale); mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1, 1, 14); nt.links.new(v, mp.inputs[0])
        n = noise(nt, mp.outputs[0], 3.0, 8, 0.65); wv = nt.nodes.new("ShaderNodeTexWave"); wv.inputs["Scale"].default_value = 1.4; wv.inputs["Distortion"].default_value = 6
        nt.links.new(v, wv.inputs["Vector"]); c = hexc(col)
        mix = nt.nodes.new("ShaderNodeMath"); mix.operation = "MULTIPLY"; nt.links.new(n.outputs["Fac"], mix.inputs[0]); nt.links.new(wv.outputs["Fac"], mix.inputs[1])
        nt.links.new(ramp(nt, mix.outputs[0], [(0.05, tuple(x * 0.55 for x in c)), (0.35, c), (0.6, tuple(min(1, x * 1.3) for x in c))]), bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.6; bump(nt, bsdf, mix.outputs[0], 0.25, 0.01)
    return mat(name, b)

def glass_win(name):
    def b(nt, bsdf, out):
        bsdf.inputs["Base Color"].default_value = (0.02, 0.03, 0.04, 1); bsdf.inputs["Roughness"].default_value = 0.03; bsdf.inputs["Specular IOR Level"].default_value = 1.0
        v = coord(nt); n = noise(nt, v, 1.2, 2)
        nt.links.new(ramp(nt, n.outputs["Fac"], [(0.35, (0.15, 0.07, 0.02)), (0.65, (0.5, 0.28, 0.1))]), bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 0.12
    return mat(name, b)

def cobble(name):
    def b(nt, bsdf, out):
        v = coord(nt); vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.feature = "DISTANCE_TO_EDGE"; vo.inputs["Scale"].default_value = 7.5; vo.inputs["Randomness"].default_value = 0.7
        mp = nt.nodes.new("ShaderNodeMapping"); mp.inputs["Scale"].default_value = (1.0, 1.6, 1); nt.links.new(v, mp.inputs[0]); nt.links.new(mp.outputs[0], vo.inputs["Vector"])
        vc = nt.nodes.new("ShaderNodeTexVoronoi"); vc.inputs["Scale"].default_value = 7.5; vc.inputs["Randomness"].default_value = 0.7; nt.links.new(mp.outputs[0], vc.inputs["Vector"])
        edge = ramp(nt, vo.outputs["Distance"], [(0.0, (0, 0, 0)), (0.12, (1, 1, 1))])
        stone = ramp(nt, vc.outputs["Color"], [(0.0, hexc("#5a544e")), (0.5, hexc("#8a8076")), (1.0, hexc("#6e6258"))])
        n = noise(nt, v, 14, 8); dirt = ramp(nt, n.outputs["Fac"], [(0.35, (0.7, 0.66, 0.6)), (0.7, (1, 1, 1))])
        m1 = nt.nodes.new("ShaderNodeMix"); m1.data_type = "RGBA"; m1.blend_type = "MULTIPLY"; m1.inputs["Factor"].default_value = 1
        nt.links.new(stone, m1.inputs["A"]); nt.links.new(dirt, m1.inputs["B"])
        m2 = nt.nodes.new("ShaderNodeMix"); m2.data_type = "RGBA"; nt.links.new(edge, m2.inputs["Factor"])
        m2.inputs["A"].default_value = (*hexc("#2e2822"), 1); nt.links.new(m1.outputs["Result"], m2.inputs["B"])
        nt.links.new(m2.outputs["Result"], bsdf.inputs["Base Color"])
        rr = ramp(nt, vo.outputs["Distance"], [(0.0, (0.95, 0.95, 0.95)), (0.15, (0.55, 0.55, 0.55))]); nt.links.new(rr, bsdf.inputs["Roughness"])
        sq = nt.nodes.new("ShaderNodeMath"); sq.operation = "POWER"; sq.inputs[1].default_value = 0.4; nt.links.new(vo.outputs["Distance"], sq.inputs[0])
        bump(nt, bsdf, sq.outputs[0], 0.9, 0.06)
    return mat(name, b)

def leaf(name, col="#4f7a32", col2="#8fae48"):
    def b(nt, bsdf, out):
        v = coord(nt); vo = nt.nodes.new("ShaderNodeTexVoronoi"); vo.inputs["Scale"].default_value = 9; nt.links.new(v, vo.inputs["Vector"])
        n = noise(nt, v, 1.5, 4); m = nt.nodes.new("ShaderNodeMath"); m.operation = "MULTIPLY_ADD"; m.inputs[1].default_value = 0.5
        nt.links.new(n.outputs["Fac"], m.inputs[0]); nt.links.new(vo.outputs["Distance"], m.inputs[2])
        nt.links.new(ramp(nt, m.outputs[0], [(0.2, tuple(x * 0.45 for x in hexc(col))), (0.5, hexc(col)), (0.85, hexc(col2))]), bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.55; bsdf.inputs["Subsurface Weight"].default_value = 0.25
        bsdf.inputs["Subsurface Radius"].default_value = (0.4, 0.8, 0.2); bsdf.inputs["Subsurface Scale"].default_value = 0.2
        bump(nt, bsdf, vo.outputs["Distance"], 0.8, 0.05)
    return mat(name, b)

def grassm(name):
    def b(nt, bsdf, out):
        v = coord(nt); n = noise(nt, v, 0.25, 5); n2 = noise(nt, v, 3, 6)
        mm = nt.nodes.new("ShaderNodeMath"); mm.operation = "MULTIPLY"; nt.links.new(n.outputs["Fac"], mm.inputs[0]); nt.links.new(n2.outputs["Fac"], mm.inputs[1])
        nt.links.new(ramp(nt, mm.outputs[0], [(0.1, hexc("#2e4a1c")), (0.28, hexc("#5a8a2e")), (0.45, hexc("#9cbc52"))]), bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.7; bump(nt, bsdf, n2.outputs["Fac"], 0.4)
    return mat(name, b)

def water(name):
    def b(nt, bsdf, out):
        bsdf.inputs["Base Color"].default_value = (*hexc("#0e3a4a"), 1); bsdf.inputs["Roughness"].default_value = 0.09
        bsdf.inputs["Transmission Weight"].default_value = 0.0; bsdf.inputs["Specular IOR Level"].default_value = 0.5; bsdf.inputs["IOR"].default_value = 1.33
        bsdf.inputs["Subsurface Weight"].default_value = 0.0
        v = coord(nt); n = noise(nt, v, 0.6, 3)
        nt.links.new(ramp(nt, n.outputs["Fac"], [(0.35, hexc("#0a2e3e")), (0.65, hexc("#1e5a62"))]), bsdf.inputs["Base Color"])
        n2 = noise(nt, v, 1.6, 8, 0.7); bump(nt, bsdf, n2.outputs["Fac"], 0.5, 0.15)
    return mat(name, b)

def cloth(name, col, sheen=0.4):
    def b(nt, bsdf, out):
        v = coord(nt); n = noise(nt, v, 40, 3); c = hexc(col)
        nt.links.new(ramp(nt, n.outputs["Fac"], [(0.3, tuple(x * 0.85 for x in c)), (0.7, c)]), bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.85; bsdf.inputs["Sheen Weight"].default_value = sheen; bump(nt, bsdf, n.outputs["Fac"], 0.1)
    return mat(name, b)

def cloudm(name):
    def b(nt, bsdf, out):
        bsdf.inputs["Base Color"].default_value = (0.95, 0.95, 0.97, 1); bsdf.inputs["Roughness"].default_value = 1
        bsdf.inputs["Subsurface Weight"].default_value = 0.6; bsdf.inputs["Subsurface Radius"].default_value = (1, 1, 1); bsdf.inputs["Subsurface Scale"].default_value = 6
        bsdf.inputs["Emission Color"].default_value = (0.55, 0.62, 0.8, 1); bsdf.inputs["Emission Strength"].default_value = 0.12
    return mat(name, b)

# ---------------------------------------------------------------- geometry helpers
COLL = {}
def coll(name):
    if name not in COLL: c = bpy.data.collections.new(name); S.collection.children.link(c); COLL[name] = c
    return COLL[name]
def link(o, c="main"):
    for u in list(o.users_collection): u.objects.unlink(o)
    coll(c).objects.link(o); return o

UNIT = {}
def unit(kind, v=16, r2=None, sub=3, smooth=False):
    key = (kind, v, r2, sub)
    if key in UNIT: return UNIT[key]
    me = bpy.data.meshes.new(str(key)); bm = bmesh.new()
    if kind == "cube": bmesh.ops.create_cube(bm, size=1.0)
    elif kind == "cyl": bmesh.ops.create_cone(bm, cap_ends=True, segments=v, radius1=1.0, radius2=(1.0 if r2 is None else r2), depth=1.0)
    elif kind == "ico": bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0)
    elif kind == "uv": bmesh.ops.create_uvsphere(bm, u_segments=v, v_segments=v // 2, radius=1.0)
    bm.to_mesh(me); bm.free()
    if smooth:
        for p in me.polygons: p.use_smooth = True
    me.materials.append(None); UNIT[key] = me; return me

def obj(me, loc, scale, rot, m, c="main"):
    o = bpy.data.objects.new("o", me); o.location = loc; o.scale = scale; o.rotation_euler = rot
    link(o, c); o.material_slots[0].link = "OBJECT"; o.material_slots[0].material = m; return o

def box(sx, sy, sz, x, y, z, m, bevel=0.0, c="main", rot=(0, 0, 0)):
    o = obj(unit("cube"), (x, y, z), (sx, sy, sz), rot, m, c)
    if bevel and min(sx, sy, sz) > bevel * 3:
        md = o.modifiers.new("b", "BEVEL"); md.width = bevel / max(1e-3, min(sx, sy, sz)); md.segments = 2; md.limit_method = "ANGLE"
    return o

def cyl(r, h, x, y, z, m, v=16, rot=(0, 0, 0), r2=None, c="main"):
    rr = None if r2 is None else round(r2 / r, 3)
    return obj(unit("cyl", v, rr, smooth=True), (x, y, z), (r, r, h), rot, m, c)

def sphere(r, x, y, z, m, sub=3, c="main"):
    return obj(unit("ico", sub=sub, smooth=True), (x, y, z), (r, r, r), (0, 0, 0), m, c)

def mesh_obj(name, verts, faces, m, c="main", smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    me.materials.append(m); o = bpy.data.objects.new(name, me); return link(o, c)

def grid(x0, x1, y0, y1, nx, ny, fn, m, c="main"):
    vs = [(x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny, 0) for j in range(ny + 1) for i in range(nx + 1)]
    vs = [(x, y, fn(x, y)) for (x, y, _) in vs]
    fs = [(j * (nx + 1) + i, j * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i) for j in range(ny) for i in range(nx)]
    return mesh_obj("grid", vs, fs, m, c)

def displace(o, strength, size, seed=0):
    t = bpy.data.textures.new("d%d" % seed, "CLOUDS"); t.noise_scale = size; t.noise_depth = 3
    md = o.modifiers.new("d", "DISPLACE"); md.texture = t; md.strength = strength; md.mid_level = 0.5
    md.texture_coords = "GLOBAL"
    return o

def text(s, x, y, z, size, m, rot=(math.pi / 2, 0, 0), c="main", extrude=0.02):
    bpy.ops.object.text_add(location=(x, y, z), rotation=rot); o = bpy.context.object; o.data.body = s; o.data.size = size
    o.data.align_x = "CENTER"; o.data.align_y = "CENTER"; o.data.extrude = extrude; o.data.materials.append(m); return link(o, c)

# ---------------------------------------------------------------- props
M = dict(
    trim=plain("trim", "#efe6d2", 0.5), trimd=plain("trimd", "#2e3a2e", 0.5), iron=plain("iron", "#1c1a1a", 0.35, 0.8),
    brass=plain("brass", "#c8963a", 0.3, 1.0), glass=glass_win("glass"), cob=cobble("cob"), plank=deck("plank", "#7a5634"),
    walk=deck("walk", "#8a6a48"), bark=wood("bark", "#4a3424", 3.0), leaf=leaf("leaf"), leaf2=leaf("leaf2", "#3e6a2e", "#7a9e3e"),
    grass=grassm("grass"), sign=plain("sign", "#1e2a3a", 0.4), gold=plain("gold", "#e0b04a", 0.25, 1.0), water=water("water"),
    roof=plain("roof", "#4a4e56", 0.7), hull=wood("hull", "#2a1e18", 1.5), sail=cloth("sail", "#efe8d8", 0.2), rope=plain("rope", "#8a7a5a", 0.9),
    cloud=cloudm("cloud"), dome=plain("dome", "#f2efe8", 0.45, 0, 2, 0.05), marble=plain("marble", "#ece6da", 0.4, 0, 3, 0.06),
    path=plain("path", "#b8a88a", 0.9, 0, 6, 0.2), redc=cloth("redc", "#8a2a24"), aw1=cloth("aw1", "#9a2e2a"), aw2=cloth("aw2", "#2e5a3a"),
    soil=plain("soil", "#5a4630", 0.95, 0, 8, 0.3),
)

def tree(x, y, z, s=1.0, seed=0, m=None):
    r = random.Random(seed); m = m or (M["leaf"] if seed % 2 else M["leaf2"])
    tr = cyl(0.22 * s, 3.2 * s, x, y, z + 1.6 * s, M["bark"], 10, r2=0.12 * s); displace(tr, 0.05 * s, 0.4, seed)
    for k in range(4):
        a = r.uniform(0, 6.28); ln = r.uniform(1.0, 1.7) * s
        cyl(0.08 * s, ln, x + math.cos(a) * ln * 0.4, y + math.sin(a) * ln * 0.4, z + (2.4 + k * 0.35) * s, M["bark"], 6,
            rot=(math.cos(a + 1.57) * 0.9, math.sin(a + 1.57) * 0.9 * -1, 0), r2=0.03 * s)
    blobs = []
    for k in range(r.randint(9, 13)):
        a = r.uniform(0, 6.28); d = r.uniform(0.2, 1.4) * s; h = r.uniform(3.0, 5.6) * s; rr = r.uniform(0.9, 1.5) * s * (1.15 - abs(h / s - 4.2) * 0.18)
        b = sphere(rr, x + math.cos(a) * d, y + math.sin(a) * d, z + h, m, 3); displace(b, 0.55 * s, 0.55 * s, seed * 31 + k); blobs.append(b)
    return blobs

def lamp(x, y):
    cyl(0.06, 3.6, x, y, 1.8, M["iron"], 10); cyl(0.14, 0.3, x, y, 0.15, M["iron"], 10)
    box(0.34, 0.34, 0.5, x, y, 3.85, M["glass"]); cyl(0.26, 0.2, x, y, 4.2, M["iron"], 4, r2=0.02)

def pole(x, y, h=9):
    cyl(0.13, h, x, y, h / 2, M["bark"], 8)
    for k in range(2): box(2.2, 0.12, 0.12, x, y, h - 0.6 - k * 0.7, M["bark"])

def building(x0, w, front_y, h, kind, col, face=-1, sign=None, floors=3, seed=0):
    r = random.Random(seed); wall = brick("br" + col, col) if kind == "brick" else clap("cl" + col, col)
    d = 10; out = -1 if front_y > 0 else 1
    box(w, d, h, x0 + w / 2, front_y - out * d / 2, h / 2, wall)
    trim = M["trim"] if r.random() < 0.7 else M["trimd"]
    # cornice + brackets
    box(w + 0.6, 0.9, 0.5, x0 + w / 2, front_y + out * 0.4, h + 0.1, trim, 0.04)
    box(w + 0.4, 0.5, 0.25, x0 + w / 2, front_y + out * 0.2, h - 0.35, trim)
    for k in range(int(w / 1.2) + 1): box(0.18, 0.5, 0.45, x0 + 0.3 + k * (w - 0.6) / max(1, int(w / 1.2)), front_y + out * 0.25, h - 0.6, trim)
    # upper windows
    fh = (h - 4.2) / max(1, floors - 1)
    nw = max(2, int(w / 2.2))
    for fl in range(1, floors):
        zc = 4.2 + (fl - 0.5) * fh
        for k in range(nw):
            cx = x0 + (k + 0.5) * w / nw
            box(0.95, 0.1, 1.7, cx, front_y + out * 0.03, zc, M["glass"])
            for (sx, sz, dx, dz) in [(1.2, 0.14, 0, 0.92), (1.25, 0.2, 0, -0.95), (0.13, 1.9, -0.55, 0), (0.13, 1.9, 0.55, 0), (0.95, 0.06, 0, 0.1)]:
                box(sx, 0.18, sz, cx + dx, front_y + out * 0.1, zc + dz, trim)
            box(1.4, 0.32, 0.22, cx, front_y + out * 0.18, zc + 1.15, trim, 0.03)  # pediment
            cu = cloth("cur%d" % (seed % 3), ["#e8dcc0", "#b8c8b0", "#d8b8a8"][seed % 3])
            box(0.35, 0.04, 1.5, cx - 0.28, front_y - out * 0.02, zc + 0.05, cu); box(0.35, 0.04, 1.5, cx + 0.28, front_y - out * 0.02, zc + 0.05, cu)
    # storefront
    box(w - 0.8, 0.1, 2.6, x0 + w / 2, front_y + out * 0.03, 1.7, M["glass"])
    for k in range(int(w / 1.6) + 1): box(0.16, 0.22, 3.0, x0 + 0.4 + k * (w - 0.8) / max(1, int(w / 1.6)), front_y + out * 0.1, 1.6, trim)
    box(w, 0.25, 0.3, x0 + w / 2, front_y + out * 0.12, 0.15, trim); box(w, 0.3, 0.25, x0 + w / 2, front_y + out * 0.15, 3.15, trim)
    # sign board + awning
    if sign:
        box(w * 0.8, 0.12, 0.7, x0 + w / 2, front_y + out * 0.25, 3.7, M["sign"], 0.02)
        text(sign, x0 + w / 2, front_y + out * 0.33, 3.7, 0.42, M["gold"], rot=(math.pi / 2, 0, 0 if out < 0 else math.pi))
    aw = M["aw1"] if seed % 2 else M["aw2"]
    o = box(w - 0.4, 1.6, 0.06, x0 + w / 2, front_y + out * 0.85, 3.05, aw, rot=(out * 0.38, 0, 0))

def cobbles_road(x0, x1, y0, y1):
    grid(x0, x1, y0, y1, 1, 1, lambda x, y: 0.0, M["cob"])
    for yy in (-0.72, 0.72):  # rails
        box(x1 - x0, 0.09, 0.05, (x0 + x1) / 2, yy, 0.025, M["iron"])
    box(x1 - x0, 0.03, 0.02, (x0 + x1) / 2, 0, 0.01, M["iron"])  # cable slot

def boardwalk(x0, x1, y, wdt):
    box(x1 - x0, wdt, 0.25, (x0 + x1) / 2, y, 0.125, M["walk"])
    box(x1 - x0, 0.2, 0.3, (x0 + x1) / 2, y - wdt / 2 * (1 if y > 0 else -1), 0.15, M["plank"])

def cloud(cx, cy, cz, sz, seed):
    r = random.Random(seed); bpy.ops.object.metaball_add(type="BALL", location=(cx, cy, cz)); mb = bpy.context.object
    mb.data.resolution = sz * 0.06; mb.data.render_resolution = sz * 0.035; el = mb.data.elements[0]; el.radius = sz * 0.5
    for k in range(18):
        e = mb.data.elements.new(); a = r.uniform(-1, 1)
        e.co = (a * sz * 1.4, r.uniform(-0.4, 0.4) * sz, (1 - abs(a)) * r.uniform(0, 0.7) * sz); e.radius = sz * r.uniform(0.3, 0.6) * (1.2 - abs(a) * 0.5)
    mb.data.materials.append(M["cloud"]); link(mb, "sky")

def hill_mesh(x0, x1, y0, y1, fn, res=120, m=None):
    return grid(x0, x1, y0, y1, res, res, fn, m or M["grass"])

def hill_house(x, y, z, s, seed, out=-1):
    r = random.Random(seed); cols = ["#e8d8b8", "#c8d8e0", "#e8c8b0", "#d0e0c8", "#f0e6d6", "#d8c0c8", "#b8c8d8", "#e6d6a8"]
    wall = clap("hh%d" % (seed % 8), cols[seed % 8]); hw, hd, hh = 5.6 * s, 8 * s, r.choice([7, 8.5, 10]) * s
    box(hw, hd, hh, x, y, z + hh / 2 - 1, wall)
    pts = [(-hw / 2 - 0.2, 0), (hw / 2 + 0.2, 0), (0, 3.0 * s)]
    vs = [(x + px, y + yy, z + hh - 1 + pz) for yy in (-hd / 2 - 0.3, hd / 2 + 0.3) for (px, pz) in pts]
    mesh_obj("roof", vs, [(0, 1, 2), (3, 5, 4), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)], M["roof"], smooth=False)
    fy = y + out * hd / 2
    box(2.2 * s, 1.2 * s, 3.4 * s, x - 1.2 * s, fy + out * 0.6 * s, z + 4.4 * s, wall)  # bay window
    for (wx, wz) in [(-1.2, 4.4), (1.5, 4.4), (1.5, 1.6), (-1.5, 1.6)]:
        box(0.9 * s, 0.1, 1.5 * s, x + wx * s, fy + out * (1.25 * s if (wx < 0 and wz > 4) else 0.06), z + wz * s, M["glass"])
        box(1.1 * s, 0.14, 0.15 * s, x + wx * s, fy + out * (1.3 * s if (wx < 0 and wz > 4) else 0.1), z + (wz + 0.85) * s, M["trim"])
    box(1.0 * s, 0.1, 2.0 * s, x + 0.2 * s, fy + out * 0.06, z + 0.0, M["trimd"])
    box(hw + 0.3, 0.3, 0.25 * s, x, fy + out * 0.15, z + hh - 1.1, M["trim"])
    cyl(0.35 * s, 2.2 * s, x + 1.6 * s, y - 1 * s, z + hh + 1.4 * s, brick("brc", "#8a3a2a"), 4)

# ---------------------------------------------------------------- world: sky, sun, render
def world(sun_el=14, sun_az=235, strength=0.9):
    w = bpy.data.worlds.new("w"); S.world = w; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
    tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    sky = ramp(nt, sep.outputs["Z"], [(0.0, hexc("#f8d8b0")), (0.035, hexc("#f0c8a0")), (0.09, hexc("#8cb8e8")), (0.25, hexc("#3c78cc")), (0.6, hexc("#1c4a9c"))])
    # warm glow toward the sun
    sd = Vector((math.cos(math.radians(sun_az)) * math.cos(math.radians(sun_el)), math.sin(math.radians(sun_az)) * math.cos(math.radians(sun_el)), math.sin(math.radians(sun_el))))
    dp = nt.nodes.new("ShaderNodeVectorMath"); dp.operation = "DOT_PRODUCT"; nt.links.new(tc.outputs["Generated"], dp.inputs[0]); dp.inputs[1].default_value = sd
    gl = ramp(nt, dp.outputs["Value"], [(0.55, (0, 0, 0)), (0.9, (0.6, 0.35, 0.12)), (0.999, (3.0, 2.2, 1.2))])
    add = nt.nodes.new("ShaderNodeMix"); add.data_type = "RGBA"; add.blend_type = "ADD"; add.inputs[0].default_value = 1
    nt.links.new(sky, add.inputs[6]); nt.links.new(gl, add.inputs[7])
    bg = nt.nodes.new("ShaderNodeBackground"); bg.inputs["Strength"].default_value = strength; o = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(add.outputs[2], bg.inputs[0]); nt.links.new(bg.outputs[0], o.inputs[0])
    w.mist_settings.start = 40; w.mist_settings.depth = 1200; w.mist_settings.falloff = "QUADRATIC"
    ld = bpy.data.lights.new("sun", "SUN"); ld.energy = 6.5; ld.color = (1.0, 0.8, 0.58); ld.angle = math.radians(2.0)
    so = bpy.data.objects.new("sun", ld); S.collection.objects.link(so)
    so.rotation_euler = (-sd).to_track_quat("-Z", "Y").to_euler()

def camera(pos, look, lens=28, roll=2.0, dof=None):
    cd = bpy.data.cameras.new("cam"); cd.lens = lens; cd.sensor_width = 24; co = bpy.data.objects.new("cam", cd); S.collection.objects.link(co)
    co.location = pos; d = Vector(look) - Vector(pos); q = d.to_track_quat("-Z", "Y"); co.rotation_euler = q.to_euler()
    co.rotation_euler.rotate_axis("Z", math.radians(roll)); S.camera = co; cd.clip_end = 5000
    if dof: cd.dof.use_dof = True; cd.dof.focus_distance = dof[0]; cd.dof.aperture_fstop = dof[1]

def render_setup():
    S.render.engine = "CYCLES"; S.cycles.device = "CPU"; S.cycles.samples = SPP; S.cycles.use_denoising = True
    try: S.cycles.denoiser = "OPENIMAGEDENOISE"
    except Exception: pass
    S.cycles.max_bounces = 6; S.cycles.diffuse_bounces = 3; S.cycles.glossy_bounces = 3; S.cycles.transmission_bounces = 4
    S.render.resolution_x, S.render.resolution_y = W, H; S.render.resolution_percentage = 100
    S.view_settings.view_transform = "AgX"
    try: S.view_settings.look = "AgX - Punchy"
    except Exception: pass
    S.view_settings.exposure = 0.35
    S.render.image_settings.file_format = "PNG"; S.render.filepath = OUT
    vl = S.view_layers[0]; vl.use_pass_mist = True
    # freestyle ink lines, thin warm-brown, on silhouettes and creases
    S.render.use_freestyle = True; S.render.line_thickness_mode = "ABSOLUTE"; S.render.line_thickness = 1.3 * W / 1080
    fs = vl.freestyle_settings; ls = fs.linesets[0] if fs.linesets else fs.linesets.new("ink")
    ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
    ls.select_by_collection = True; ls.collection = coll("main"); ls.collection_negation = "INCLUSIVE"
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new("ink")
    ls.linestyle.color = (0.16, 0.1, 0.07); ls.linestyle.alpha = 0.75; fs.crease_angle = math.radians(120)
    comp()

def comp():
    if hasattr(S, "compositing_node_group"):
        ng = bpy.data.node_groups.new("comp", "CompositorNodeTree"); S.compositing_node_group = ng
        ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor"); out = ng.nodes.new("NodeGroupOutput"); oin = out.inputs[0]
    else:
        S.use_nodes = True; ng = S.node_tree; ng.nodes.clear(); out = ng.nodes.new("CompositorNodeComposite"); oin = out.inputs[0]
    L = ng.links; rl = ng.nodes.new("CompositorNodeRLayers")
    def mixc(fac, a, b):
        n = ng.nodes.new("ShaderNodeMix"); n.data_type = "RGBA"
        if isinstance(fac, float): n.inputs[0].default_value = fac
        else: L.new(fac, n.inputs[0])
        for sock, v in ((n.inputs[6], a), (n.inputs[7], b)):
            if isinstance(v, tuple): sock.default_value = v
            else: L.new(v, sock)
        return n.outputs[2]
    mm = ng.nodes.new("ShaderNodeMath"); mm.operation = "MULTIPLY"; L.new(rl.outputs["Mist"], mm.inputs[0]); mm.inputs[1].default_value = 0.18
    hz = mixc(mm.outputs[0], rl.outputs["Image"], (0.72, 0.8, 0.92, 1))
    kw = ng.nodes.new("CompositorNodeKuwahara"); kw.inputs["Size"].default_value = int(5 * W / 1080)
    try: kw.inputs["Type"].default_value = "Anisotropic"
    except Exception as e: print("kw type", e)
    kw.inputs["Sharpness"].default_value = 0.6; kw.inputs["Uniformity"].default_value = 4; kw.inputs["Eccentricity"].default_value = 1.0
    L.new(hz, kw.inputs[0])
    mx = mixc(0.7, hz, kw.outputs[0])
    gl = ng.nodes.new("CompositorNodeGlare")
    try: gl.inputs["Type"].default_value = "Bloom"
    except Exception as e: print("glare type", e)
    gl.inputs["Threshold"].default_value = 0.85; gl.inputs["Strength"].default_value = 0.35; gl.inputs["Size"].default_value = 0.6
    L.new(mx, gl.inputs[0])
    cc = ng.nodes.new("CompositorNodeHueSat"); cc.inputs["Saturation"].default_value = 1.12
    L.new(gl.outputs[0], cc.inputs["Image"]); L.new(cc.outputs[0], oin)

# ---------------------------------------------------------------- scenes
def hR(x, y): return max(0.0, (1 - min(1, max(0, (95 - y) / 70))) * 0 + max(0, y - 28) * 0.42 + 5 * math.sin(x * 0.03) * math.cos(y * 0.02) * min(1, max(0, (y - 28) / 30)))

def street_world(hillside=True, far=True):
    cobbles_road(-120, 140, -6, 6)
    boardwalk(-120, 140, 7.5, 3.0); boardwalk(-120, 140, -7.5, 3.0)
    ground = box(600, 600, 0.1, 0, 0, -0.06, M["soil"])
    specs = [("brick", "#9a4430", "OCCIDENTAL HOTEL"), ("wood", "#e8dcc0", None), ("brick", "#8a5a3a", "WELLS FARGO & CO."), ("wood", "#c8d0c0", None), ("brick", "#a85a40", "DAILY BULLETIN"), ("wood", "#e6cfa8", "NORTON & CO. RICE"), ("brick", "#7a3a2c", None), ("wood", "#d8c8d8", None)]
    x = -80; k = 0
    while x < 120:
        kd, col, sg = specs[k % len(specs)]; w = [8, 7, 9, 6.5, 8.5][k % 5]; h = [12, 10, 14, 9, 13][k % 5]
        building(x, w, 9.0, h, kd, col, face=+1, sign=sg, floors=3 if h > 10 else 2, seed=k)
        kd2, col2, sg2 = specs[(k + 3) % len(specs)]
        building(x, w, -9.0, h * 0.95, kd2, col2, face=-1, sign=sg2 if k % 2 else None, floors=3 if h > 10 else 2, seed=k + 50)
        x += w + 0.15; k += 1
    for xx in range(-70, 120, 16): lamp(xx, 6.4); lamp(xx + 8, -6.4)
    for xx in range(-75, 120, 30): pole(xx, -6.0)
    if hillside:
        hill_mesh(-300, 300, 20, 260, hR, 140)
        rr = random.Random(3); k = 0
        for row in range(10):
            y = 34 + row * 13
            for i in range(26):
                x = -150 + i * 11.5 + (row % 2) * 5 + rr.uniform(-1, 1)
                hill_house(x, y, hR(x, y), 1.0, k); k += 1
                if rr.random() < 0.35: tree(x + 6, y + 5, hR(x + 6, y + 5) - 0.5, 1.1, k)
    for i in range(6): cloud(-200 + i * 90, 600 + (i % 2) * 120, 160 + (i % 3) * 40, 70 + (i % 3) * 20, i)

def table_scene():
    tx, ty = 2.0, 5.0
    top = box(2.0, 1.1, 0.08, tx, ty, 0.95, wood("tab", "#5a3a22", 1.5), 0.02)
    for sx in (-0.9, 0.9):
        for sy in (-0.45, 0.45):
            cyl(0.045, 0.9, tx + sx, ty + sy, 0.47, wood("tab", "#5a3a22", 1.5), 12, r2=0.035); sphere(0.06, tx + sx, ty + sy, 0.72, wood("tab", "#5a3a22"), 2)
    o = box(2.18, 1.24, 0.3, tx, ty, 0.86, cloth("tcl", "#ece4d0"))
    t = bpy.data.textures.new("fold", "WOOD"); t.wood_type = "BANDNOISE"; t.noise_scale = 0.06; t.turbulence = 2
    md = o.modifiers.new("s", "SUBSURF"); md.levels = md.render_levels = 3; md.subdivision_type = "SIMPLE"
    dd = o.modifiers.new("f", "DISPLACE"); dd.texture = t; dd.strength = 0.025; dd.texture_coords = "GLOBAL"
    # props: oil lamp, papers, cup, fruit basket, quill
    cyl(0.09, 0.05, tx - 0.6, ty, 1.04, M["brass"], 24); cyl(0.07, 0.16, tx - 0.6, ty, 1.14, M["brass"], 24, r2=0.04)
    sphere(0.1, tx - 0.6, ty, 1.32, glass_win("lg"), 3); cyl(0.05, 0.12, tx - 0.6, ty, 1.46, glass_win("lg"), 16, r2=0.035)
    for k in range(4): box(0.42, 0.3, 0.004, tx + 0.1 + k * 0.03, ty - 0.05 + k * 0.02, 1.02 + k * 0.004, plain("pap", "#f2ead6", 0.8, 0, 30, 0.05), rot=(0, 0, k * 0.15))
    cyl(0.05, 0.09, tx + 0.55, ty + 0.25, 1.06, plain("cup", "#f4f0e8", 0.25), 24); bpy.ops.mesh.primitive_torus_add(major_radius=0.03, minor_radius=0.008, location=(tx + 0.61, ty + 0.25, 1.07), rotation=(math.pi / 2, 0, 0)); bpy.context.object.data.materials.append(plain("cup", "#f4f0e8")); link(bpy.context.object)
    bk = cyl(0.22, 0.14, tx + 0.5, ty - 0.2, 1.08, wood("wick", "#a8844a", 6), 24, r2=0.26)
    for k in range(7): a = k * 0.9; sphere(0.06, tx + 0.5 + math.cos(a) * 0.12, ty - 0.2 + math.sin(a) * 0.12, 1.18 + (k % 2) * 0.04, plain("apl", "#b82e22", 0.35), 3)
    # rice sacks beside
    for k, (sx, sy) in enumerate([(3.6, 5.6), (3.95, 5.2), (3.75, 5.4)]):
        o = sphere(0.35, tx + sx - 2, ty + sy - 5.4 + 0.3, 0.38 + (0.45 if k == 2 else 0), cloth("burl", "#b8a070"), 3); o.scale = (0.35, 0.28, 0.44); displace(o, 0.05, 0.15, k)

def bay_world():
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0)); o = bpy.context.object; link(o, "sea")
    oc = o.modifiers.new("ocean", "OCEAN"); oc.geometry_mode = "GENERATE"; oc.size = 1; oc.spatial_size = 50; oc.repeat_x = 6; oc.repeat_y = 8; oc.resolution = 8
    far = grid(-2000, 2000, 150, 3000, 1, 1, lambda x, y: -0.75, M["water"], c="sea")
    oc.wave_scale = 0.9; oc.choppiness = 1.1; oc.wind_velocity = 7; oc.wave_alignment = 0.3; oc.time = 3.0
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.modifier_apply(modifier="ocean")
    o.data.materials.clear(); o.data.materials.append(M["water"]); bpy.ops.object.shade_smooth()
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]; mnx = min(v.x for v in bb); mny = min(v.y for v in bb)
    o.location = (-60 - mnx, -200 - mny, -0.6)
    # wharf
    box(14, 60, 0.3, -6, 0, 1.2, M["plank"]);
    for k in range(-14, 15):
        for xx in (-12.5, -6, 0.6): cyl(0.22, 4, xx, k * 2.1, -0.6, M["hull"], 10)
    for k in range(-6, 7): cyl(0.22, 0.6, 0.4, k * 4.0, 1.65, M["iron"], 12);
    bpy.ops.mesh.primitive_torus_add(major_radius=0.35, minor_radius=0.08, location=(-1.2, -1.5, 1.45)); bpy.context.object.data.materials.append(M["rope"]); link(bpy.context.object)
    for k in range(4): cyl(0.32, 0.9, -3 - k * 0.7, -4 + (k % 2) * 0.7, 1.8, wood("barrel", "#6a4a2a", 2), 18)
    # tall ships
    for i, (sx, sy, rot) in enumerate([(14, -6, 0.15), (30, 28, -0.25), (60, -40, 0.4), (110, 30, 0.1)]):
        ship(sx, sy, rot, 1.0 if i < 2 else 1.2, i)
    # far shore hills
    hill_mesh(-400, 900, 500, 900, lambda x, y: max(0, 60 * math.sin(x * 0.006 + 1) * math.sin(y * 0.01) + 30 * math.sin(x * 0.02)), 100, plain("far", "#6a7a5a", 0.9, 0, 0.02, 0.2))
    for i in range(8): cloud(-200 + i * 150, 550 + (i % 3) * 140, 140 + (i % 3) * 50, 60 + (i % 4) * 22, i + 10)

def ship(x, y, rot, s, seed):
    g = []
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16, location=(x, y, 0.3)); h = bpy.context.object
    h.scale = (2.6 * s, 12 * s, 1.7 * s); bpy.ops.object.transform_apply(scale=True)
    bm = bmesh.new(); bm.from_mesh(h.data)
    for v in bm.verts:
        if v.co.z > 0.3 + 0.9 * s: v.co.z = 0.3 + 0.9 * s
    bm.to_mesh(h.data); h.data.materials.append(M["hull"]); link(h); bpy.ops.object.shade_smooth()
    box(5.0 * s, 20 * s, 0.25 * s, x, y, 0.3 + 0.95 * s, M["plank"]); box(5.3 * s, 22 * s, 0.35, x, y, 0.3 + 0.55 * s, plain("stripe", "#e8e0c8", 0.5))
    for k, (my, mh) in enumerate([(-6, 20), (0, 24), (6, 19)]):
        cyl(0.2 * s, mh * s, x, y + my * s, mh * s / 2, M["hull"], 10)
        for j in range(3):
            sw = (7 - j * 1.6) * s; sh = (4.2 - j * 0.6) * s; sz = (5 + j * 5.2) * s
            N = 10; vs = []; fs = []
            for j in range(N + 1):
                for i in range(N + 1):
                    u = i / N - 0.5; t = j / N
                    vs.append((x + u * sw * (1 - 0.12 * t), y + my * s + 0.9 * s * (1 - (2 * u) ** 2) * math.sin(math.pi * (0.2 + 0.8 * t)), sz + t * sh))
            fs = [(j * (N + 1) + i, j * (N + 1) + i + 1, (j + 1) * (N + 1) + i + 1, (j + 1) * (N + 1) + i) for j in range(N) for i in range(N)]
            mesh_obj("sail", vs, fs, M["sail"])
            cyl(0.07 * s, sw * 1.05, x, y + my * s, sz + sh, M["hull"], 6, rot=(0, math.pi / 2, math.pi / 2))
    for k in range(10):  # rigging
        a = Vector((x, y - 11 * s + k * 2.2 * s, 1.5 * s)); b = Vector((x, y + (-6 + (k // 4) * 6) * s, (18 - (k % 4) * 3) * s)); d = b - a
        o = cyl(0.025, d.length, *(a + d / 2), M["rope"], 4); o.rotation_euler = d.to_track_quat("Z", "Y").to_euler()

def capitol_world():
    hill_mesh(-200, 200, -200, 300, lambda x, y: max(0, (y - 120) * 0.25) + 2 * math.sin(x * 0.05) * math.sin(y * 0.04), 140)
    box(90, 20, 0.1, 0, 140, 0.05, M["path"])
    box(6, 140, 0.06, 0, 60, 0.04, M["path"])
    cx, cy = 0, 150
    box(70, 22, 14, cx, cy, 7, M["marble"], 0.05); box(30, 26, 18, cx, cy, 9, M["marble"], 0.05)
    for k in range(10): cyl(0.6, 13, cx - 11 + k * 2.45, cy - 13.4, 8.5, M["marble"], 16)
    box(26, 3, 1.4, cx, cy - 13.4, 15.7, M["marble"]);
    for k in range(18):
        for j in range(3): box(1.4, 0.2, 2.4, cx - 33 + k * 3.9, cy - 11.05, 3 + j * 4, M["glass"])
    cyl(9, 8, cx, cy, 22, M["marble"], 48);
    for k in range(28): a = k / 28 * 6.283; cyl(0.45, 7, cx + math.cos(a) * 9.6, cy + math.sin(a) * 9.6, 22, M["marble"], 10)
    cyl(8, 3, cx, cy, 27.5, M["marble"], 48)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=8, segments=48, ring_count=24, location=(cx, cy, 29)); d = bpy.context.object; d.scale = (1, 1, 1.15); d.data.materials.append(M["dome"]); link(d); bpy.ops.object.shade_smooth()
    cyl(1.4, 4, cx, cy, 40, M["marble"], 16); sphere(1.0, cx, cy, 42.5, M["dome"])
    rr = random.Random(5)
    for row, y in enumerate(range(10, 130, 14)):
        for side in (-1, 1):
            tree(side * (8 + rr.uniform(-0.5, 0.5)), y, 0, 1.25 + rr.uniform(-0.1, 0.15), row * 2 + (side > 0))
    for k in range(40): tree(rr.uniform(-160, 160), rr.uniform(170, 260), 0, rr.uniform(1.2, 1.8), 100 + k)
    for side in (-1, 1):
        for y in range(5, 130, 9): lamp(side * 4.5, y)
    for k in range(-6, 7):  # flower beds along the path
        for side in (-1, 1):
            for j in range(6): sphere(0.18, side * 3.6 + rr.uniform(-0.3, 0.3), 12 + k * 9 + j * 0.5, 0.15, plain("fl%d" % (j % 3), ["#d83a4a", "#f0c040", "#e8e0f0"][j % 3], 0.5), 2)
    for i in range(7): cloud(-260 + i * 90, 520 + (i % 2) * 120, 150 + (i % 3) * 40, 60 + (i % 3) * 22, i + 30)
    grass_hair()

def grass_hair():
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 6, 0.02)); g = bpy.context.object; g.scale = (60, 26, 1); bpy.ops.object.transform_apply(scale=True)
    g.data.materials.append(M["grass"]); link(g, "grass")
    ps = g.modifiers.new("hair", "PARTICLE_SYSTEM").particle_system.settings
    ps.type = "HAIR"; ps.count = 260000; ps.hair_length = 0.16; ps.use_advanced_hair = True; ps.child_type = "NONE"
    ps.root_radius = 0.6; ps.tip_radius = 0.0; ps.radius_scale = 0.012; ps.use_rotations = True; ps.rotation_factor_random = 0.3; ps.phase_factor_random = 1.0
    ps.brownian_factor = 0.02; ps.length_random = 0.6; ps.material_slot = g.material_slots[0].name

SHOTS = {
    "trees": lambda: (capitol_world(), camera((0, -6, 1.6), (0, 60, 6), 22, dof=(14, 6.0))),
    "table": lambda: (street_world(False), table_scene(), camera((5.2, 1.4, 1.6), (2.0, 5.5, 1.1), 30, dof=(5.0, 2.8))),
    "sky": lambda: (bay_world(), camera((4, -16, 1.6), (16, 30, 26), 20)),
    "water": lambda: (bay_world(), camera((1.5, -12, 3.2), (40, 40, -1.5), 22)),
    "road": lambda: (street_world(True), camera((60, 0.6, 1.0), (0, -0.4, 2.4), 24)),
    "street": lambda: (street_world(False), camera((8, -3.5, 1.7), (22, 9, 5.5), 22)),
    "hill": lambda: (street_world(True), camera((20, -4, 12), (24, 120, 34), 26)),
}
world(); SHOTS[SHOT](); render_setup()
bpy.ops.render.render(write_still=True)
print("RENDERED", OUT)
