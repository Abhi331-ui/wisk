# Bean-head cartoon character in a 3D scene (flat 2-tone toon shading + ink outlines), sitting on crates.
# Blender 3.6 - 4.x. Run: Scripting tab -> New -> paste -> Run Script.  Render engine: Eevee, 1080x1920 vertical.
# Everything is built from primitives: change the colours / sizes in CONFIG to make new characters.
import bpy, bmesh, math
from mathutils import Vector

CONFIG = dict(
    skin="#f6ead6", skin_shade="#d9c4a8",
    hair="#151017", ink="#241726",
    hat="#d9a63a", hat_shade="#a87a22", hat_band="#7a5418",
    shirt="#3f9c93", shirt_shade="#2c736d", collar="#c8402e",
    bread="#f1e0b8", crust="#c9944f", lettuce="#7cb342",
    wood="#c9a06a", wood_shade="#8a6238", stump="#b48552",
    wall="#6b4a2e", wall_glow="#e0a35a",
    outline=0.012,   # ink thickness in metres
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

# ---------------- materials ----------------
def toon(name, lit, shade, edge=0.45):
    """2-tone cel shader: Diffuse -> Shader to RGB -> constant ramp -> Emission (flat cartoon look)."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    dif = nt.nodes.new("ShaderNodeBsdfDiffuse")
    s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    ramp = nt.nodes.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].color = hex2rgb(shade); ramp.color_ramp.elements[1].position = edge
    ramp.color_ramp.elements[1].color = hex2rgb(lit)
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(dif.outputs[0], s2r.inputs[0]); nt.links.new(s2r.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], out.inputs[0])
    return m

def flat(name, col):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = hex2rgb(col)
    nt.links.new(em.outputs[0], nt.nodes.new("ShaderNodeOutputMaterial").inputs[0])
    return m

def striped(name, a, b, scale, kind="BANDS", direction="X"):
    """flat material with painted stripes (straw weave, planks) via a wave texture"""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    tc = nt.nodes.new("ShaderNodeTexCoord"); wv = nt.nodes.new("ShaderNodeTexWave")
    wv.wave_type = kind; wv.bands_direction = direction; wv.inputs["Scale"].default_value = scale
    wv.inputs["Distortion"].default_value = 1.5
    ramp = nt.nodes.new("ShaderNodeValToRGB"); ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].color = hex2rgb(b); ramp.color_ramp.elements[1].position = 0.18
    ramp.color_ramp.elements[1].color = hex2rgb(a)
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(tc.outputs["Object"], wv.inputs["Vector"]); nt.links.new(wv.outputs["Fac"], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], nt.nodes.new("ShaderNodeOutputMaterial").inputs[0])
    return m

C = CONFIG
INK = flat("ink", C["ink"]); INK.use_backface_culling = True
M = dict(
    skin=toon("skin", C["skin"], C["skin_shade"]), hair=flat("hair", C["hair"]),
    hat=striped("hat", C["hat"], C["hat_shade"], 9.0, "RINGS"), band=flat("band", C["hat_band"]),
    shirt=toon("shirt", C["shirt"], C["shirt_shade"]), collar=flat("collar", C["collar"]),
    white=flat("white", "#fbfaf6"), black=flat("black", "#0e0a10"),
    bread=toon("bread", C["bread"], C["crust"], 0.3), crust=flat("crust", C["crust"]), lettuce=flat("lettuce", C["lettuce"]),
    wood=striped("wood", C["wood"], C["wood_shade"], 3.0, "BANDS", "Z"), stump=toon("stump", C["stump"], C["wood_shade"]),
)

# ---------------- helpers ----------------
def finish(obj, mat, outline=True, smooth=True):
    obj.data.materials.append(mat)
    if smooth and hasattr(obj.data, "polygons"):
        for p in obj.data.polygons: p.use_smooth = True
    if outline:   # inverted hull: a slightly bigger back-face shell drawn in ink
        obj.data.materials.append(INK)
        s = obj.modifiers.new("ink", "SOLIDIFY")
        s.thickness = C["outline"]; s.offset = 1.0; s.use_flip_normals = True
        s.material_offset = len(obj.data.materials) - 1
    return obj

def sphere(name, loc, scale, mat, outline=True, seg=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, location=loc)
    o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat, outline)

def cyl(name, loc, r, depth, mat, rot=(0, 0, 0), r2=None, outline=True, verts=48):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    else: bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    return finish(o, mat, outline, smooth=False)

def box(name, loc, size, mat, bevel=0.0, outline=True):
    bpy.ops.mesh.primitive_cube_add(location=loc); o = bpy.context.object; o.name = name
    o.scale = [s / 2 for s in size]; bpy.ops.object.transform_apply(scale=True)
    if bevel: b = o.modifiers.new("bevel", "BEVEL"); b.width = bevel; b.segments = 3
    return finish(o, mat, outline, smooth=False)

def stick(name, pts, r=0.022, mat=None):
    """ink stick limb through points (a bevelled poly curve with round ends)"""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    cu.bevel_depth = r; cu.bevel_resolution = 4; cu.use_fill_caps = True
    sp = cu.splines.new("NURBS"); sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts): p.co = (*q, 1)
    sp.use_endpoint_u = True; sp.order_u = min(3, len(pts))
    o = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(o)
    cu.materials.append(mat or INK)
    return o

def cut_below(obj, z):
    """delete the part of a mesh below world height z (used for the hair cap)"""
    bm = bmesh.new(); bm.from_mesh(obj.data)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, z - obj.location.z), plane_no=(0, 0, 1), clear_inner=True)
    bm.to_mesh(obj.data); bm.free()

# ---------------- character ----------------
HX, HZ = 0.0, 2.25          # head centre
HW, HD, HH = 0.62, 0.40, 0.56  # head half width / depth / height (wide bean)
FY = -HD - 0.01             # face plane, just in front of the head

sphere("head", (HX, 0, HZ), (HW, HD, HH), M["skin"])
hair = sphere("hair", (HX, 0.02, HZ + 0.03), (HW * 1.04, HD * 1.05, HH * 1.03), M["hair"])
cut_below(hair, HZ + 0.12)
for k in range(7):  # jagged fringe under the hat
    x = -0.45 + k * 0.15
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.08, depth=0.16, location=(x, FY + 0.06, HZ + 0.09), rotation=(math.pi, 0, 0))
    finish(bpy.context.object, M["hair"], outline=False, smooth=False)

# straw hat: dome crown + wide brim + band, tilted a little
crown = cyl("hat_crown", (HX, 0.03, HZ + 0.52), 0.52, 0.34, M["hat"], r2=0.30)
brim = cyl("hat_brim", (HX, 0.03, HZ + 0.36), 0.78, 0.035, M["hat"])
band = cyl("hat_band", (HX, 0.03, HZ + 0.40), 0.515, 0.06, M["band"], outline=False)
for o in (crown, brim, band): o.rotation_euler = (math.radians(-6), math.radians(4), 0)

# big round eyes: white disc, thick ink ring, small pupil looking slightly up
for s in (-1, 1):
    ex, ez = HX + s * 0.20, HZ + 0.02
    cyl(f"eye_ring{s}", (ex, FY, ez), 0.135, 0.02, M["black"], rot=(math.pi / 2, 0, 0), outline=False)
    cyl(f"eye_white{s}", (ex, FY - 0.011, ez), 0.105, 0.02, M["white"], rot=(math.pi / 2, 0, 0), outline=False)
    cyl(f"pupil{s}", (ex + s * 0.01, FY - 0.022, ez + 0.01), 0.04, 0.02, M["black"], rot=(math.pi / 2, 0, 0), outline=False)
    stick(f"brow{s}", [(ex - 0.06, FY - 0.02, ez + 0.19), (ex, FY - 0.02, ez + 0.21), (ex + 0.06, FY - 0.02, ez + 0.19)], 0.012)

# wide toothy grin: dark mouth, white teeth strip with ink tooth gaps
box("mouth", (HX, FY - 0.005, HZ - 0.24), (0.34, 0.02, 0.12), M["black"], bevel=0.03, outline=False)
box("teeth", (HX, FY - 0.017, HZ - 0.215), (0.30, 0.01, 0.055), M["white"], bevel=0.008, outline=False)
for k in range(1, 6):
    box(f"gap{k}", (HX - 0.15 + k * 0.05, FY - 0.024, HZ - 0.215), (0.008, 0.005, 0.055), M["black"], outline=False)

# torso: teal shirt bean, red collar tips, buttons
TZ = 1.42
sphere("torso", (0, 0.05, TZ), (0.40, 0.27, 0.55), M["shirt"])
for s in (-1, 1):
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.09, depth=0.02, location=(s * 0.09, -0.24, TZ + 0.42),
                                    rotation=(math.pi / 2, 0, math.radians(180 + s * 25)))
    finish(bpy.context.object, M["collar"], outline=False, smooth=False)
for k in range(3):
    sphere(f"button{k}", (0, -0.27, TZ + 0.25 - k * 0.17), (0.022, 0.01, 0.022), M["black"], outline=False, seg=16)
stick("neck", [(0, 0, TZ + 0.5), (0, 0, HZ - 0.5)], 0.03)

# arms: left hand holds the sandwich at the chest, right arm rests on the knee
sh_l, sh_r = (-0.36, 0, TZ + 0.38), (0.36, 0, TZ + 0.38)
stick("arm_l", [sh_l, (-0.52, -0.05, TZ + 0.05), (-0.30, -0.30, TZ - 0.02), (-0.12, -0.36, TZ + 0.02)])
stick("arm_r", [sh_r, (0.50, -0.05, TZ + 0.0), (0.42, -0.25, TZ - 0.38), (0.30, -0.40, TZ - 0.52)])
for p in ((-0.12, -0.36, TZ + 0.02), (0.30, -0.40, TZ - 0.52)):
    sphere("hand", p, (0.045, 0.045, 0.045), INK, outline=False, seg=16)

# sandwich: a bread slice with a bite out of the top-right corner, lettuce peeking out
bread = box("bread", (-0.10, -0.39, TZ + 0.02), (0.30, 0.04, 0.30), M["bread"], bevel=0.04)
bite = sphere("bite", (0.03, -0.39, TZ + 0.17), (0.09, 0.1, 0.09), M["bread"], outline=False, seg=24)
mod = bread.modifiers.new("bite", "BOOLEAN"); mod.object = bite; mod.operation = "DIFFERENCE"
bread.modifiers.move(len(bread.modifiers) - 1, 0); bite.hide_render = bite.hide_viewport = True
box("lettuce", (-0.10, -0.37, TZ - 0.13), (0.30, 0.05, 0.04), M["lettuce"], bevel=0.015, outline=False)

# long bent stick legs: hips on the crate edge, knees forward, shins down to the stump
for s, foot in ((-1, (-0.30, -0.55, 0.22)), (1, (0.18, -0.62, 0.20))):
    hip = (s * 0.16, 0, TZ - 0.48)
    knee = (s * 0.22, -0.55, TZ - 0.42)
    stick(f"leg{s}", [hip, knee, (foot[0], foot[1] + 0.02, (knee[2] + foot[2]) / 2), foot])
    sphere(f"shoe{s}", (foot[0] + 0.05, foot[1] - 0.05, foot[2] - 0.03), (0.11, 0.07, 0.045), INK, outline=False, seg=24)

# ---------------- set ----------------
box("crate_top", (0, 0.25, 0.70), (1.3, 0.9, 0.55), M["wood"], bevel=0.01)
box("crate_low", (0.05, 0.28, 0.20), (1.5, 1.0, 0.45), M["wood"], bevel=0.01)
cyl("stump", (-0.05, -0.75, 0.08), 0.42, 0.16, M["stump"])

# warm rocky cave wall behind (noise texture between dark rock and glowing ore)
wall = bpy.data.materials.new("wall"); wall.use_nodes = True; nt = wall.node_tree; nt.nodes.clear()
nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.0; nz.inputs["Detail"].default_value = 8
rp = nt.nodes.new("ShaderNodeValToRGB"); rp.color_ramp.elements[0].color = hex2rgb(C["wall"])
rp.color_ramp.elements[0].position = 0.45; rp.color_ramp.elements[1].color = hex2rgb(C["wall_glow"])
em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Strength"].default_value = 0.9
nt.links.new(nz.outputs["Fac"], rp.inputs[0]); nt.links.new(rp.outputs[0], em.inputs[0])
nt.links.new(em.outputs[0], nt.nodes.new("ShaderNodeOutputMaterial").inputs[0])
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 2.2, 2.5), rotation=(math.pi / 2, 0, 0))
bpy.context.object.data.materials.append(wall)
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0)); bpy.context.object.data.materials.append(M["stump"])

# ---------------- light + camera ----------------
bpy.ops.object.light_add(type="SUN", location=(3, -4, 6))
sun = bpy.context.object; sun.data.energy = 3.0
sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(35))   # key from front-right -> shade on the left
scene.world = scene.world or bpy.data.worlds.new("World")
scene.world.use_nodes = True; scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.035, 0.03, 1)

bpy.ops.object.camera_add(location=(0.25, -6.2, 1.55))
cam = bpy.context.object; scene.camera = cam
cam.data.lens = 55
d = Vector((0, 0, 1.45)) - cam.location
cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
cam.data.dof.use_dof = True; cam.data.dof.focus_distance = 6.0; cam.data.dof.aperture_fstop = 2.0   # soft background

print("Bean character built. F12 to render.")
