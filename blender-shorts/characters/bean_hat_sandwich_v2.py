# Bean-head cartoon character v2 — closer to the target frame:
# woven dome hat (radial straw ribs), white oval head, mop hair with wavy fringe, ring eyes,
# wide curved toothy grin, red collar + buttons at the neck, big bitten sandwich with lettuce,
# slouched long ink legs to a ringed log stump, plank crates with stencil, rock wall with glowing gold cracks.
# Blender 3.6 - 4.x. Run: Scripting tab -> New -> paste -> Run Script. Eevee, 1080x1920.
import bpy, bmesh, math
from mathutils import Vector

C = dict(
    skin="#fbf4f0", skin_shade="#e6d6d0",
    hair="#2a1f24", ink="#2b1a22",
    hat="#d8a93c", hat_shade="#9c7323",
    shirt="#47b0a6", shirt_shade="#35897f", collar="#d23b2c", button="#f4f1ea",
    bread="#efe6d2", bread_dot="#d9cdb2", crust="#b9793b", lettuce="#79b83a", lettuce_shade="#4f8a22",
    plank="#ecd09a", plank_line="#a37b45", stencil="#7b2b1c",
    stump_top="#e2c08a", stump_ring="#a8814c", bark="#9a6c3e",
    rock="#8a6343", rock_dark="#3b2618", rock_light="#b88c5c", vein="#ffcf55",
    floor="#4e3524", wood_wall="#c58f4f",
    outline=0.024,
)

def hex2rgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]

# ---------------- clean scene ----------------
bpy.ops.object.select_all(action="SELECT"); bpy.ops.object.delete()
for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
    for b in list(coll): coll.remove(b)
scene = bpy.context.scene
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
    try: scene.render.engine = eng; break
    except TypeError: pass
scene.render.resolution_x, scene.render.resolution_y = 1080, 1920
scene.view_settings.view_transform = "Standard"
ee = scene.eevee
if hasattr(ee, "use_bloom"):
    ee.use_bloom = True; ee.bloom_intensity = 0.08; ee.bloom_threshold = 1.0; ee.bloom_radius = 4.0
if hasattr(ee, "taa_render_samples"): ee.taa_render_samples = 32

# ---------------- material helpers ----------------
def new_mat(name):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    return m, nt, nt.nodes.new("ShaderNodeOutputMaterial")

def lit_factor(nt):
    """Diffuse -> Shader to RGB -> BW: how lit the surface is (for 2-tone toon)."""
    dif = nt.nodes.new("ShaderNodeBsdfDiffuse"); s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(dif.outputs[0], s2r.inputs[0]); nt.links.new(s2r.outputs[0], bw.inputs[0])
    return bw.outputs[0]

def toon_from(nt, out, lit_col_socket, shade_mul=0.82, edge=0.22):
    """colour socket -> 2-tone cel (lit / shade = colour * shade_mul) -> emission"""
    f = lit_factor(nt)
    step = nt.nodes.new("ShaderNodeMath"); step.operation = "GREATER_THAN"; step.inputs[1].default_value = edge
    nt.links.new(f, step.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[3].default_value = shade_mul; mr.inputs[4].default_value = 1.0
    nt.links.new(step.outputs[0], mr.inputs[0])
    mul = nt.nodes.new("ShaderNodeVectorMath"); mul.operation = "SCALE"
    nt.links.new(lit_col_socket, mul.inputs[0]); nt.links.new(mr.outputs[0], mul.inputs[3])
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(mul.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
    return em

def rgb(nt, col):
    n = nt.nodes.new("ShaderNodeRGB"); n.outputs[0].default_value = hex2rgb(col); return n.outputs[0]

def toon(name, col, shade_mul=0.85, edge=0.22):
    m, nt, out = new_mat(name); toon_from(nt, out, rgb(nt, col), shade_mul, edge); return m

def flat(name, col, strength=1.0):
    m, nt, out = new_mat(name)
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = hex2rgb(col); em.inputs[1].default_value = strength
    nt.links.new(em.outputs[0], out.inputs[0]); return m

def two_col(nt, fac_socket, a, b, pos=0.5):
    """constant ramp: fac < pos -> a, else b"""
    r = nt.nodes.new("ShaderNodeValToRGB"); r.color_ramp.interpolation = "CONSTANT"
    r.color_ramp.elements[0].color = hex2rgb(a); r.color_ramp.elements[1].position = pos
    r.color_ramp.elements[1].color = hex2rgb(b)
    nt.links.new(fac_socket, r.inputs[0]); return r.outputs[0]

def obj_coords(nt):
    return nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]

def mat_hat():
    """radial straw ribs: angle around the hat axis -> stripes"""
    m, nt, out = new_mat("hat")
    g = nt.nodes.new("ShaderNodeTexGradient"); g.gradient_type = "RADIAL"
    nt.links.new(obj_coords(nt), g.inputs[0])
    mul = nt.nodes.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.inputs[1].default_value = 44
    fr = nt.nodes.new("ShaderNodeMath"); fr.operation = "FRACT"
    nt.links.new(g.outputs[1], mul.inputs[0]); nt.links.new(mul.outputs[0], fr.inputs[0])
    col = two_col(nt, fr.outputs[0], C["hat_shade"], C["hat"], 0.22)
    toon_from(nt, out, col, 0.82); return m

def mat_bread():
    m, nt, out = new_mat("bread")
    nz = nt.nodes.new("ShaderNodeTexVoronoi"); nz.inputs["Scale"].default_value = 60
    nt.links.new(obj_coords(nt), nz.inputs[0])
    col = two_col(nt, nz.outputs["Distance"], C["bread_dot"], C["bread"], 0.12)
    toon_from(nt, out, col, 0.9); return m

def mat_planks():
    m, nt, out = new_mat("planks")
    co = obj_coords(nt)
    wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "Z"
    wv.inputs["Scale"].default_value = 2.6; wv.inputs["Distortion"].default_value = 0.4
    nt.links.new(co, wv.inputs[0])
    lines = two_col(nt, wv.outputs["Fac"], C["plank_line"], C["plank"], 0.06)
    st = nt.nodes.new("ShaderNodeVectorMath"); st.operation = "MULTIPLY"; st.inputs[1].default_value = (0.25, 1.0, 9.0)
    nt.links.new(co, st.inputs[0])
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.0
    if "Detail" in nz.inputs: nz.inputs["Detail"].default_value = 3
    nt.links.new(st.outputs[0], nz.inputs[0])
    grain = two_col(nt, nz.outputs["Fac"], "#e9d3ac", "#ffffff", 0.36)
    mix = nt.nodes.new("ShaderNodeVectorMath"); mix.operation = "MULTIPLY"
    nt.links.new(lines, mix.inputs[0]); nt.links.new(grain, mix.inputs[1])
    toon_from(nt, out, mix.outputs[0], 0.78); return m

def mat_rings():
    m, nt, out = new_mat("stump_top")
    co = obj_coords(nt)
    vm = nt.nodes.new("ShaderNodeVectorMath"); vm.operation = "MULTIPLY"; vm.inputs[1].default_value = (1, 1, 0)
    nt.links.new(co, vm.inputs[0])
    wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "RINGS"; wv.rings_direction = "Z"
    wv.inputs["Scale"].default_value = 5.0; wv.inputs["Distortion"].default_value = 0.6
    nt.links.new(vm.outputs[0], wv.inputs[0])
    col = two_col(nt, wv.outputs["Fac"], C["stump_ring"], C["stump_top"], 0.12)
    toon_from(nt, out, col, 0.85); return m

def mat_rock():
    """rock wall: noise rock + dark crevices + glowing gold cracks (voronoi edges), veins mostly on the right"""
    m, nt, out = new_mat("rock")
    co0 = obj_coords(nt)
    dn = nt.nodes.new("ShaderNodeTexNoise"); dn.inputs["Scale"].default_value = 1.2
    if "Detail" in dn.inputs: dn.inputs["Detail"].default_value = 6
    nt.links.new(co0, dn.inputs[0])
    dsc = nt.nodes.new("ShaderNodeVectorMath"); dsc.operation = "SCALE"; dsc.inputs[3].default_value = 0.55
    nt.links.new(dn.outputs["Color"], dsc.inputs[0])
    add = nt.nodes.new("ShaderNodeVectorMath"); add.operation = "ADD"
    nt.links.new(co0, add.inputs[0]); nt.links.new(dsc.outputs[0], add.inputs[1])
    co = add.outputs[0]
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 2.2
    if "Detail" in nz.inputs: nz.inputs["Detail"].default_value = 8
    nt.links.new(co, nz.inputs[0])
    rr = nt.nodes.new("ShaderNodeValToRGB")
    e = rr.color_ramp.elements
    e[0].position = 0.35; e[0].color = hex2rgb(C["rock_dark"]); e[1].position = 0.7; e[1].color = hex2rgb(C["rock_light"])
    mid = e.new(0.52); mid.color = hex2rgb(C["rock"])
    nt.links.new(nz.outputs["Fac"], rr.inputs[0])
    def edges(scale, width):
        v = nt.nodes.new("ShaderNodeTexVoronoi"); v.feature = "DISTANCE_TO_EDGE"; v.inputs["Scale"].default_value = scale
        nt.links.new(co, v.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath"); lt.operation = "LESS_THAN"; lt.inputs[1].default_value = width
        nt.links.new(v.outputs["Distance"], lt.inputs[0]); return lt.outputs[0]
    crev = edges(1.1, 0.03)
    rock_mix = nt.nodes.new("ShaderNodeMix"); rock_mix.data_type = "RGBA"
    nt.links.new(crev, rock_mix.inputs[0]); nt.links.new(rr.outputs[0], rock_mix.inputs[6])
    rock_mix.inputs[7].default_value = hex2rgb(C["rock_dark"])
    # gold veins: thin edges of a second voronoi, masked to the right side
    vein = edges(0.9, 0.012)
    sep = nt.nodes.new("ShaderNodeSeparateXYZ"); nt.links.new(co, sep.inputs[0])
    side = nt.nodes.new("ShaderNodeMapRange"); side.inputs[1].default_value = 0.2; side.inputs[2].default_value = 1.4
    nt.links.new(sep.outputs[0], side.inputs[0])
    vm = nt.nodes.new("ShaderNodeMath"); vm.operation = "MULTIPLY"
    nt.links.new(vein, vm.inputs[0]); nt.links.new(side.outputs[0], vm.inputs[1])
    em_rock = nt.nodes.new("ShaderNodeEmission"); nt.links.new(rock_mix.outputs[2], em_rock.inputs[0])
    em_vein = nt.nodes.new("ShaderNodeEmission"); em_vein.inputs[0].default_value = hex2rgb(C["vein"]); em_vein.inputs[1].default_value = 4.0
    mixs = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(vm.outputs[0], mixs.inputs[0]); nt.links.new(em_rock.outputs[0], mixs.inputs[1]); nt.links.new(em_vein.outputs[0], mixs.inputs[2])
    nt.links.new(mixs.outputs[0], out.inputs[0]); return m

def mat_wood_wall():
    m, nt, out = new_mat("wood_wall")
    wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "X"
    wv.inputs["Scale"].default_value = 3.0; wv.inputs["Distortion"].default_value = 2.0
    nt.links.new(obj_coords(nt), wv.inputs[0])
    col = two_col(nt, wv.outputs["Fac"], "#8d5c2c", C["wood_wall"], 0.1)
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs[1].default_value = 1.1
    nt.links.new(col, em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0]); return m

INK = flat("ink", C["ink"]); INK.use_backface_culling = True
M = dict(
    skin=toon("skin", C["skin"], 0.92, 0.15), hair=toon("hair", C["hair"], 0.8), hat=mat_hat(),
    shirt=toon("shirt", C["shirt"], 0.82), collar=flat("collar", C["collar"]), button=flat("button", C["button"]),
    white=flat("white", "#ffffff"), black=flat("black", "#1a0f14"), mouth=flat("mouth", "#3a1418"),
    bread=mat_bread(), crust=toon("crust", C["crust"], 0.85), lettuce=toon("lettuce", C["lettuce"], 0.7),
    planks=mat_planks(), stencil=flat("stencil", C["stencil"]), rings=mat_rings(), bark=toon("bark", C["bark"], 0.75),
    rock=mat_rock(), floor=toon("floor", C["floor"], 0.8), wood_wall=mat_wood_wall(),
)

# ---------------- geometry helpers ----------------
def finish(obj, mat, outline=C["outline"], smooth=True):
    obj.data.materials.append(mat)
    if smooth and hasattr(obj.data, "polygons"):
        for p in obj.data.polygons: p.use_smooth = True
    if outline:   # inverted hull ink outline
        obj.data.materials.append(INK)
        s = obj.modifiers.new("ink", "SOLIDIFY")
        s.thickness = outline; s.offset = 1.0; s.use_flip_normals = True
        s.material_offset = len(obj.data.materials) - 1
    return obj

def sphere(name, loc, scale, mat, outline=C["outline"], seg=64, squircle=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=loc)
    o = bpy.context.object; o.name = name
    if squircle:  # push towards a rounded box
        for v in o.data.vertices:
            v.co = Vector([math.copysign(abs(c) ** squircle, c) for c in v.co])
    o.scale = scale; bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat, outline)

def cyl(name, loc, r, depth, mat, rot=(0, 0, 0), r2=None, outline=C["outline"], verts=64):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    return finish(o, mat, outline, smooth=False)

def box(name, loc, size, mat, bevel=0.0, outline=C["outline"]):
    bpy.ops.mesh.primitive_cube_add(location=loc); o = bpy.context.object; o.name = name
    o.scale = [s / 2 for s in size]; bpy.ops.object.transform_apply(scale=True)
    if bevel: b = o.modifiers.new("bevel", "BEVEL"); b.width = bevel; b.segments = 4
    return finish(o, mat, outline, smooth=False)

def stick(name, pts, r=0.036, mat=None):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    cu.bevel_depth = r; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts): p.co = (*q, 1)
    sp.use_endpoint_u = True; sp.order_u = min(3, len(pts))
    o = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(o)
    cu.materials.append(mat or INK); return o

def cut_below(obj, z):
    bm = bmesh.new(); bm.from_mesh(obj.data)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
                           plane_co=(0, 0, z - obj.location.z), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(obj.data); bm.free()

# ---------------- head ----------------
HX, HZ = 0.0, 2.28
HW, HD, HH = 0.60, 0.42, 0.44       # wide oval head
def face_y(x, z, lift):
    """y on the front of the head ellipsoid at (x, z), lifted toward the camera"""
    k = 1 - ((x - HX) / HW) ** 2 - ((z - HZ) / HH) ** 2
    return -HD * math.sqrt(max(k, 0.0)) - lift

def face_poly(name, pts2d, mat, lift):
    """flat shape drawn on the face: 2D (x, z) points wrapped onto the head surface"""
    me = bpy.data.meshes.new(name)
    verts = [(x, face_y(x, z, lift), z) for x, z in pts2d]
    cx = sum(p[0] for p in pts2d) / len(pts2d); cz = sum(p[1] for p in pts2d) / len(pts2d)
    verts.append((cx, face_y(cx, cz, lift), cz))
    n = len(pts2d); faces = [(i, (i + 1) % n, n) for i in range(n)]
    me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    me.materials.append(mat); return o

def circle(cx, cz, r, n=40):
    return [(cx + r * math.cos(2 * math.pi * i / n), cz + r * math.sin(2 * math.pi * i / n)) for i in range(n)]

sphere("head", (HX, 0, HZ), (HW, HD, HH), M["skin"], outline=0.03)

# mop hair: cap + wavy fringe bumps + side tufts
hair = sphere("hair", (HX, 0.03, HZ + 0.02), (HW * 1.035, HD * 1.07, HH * 1.06), M["hair"], outline=0.026)
cut_below(hair, HZ + 0.2)
for k in range(9):
    x = -0.46 + k * 0.115
    z = HZ + 0.2 + (0.012 if k % 2 else -0.01)
    sphere(f"fringe{k}", (x, face_y(x, z, -0.03), z), (0.075, 0.06, 0.06), M["hair"], outline=0.02, seg=24)
for s in (-1, 1):
    sphere(f"sidehair{s}", (s * 0.56, 0.05, HZ + 0.12), (0.09, 0.26, 0.14), M["hair"], outline=0.022, seg=24)

# woven dome hat with rolled brim
crown = cyl("hat_crown", (HX, 0.03, HZ + 0.6), 0.6, 0.38, M["hat"], r2=0.16, outline=0.026)
sphere("hat_top", (HX, 0.03, HZ + 0.79), (0.17, 0.17, 0.06), M["hat"], outline=0.02, seg=32)
bpy.ops.mesh.primitive_torus_add(major_radius=0.6, minor_radius=0.05, location=(HX, 0.03, HZ + 0.42))
finish(bpy.context.object, M["hat"], outline=0.022)

# ring eyes (thick ink ring, white, pupil)
for s in (-1, 1):
    ex, ez = HX + s * 0.17, HZ + 0.06
    face_poly(f"eye_ring{s}", circle(ex, ez, 0.105), M["black"], 0.004)
    face_poly(f"eye_white{s}", circle(ex, ez, 0.078), M["white"], 0.008)
    face_poly(f"pupil{s}", circle(ex + s * 0.008, ez + 0.004, 0.027, 20), M["black"], 0.012)

# wide curved grin: lens-shaped mouth, upper teeth row with gaps, ink rim
def mouth_pts(w, top, bot, cz, n=24, pad=0.0):
    pts = []
    for i in range(n + 1):
        t = -1 + 2 * i / n
        pts.append(((w + pad) * t, cz + top + 0.02 * t * t + pad))
    for i in range(n, -1, -1):
        t = -1 + 2 * i / n
        pts.append(((w + pad) * t, cz + bot + (top + 0.02 - bot) * t * t - pad))
    return pts
MZ = HZ - 0.16
face_poly("mouth_rim", mouth_pts(0.205, 0.035, -0.06, MZ, pad=0.016), M["black"], 0.004)
face_poly("mouth", mouth_pts(0.205, 0.035, -0.06, MZ), M["mouth"], 0.008)
teeth = [(x, MZ + 0.03 + 0.02 * (x / 0.18) ** 2) for x in [i * 0.18 / 12 for i in range(-12, 13)]]
teeth += [(x, z - 0.04) for x, z in reversed(teeth)]
face_poly("teeth", teeth, M["white"], 0.012)
for k in range(-4, 5):
    x = k * 0.036
    zt = MZ + 0.03 + 0.02 * (x / 0.18) ** 2
    face_poly(f"gap{k}", [(x - 0.004, zt - 0.04), (x + 0.004, zt - 0.04), (x + 0.004, zt + 0.002), (x - 0.004, zt + 0.002)], M["mouth"], 0.016)

# ---------------- body ----------------
TZ = 1.46
sphere("torso", (0, 0.06, TZ), (0.52, 0.36, 0.6), M["shirt"], outline=0.028, squircle=0.72)
# red collar V + white buttons right under the chin
for s in (-1, 1):
    me = bpy.data.meshes.new(f"collar{s}")
    me.from_pydata([(0, -0.335, TZ + 0.34), (s * 0.12, -0.33, TZ + 0.44), (s * 0.02, -0.335, TZ + 0.46)], [], [(0, 1, 2)])
    o = bpy.data.objects.new(f"collar{s}", me); bpy.context.collection.objects.link(o); me.materials.append(M["collar"])
for k in range(2):
    sphere(f"button{k}", (0, -0.33, TZ + 0.24 - k * 0.13), (0.022, 0.012, 0.022), M["button"], outline=0.008, seg=16)
stick("placket", [(0, -0.33, TZ + 0.34), (0, -0.33, TZ + 0.08)], 0.006)

# arms: right (screen-left) holds sandwich at the belly, left hangs down to the crate
stick("arm_r", [(-0.44, -0.08, TZ + 0.38), (-0.66, -0.2, TZ - 0.05), (-0.42, -0.42, TZ - 0.2), (-0.2, -0.46, TZ - 0.17)])
stick("arm_l", [(0.44, -0.08, TZ + 0.38), (0.6, -0.18, TZ - 0.05), (0.62, -0.28, TZ - 0.42), (0.5, -0.36, TZ - 0.6)])
for p in ((-0.2, -0.46, TZ - 0.17), (0.5, -0.36, TZ - 0.6)):
    sphere("hand", p, (0.055, 0.055, 0.055), INK, outline=0, seg=16)

# big bitten sandwich: crust slab + bread face (bite cut from both), lettuce peeking out the sides
SX, SZ = -0.12, TZ - 0.14
bite = sphere("bite", (SX + 0.03, -0.5, SZ + 0.22), (0.11, 0.2, 0.08), M["bread"], outline=0, seg=24)
for nm, sz, y, mat, ol in (("crust", (0.42, 0.04, 0.44), -0.47, M["crust"], 0.012), ("bread", (0.37, 0.03, 0.39), -0.5, M["bread"], 0)):
    b = box(nm, (SX, y, SZ), sz, mat, bevel=0.05, outline=ol)
    mod = b.modifiers.new("bite", "BOOLEAN"); mod.object = bite; mod.operation = "DIFFERENCE"
    b.modifiers.move(len(b.modifiers) - 1, 0)
bite.hide_render = bite.hide_viewport = True
LET2 = toon("lettuce2", C["lettuce_shade"], 0.8)
for i, (x, z) in enumerate(((-0.33, SZ + 0.08), (-0.35, SZ - 0.02), (-0.33, SZ - 0.12), (0.09, SZ - 0.04), (0.08, SZ - 0.15))):
    sphere("lettuce", (x, -0.45, z), (0.05, 0.025, 0.055), M["lettuce"] if i % 2 == 0 else LET2, outline=0.01, seg=20)

# long slouched ink legs: one stretched to the floor, one bent onto the stump
HIPZ = 0.98
stick("leg_r", [(-0.18, -0.1, HIPZ), (-0.28, -0.45, HIPZ - 0.15), (-0.4, -0.72, 0.4), (-0.46, -0.8, 0.06)], 0.04)
stick("leg_l", [(0.18, -0.1, HIPZ), (0.52, -0.5, HIPZ - 0.08), (0.5, -0.85, 0.55), (0.36, -1.15, 0.3)], 0.04)
sphere("shoe_r", (-0.5, -0.86, 0.05), (0.1, 0.07, 0.045), INK, outline=0, seg=24)
sphere("shoe_l", (0.34, -1.22, 0.3), (0.1, 0.07, 0.045), INK, outline=0, seg=24)

# ---------------- set ----------------
box("crate_top", (0.0, 0.32, 0.72), (1.45, 0.9, 0.52), M["planks"], bevel=0.015, outline=0.016)
box("crate_low", (0.06, 0.36, 0.24), (1.6, 1.0, 0.48), M["planks"], bevel=0.015, outline=0.016)
for nm, body, z, sz in (("stencil1", "HILLSIDE PRODUCE CO.", 0.8, 0.075), ("stencil2", "40 lb", 0.69, 0.06)):
    cu = bpy.data.curves.new(nm, "FONT"); cu.body = body; cu.size = sz; cu.align_x = "CENTER"
    t = bpy.data.objects.new(nm, cu); bpy.context.collection.objects.link(t)
    t.location = (-0.15, 0.32 - 0.45 - 0.003, z); t.rotation_euler = (math.radians(90), 0, 0); cu.materials.append(M["stencil"])
cyl("stump", (0.22, -1.25, 0.13), 0.36, 0.26, M["bark"], outline=0.02)
cyl("stump_top", (0.22, -1.25, 0.265), 0.355, 0.012, M["rings"], outline=0)
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0)); bpy.context.object.data.materials.append(M["floor"])

# rock wall behind with glowing veins, wooden panel on the left edge
bpy.ops.mesh.primitive_plane_add(size=1, location=(0.3, 1.6, 2.2), rotation=(math.pi / 2, 0, 0))
w = bpy.context.object; w.scale = (5, 5, 1); bpy.ops.object.transform_apply(scale=True); w.data.materials.append(M["rock"])
box("wood_panel", (-1.15, 1.0, 2.2), (0.9, 0.1, 4.4), M["wood_wall"], outline=0)

# ---------------- light + camera ----------------
bpy.ops.object.light_add(type="SUN", location=(2, -4, 6))
sun = bpy.context.object; sun.data.energy = 3.0
sun.rotation_euler = (math.radians(55), 0, math.radians(-25))   # key from front-left, character evenly lit
bpy.ops.object.light_add(type="POINT", location=(1.0, 0.8, 2.0))
glow = bpy.context.object; glow.data.energy = 120; glow.data.color = (1.0, 0.75, 0.35)
scene.world = scene.world or bpy.data.worlds.new("World")
scene.world.use_nodes = True; scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.06, 0.04, 0.03, 1)

bpy.ops.object.camera_add(location=(0.12, -5.0, 1.55))
cam = bpy.context.object; scene.camera = cam
cam.data.lens = 50; cam.data.sensor_fit = "VERTICAL"; cam.data.sensor_height = 36
d = Vector((0.05, 0, 1.4)) - cam.location
cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
cam.data.dof.use_dof = True; cam.data.dof.focus_distance = 5.0; cam.data.dof.aperture_fstop = 2.8

print("Bean character v2 built. F12 to render.")
