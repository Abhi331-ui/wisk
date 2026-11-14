"""Reusable Blender kit for toon-style vertical shorts.

Import from a scene script run with:  blender -b -P scene.py
Provides: toon materials with hard-edged shading, inverted-hull outlines,
simple stick/bean characters, office props, camera helpers.
"""
import bpy, math
from mathutils import Vector

FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"

# ---------------------------------------------------------------- scene setup
def reset(fps=30, frames=300, res=(1080, 1920)):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = "BLENDER_EEVEE"
    s.render.fps = fps
    s.frame_start, s.frame_end = 1, frames
    s.render.resolution_x, s.render.resolution_y = res
    s.render.resolution_percentage = 100
    s.view_settings.view_transform = "Standard"
    s.view_settings.look = "Medium High Contrast"
    e = s.eevee
    e.taa_render_samples = 16
    e.use_bloom = True
    e.bloom_intensity = 0.04
    e.bloom_threshold = 1.2
    e.use_soft_shadows = True
    e.shadow_cube_size = "1024"
    e.shadow_cascade_size = "2048"
    e.use_gtao = True
    e.gtao_distance = 0.6
    w = bpy.data.worlds.new("World")
    s.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.8, 0.95, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    return s

# ---------------------------------------------------------------- materials
_mats = {}

def lin(c):
    """sRGB picker values -> linear so colours render as chosen."""
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def tint_group():
    """Shared RGB multiplier for all toon materials. Animate with set_tint()."""
    g = bpy.data.node_groups.get("GLOBAL_TINT")
    if g:
        return g
    g = bpy.data.node_groups.new("GLOBAL_TINT", "ShaderNodeTree")
    g.interface.new_socket("Color", in_out="OUTPUT", socket_type="NodeSocketColor")
    rgb = g.nodes.new("ShaderNodeRGB"); rgb.name = "TINT"
    rgb.outputs[0].default_value = (1, 1, 1, 1)
    out = g.nodes.new("NodeGroupOutput")
    g.links.new(rgb.outputs[0], out.inputs[0])
    return g

def set_tint(frame, color):
    sock = tint_group().nodes["TINT"].outputs[0]
    sock.default_value = (*lin(color), 1)
    sock.keyframe_insert("default_value", frame=frame)

def toon(name, color, shade=0.62, mid=0.82, tex=None):
    """Flat cel material: diffuse lighting quantised to 3 hard bands."""
    key = name
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    dif = nt.nodes.new("ShaderNodeBsdfDiffuse")
    s2r = nt.nodes.new("ShaderNodeShaderToRGB")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    el = ramp.color_ramp.elements
    el[0].position = 0.0; el[0].color = (shade, shade, shade, 1)
    el[1].position = 0.08; el[1].color = (mid, mid, mid, 1)
    e3 = el.new(0.35); e3.color = (1, 1, 1, 1)
    e4 = el.new(1.6); e4.color = (1.25, 1.2, 1.1, 1)
    mul = nt.nodes.new("ShaderNodeMix")
    mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"
    mul.inputs[0].default_value = 1.0
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(dif.outputs[0], s2r.inputs[0])
    nt.links.new(s2r.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], mul.inputs[6])
    if tex is not None:
        nt.links.new(tex(nt), mul.inputs[7])
    else:
        mul.inputs[7].default_value = (*lin(color), 1)
    tg = nt.nodes.new("ShaderNodeGroup"); tg.node_tree = tint_group()
    mul2 = nt.nodes.new("ShaderNodeMix")
    mul2.data_type = "RGBA"; mul2.blend_type = "MULTIPLY"; mul2.inputs[0].default_value = 1.0
    nt.links.new(mul.outputs[2], mul2.inputs[6])
    nt.links.new(tg.outputs[0], mul2.inputs[7])
    nt.links.new(mul2.outputs[2], em.inputs[0])
    nt.links.new(em.outputs[0], out.inputs[0])
    _mats[key] = m
    return m

def flat(name, color, strength=1.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes
    n.clear()
    out = n.new("ShaderNodeOutputMaterial")
    em = n.new("ShaderNodeEmission")
    em.inputs[0].default_value = (*lin(color), 1)
    em.inputs[1].default_value = strength
    m.node_tree.links.new(em.outputs[0], out.inputs[0])
    _mats[name] = m
    return m

def outline_mat():
    if "OUTLINE" in _mats:
        return _mats["OUTLINE"]
    m = flat("OUTLINE", (0.02, 0.02, 0.03))
    m.use_backface_culling = True
    return m

def _plane_coords(nt, plane):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    com = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    a, b = {"xy": (0, 1), "xz": (0, 2), "yz": (1, 2)}[plane]
    nt.links.new(sep.outputs[a], com.inputs[0])
    nt.links.new(sep.outputs[b], com.inputs[1])
    return com

def tiles_tex(color, mortar, scale=6.0, w=0.5, h=0.25, plane="xz"):
    color, mortar = lin(color), lin(mortar)
    def build(nt):
        tc = _plane_coords(nt, plane)
        b = nt.nodes.new("ShaderNodeTexBrick")
        b.inputs["Color1"].default_value = (*color, 1)
        b.inputs["Color2"].default_value = (*[c * 0.93 for c in color], 1)
        b.inputs["Mortar"].default_value = (*mortar, 1)
        b.inputs["Scale"].default_value = scale
        b.inputs["Mortar Size"].default_value = 0.012
        b.inputs["Brick Width"].default_value = w
        b.inputs["Row Height"].default_value = h
        b.offset = 0.5
        nt.links.new(tc.outputs[0], b.inputs[0])
        return b.outputs[0]
    return build

def checker_tex(c1, c2, scale=4.0, plane="xy"):
    c1, c2 = lin(c1), lin(c2)
    def build(nt):
        tc = _plane_coords(nt, plane)
        ch = nt.nodes.new("ShaderNodeTexChecker")
        ch.inputs[1].default_value = (*c1, 1)
        ch.inputs[2].default_value = (*c2, 1)
        ch.inputs[3].default_value = scale
        nt.links.new(tc.outputs[0], ch.inputs[0])
        return ch.outputs[0]
    return build

# ---------------------------------------------------------------- geometry
def _finish(o, mat, outline, parent=None, smooth=True):
    o.data.materials.append(mat)
    if smooth and hasattr(o.data, "polygons"):
        for p in o.data.polygons:
            p.use_smooth = smooth
    if outline:
        o.data.materials.append(outline_mat())
        mod = o.modifiers.new("outline", "SOLIDIFY")
        mod.thickness = -outline
        mod.use_flip_normals = True
        mod.material_offset = 1
        mod.use_rim = False
        mod.offset = 1
    if parent:
        o.parent = parent
    return o

def box(name, size, loc, mat, outline=0.012, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, mat, outline, parent, smooth=False)

def ball(name, scale, loc, mat, outline=0.012, parent=None, seg=48):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return _finish(o, mat, outline, parent)

def cyl(name, r, depth, loc, mat, outline=0.0, parent=None, rot=(0, 0, 0), verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object
    o.name = name
    return _finish(o, mat, outline, parent, smooth=True)

def stroke(name, pts, mat, width=0.012, parent=None):
    """Black ink line through 3D points (limbs, brows, mouths)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = width
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (*c, 1)
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o

def arc(cx, cz, r, a0, a1, y, n=12):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / (n - 1)), y,
             cz + r * math.sin(a0 + (a1 - a0) * i / (n - 1))) for i in range(n)]

def text(name, body, loc, size, mat, rot=(math.radians(90), 0, 0), parent=None, align="CENTER"):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    try:
        cu.font = bpy.data.fonts.load(FONT_BOLD, check_existing=True)
    except Exception:
        pass
    o = bpy.data.objects.new(name, cu)
    o.location = loc
    o.rotation_euler = rot
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o

def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    bpy.context.collection.objects.link(o)
    if parent:
        o.parent = parent
    return o

# ---------------------------------------------------------------- character
def ink():
    return flat("INK", (0.02, 0.02, 0.03))

FACE_EYES = ("open", "tired", "happy", "shut")
FACE_MOUTHS = ("smile", "flat", "frown", "open", "grin")

def person(name, loc=(0, 0, 0), rot_z=0.0, skin=(0.99, 0.95, 0.87), shirt=(0.3, 0.6, 0.95),
           hair=(0.05, 0.05, 0.07), hair_style="bowl", tie=None, badge=False, seated=False,
           cap=None, sunglasses=False, glasses=False, blush=False, pants=None, ol=0.016,
           eyes="open", mouth="flat", brows="neutral", scale=1.0, face=None):
    """Bean body + big round head + ink stick limbs. Faces -Y in local space.
    Every face part exists; switch with set_face(h, frame, ...)."""
    if face == "happy":
        eyes, mouth = "happy", "smile"
    elif face == "worried":
        mouth, brows = "frown", "worried"
    root = empty(name, loc)
    root.scale = (scale, scale, scale)
    k = ink()
    hz = 1.62 if not seated else 1.5
    bz = 0.98 if not seated else 0.86
    torso = empty(name + "_torso", (0, 0, 0), root)
    ball(name + "_body", (0.24, 0.2, 0.42), (0, 0, bz), toon(name + "_shirt", shirt), ol, torso)
    if pants:
        ball(name + "_hips", (0.235, 0.195, 0.16), (0, 0, bz - 0.27), toon(name + "_pants", pants), ol, torso)
    if tie:
        box(name + "_tie", (0.05, 0.02, 0.36), (0, -0.2, bz + 0.05), toon(name + "_tiec", tie), 0.006, torso)
        for sx in (-1, 1):
            box(f"{name}_collar{sx}", (0.09, 0.02, 0.05), (sx * 0.06, -0.19, bz + 0.33), toon("white", (0.97, 0.97, 0.97)), 0.004, torso, rot=(0, sx * 0.6, 0))
    if badge:
        box(name + "_badge", (0.08, 0.02, 0.1), (0.1, -0.2, bz - 0.05), toon("white", (0.97, 0.97, 0.97)), 0.005, torso)
        stroke(name + "_lanyard", [(0.0, -0.18, bz + 0.33), (0.1, -0.205, bz - 0.0)], flat("lanyard", (0.2, 0.35, 0.8)), 0.006, torso)
    head = empty(name + "_head", (0, 0, hz - 0.12), torso)
    ball(name + "_skull", (0.34, 0.31, 0.32), (0, 0, 0.12), toon(name + "_skin", skin, shade=0.74, mid=0.88), ol * 1.1, head)
    hm = toon(name + "_hair", hair, shade=0.7)
    if cap:
        cm = toon(name + "_cap", cap)
        ball(name + "_capdome", (0.355, 0.335, 0.22), (0, 0.01, 0.25), cm, ol, head)
        ball(name + "_capbrim", (0.22, 0.17, 0.025), (0, -0.31, 0.25), cm, ol * 0.7, head)
        ball(name + "_hairside", (0.35, 0.3, 0.12), (0, 0.04, 0.17), hm, 0, head)
    elif hair_style == "bowl":
        ball(name + "_hairc", (0.355, 0.33, 0.24), (0, 0.03, 0.24), hm, ol, head)
    elif hair_style == "side":
        ball(name + "_hairc", (0.355, 0.33, 0.22), (0.03, 0.04, 0.27), hm, ol, head)
    elif hair_style == "grey":
        ball(name + "_hairc", (0.35, 0.33, 0.2), (0, 0.06, 0.28), hm, ol, head)
    elif hair_style == "bun":
        ball(name + "_hairc", (0.355, 0.33, 0.24), (0, 0.04, 0.24), hm, ol, head)
        ball(name + "_bun", (0.12, 0.12, 0.12), (0, 0.18, 0.42), hm, ol, head)
    elif hair_style == "long":
        ball(name + "_hairc", (0.36, 0.34, 0.25), (0, 0.04, 0.23), hm, ol, head)
        ball(name + "_hairback", (0.33, 0.2, 0.36), (0, 0.13, 0.0), hm, ol, head)
    fy = -0.305
    F = {"eyes": {}, "mouth": {}, "brows": {}}
    white = flat("eyehl", (1, 1, 1))
    grp = []
    for sx in (-1, 1):
        e = ball(f"{name}_eyeO{sx}", (0.032, 0.02, 0.048), (sx * 0.1, fy + 0.004, 0.15), k, 0, head, seg=16)
        ball(f"{name}_eyeHL{sx}", (0.009, 0.006, 0.012), (0.01, -0.017, 0.016), white, 0, e, seg=8)
        grp.append(e)
    F["eyes"]["open"] = grp
    grp = []
    for sx in (-1, 1):
        e = ball(f"{name}_eyeT{sx}", (0.032, 0.02, 0.022), (sx * 0.1, fy + 0.004, 0.13), k, 0, head, seg=16)
        lid = stroke(f"{name}_lid{sx}", [(sx * 0.06, fy - 0.006, 0.148), (sx * 0.14, fy + 0.004, 0.148)], k, 0.008, head)
        grp += [e, lid]
    F["eyes"]["tired"] = grp
    F["eyes"]["happy"] = [stroke(f"{name}_eyeH{sx}", arc(sx * 0.1, 0.12, 0.045, math.radians(20), math.radians(160), fy - 0.01), k, 0.011, head) for sx in (-1, 1)]
    F["eyes"]["shut"] = [stroke(f"{name}_eyeS{sx}", arc(sx * 0.1, 0.18, 0.045, math.radians(200), math.radians(340), fy - 0.01), k, 0.011, head) for sx in (-1, 1)]
    F["mouth"]["smile"] = [stroke(name + "_m_smile", arc(0, 0.06, 0.08, math.radians(205), math.radians(335), fy - 0.006), k, 0.01, head)]
    F["mouth"]["flat"] = [stroke(name + "_m_flat", [(-0.045, fy - 0.01, 0.0), (0.045, fy - 0.01, 0.0)], k, 0.01, head)]
    F["mouth"]["frown"] = [stroke(name + "_m_frown", arc(0, -0.07, 0.065, math.radians(35), math.radians(145), fy - 0.006), k, 0.01, head)]
    F["mouth"]["open"] = [ball(name + "_m_open", (0.05, 0.02, 0.07), (0, fy + 0.006, -0.02), flat("mouthin", (0.45, 0.08, 0.1)), 0.007, head, seg=16)]
    gr = ball(name + "_m_grin", (0.1, 0.02, 0.05), (0, fy + 0.012, 0.0), flat("mouthin", (0.45, 0.08, 0.1)), 0.007, head, seg=24)
    box(name + "_m_teeth", (0.12, 0.03, 0.03), (0, fy + 0.0, 0.025), flat("teeth", (1, 1, 1)), 0, head)
    F["mouth"]["grin"] = [gr, bpy.data.objects[name + "_m_teeth"]]
    F["brows"]["neutral"] = [stroke(f"{name}_browN{sx}", [(sx * 0.05, fy - 0.015, 0.25), (sx * 0.15, fy + 0.01, 0.25)], k, 0.009, head) for sx in (-1, 1)]
    F["brows"]["worried"] = [stroke(f"{name}_browW{sx}", [(sx * 0.05, fy - 0.012, 0.27), (sx * 0.15, fy + 0.01, 0.225)], k, 0.01, head) for sx in (-1, 1)]
    F["brows"]["angry"] = [stroke(f"{name}_browA{sx}", [(sx * 0.05, fy - 0.012, 0.22), (sx * 0.15, fy + 0.01, 0.265)], k, 0.011, head) for sx in (-1, 1)]
    if blush:
        for sx in (-1, 1):
            ball(f"{name}_blush{sx}", (0.045, 0.01, 0.025), (sx * 0.18, fy + 0.03, 0.06), flat("blush", (1.0, 0.6, 0.62)), 0, head, seg=12)
    if sunglasses:
        sg = toon("shades", (0.05, 0.05, 0.08), shade=0.9)
        for sx in (-1, 1):
            ball(f"{name}_shade{sx}", (0.085, 0.02, 0.06), (sx * 0.1, fy - 0.02, 0.15), sg, 0.006, head, seg=16)
        stroke(name + "_bridge", [(-0.03, fy - 0.03, 0.17), (0.03, fy - 0.03, 0.17)], k, 0.008, head)
    if glasses:
        for sx in (-1, 1):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.065, minor_radius=0.008, location=(sx * 0.1, fy - 0.02, 0.15), rotation=(math.radians(90), 0, 0))
            t = bpy.context.object; t.name = f"{name}_glass{sx}"; t.data.materials.append(k); t.parent = head
    # limbs
    if seated:
        [stroke(f"{name}_leg{sx}", [(sx * 0.09, -0.05, bz - 0.35), (sx * 0.1, -0.45, bz - 0.33), (sx * 0.1, -0.5, 0.05)], k, 0.022, root) for sx in (-1, 1)]
        feet_y = -0.53
    else:
        [stroke(f"{name}_leg{sx}", [(sx * 0.09, 0, bz - 0.35), (sx * 0.1, 0, 0.03)], k, 0.022, root) for sx in (-1, 1)]
        feet_y = -0.03
    [ball(f"{name}_shoe{sx}", (0.06, 0.09, 0.035), (sx * 0.1, feet_y, 0.03), toon("shoe", (0.35, 0.2, 0.1)), 0.008, root) for sx in (-1, 1)]
    arms, hands = [], []
    for sx in (-1, 1):
        sh = empty(f"{name}_shoulder{sx}", (sx * 0.2, 0, bz + 0.2), torso)
        stroke(f"{name}_arm{sx}", [(0, 0, 0), (sx * 0.12, -0.02, -0.25), (sx * 0.14, -0.04, -0.48)], k, 0.02, sh)
        hands.append(empty(f"{name}_hand{sx}", (sx * 0.14, -0.04, -0.48), sh))
        arms.append(sh)
    root.rotation_euler[2] = rot_z
    h = dict(root=root, torso=torso, head=head, face=F, arms=arms, hands=hands, eyes=F["eyes"]["open"])
    set_face(h, None, eyes, mouth, brows)
    return h

def set_face(h, frame, eyes=None, mouth=None, brows=None):
    """Switch face parts. frame=None sets static state, else keyframes visibility."""
    for part, want in (("eyes", eyes), ("mouth", mouth), ("brows", brows)):
        if want is None:
            continue
        for nm, objs in h["face"][part].items():
            for o in objs:
                if frame is None:
                    o.hide_render = nm != want
                else:
                    show(o, frame, nm == want)

def phone(name, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), screen=(0.35, 0.6, 1.0), size=1.0):
    root = empty(name, loc, parent)
    root.rotation_euler = rot
    box(name + "_body", (0.075 * size, 0.012 * size, 0.15 * size), (0, 0, 0), toon("phonebody", (0.12, 0.12, 0.15)), 0.004, root)
    box(name + "_scr", (0.066 * size, 0.004 * size, 0.138 * size), (0, -0.0065 * size, 0), flat(name + "_scrm", screen, 1.6), 0, root)
    return root

# ---------------------------------------------------------------- props
def desk(name, loc, w=1.4, d=0.75, h=0.75, color=(0.86, 0.87, 0.9), rot_z=0):
    root = empty(name, loc)
    m = toon("desk", color)
    box(name + "_top", (w, d, 0.05), (0, 0, h), m, 0.012, root)
    for sx in (-1, 1):
        for sy in (-1, 1):
            box(f"{name}_leg{sx}{sy}", (0.05, 0.05, h), (sx * (w / 2 - 0.05), sy * (d / 2 - 0.05), h / 2), toon("deskleg", (0.55, 0.57, 0.62)), 0.008, root)
    box(name + "_drawers", (0.42, d - 0.1, h * 0.65), (w / 2 - 0.26, 0, h * 0.62), m, 0.012, root)
    for i in range(3):
        box(f"{name}_handle{i}", (0.14, 0.01, 0.02), (w / 2 - 0.26, -d / 2 + 0.03, h * 0.85 - i * 0.16), ink(), 0, root)
    root.rotation_euler[2] = rot_z
    return root

def chair(name, loc, rot_z=0, color=(0.25, 0.3, 0.45)):
    root = empty(name, loc)
    m = toon("chair", color)
    box(name + "_seat", (0.5, 0.48, 0.07), (0, 0, 0.48), m, 0.01, root)
    box(name + "_back", (0.48, 0.06, 0.55), (0, 0.24, 0.82), m, 0.01, root)
    cyl(name + "_post", 0.03, 0.4, (0, 0, 0.25), ink(), 0, root)
    for i in range(5):
        a = i * 2 * math.pi / 5
        box(f"{name}_foot{i}", (0.32, 0.04, 0.03), (0.16 * math.cos(a), 0.16 * math.sin(a), 0.05), ink(), 0, root, rot=(0, 0, a))
    root.rotation_euler[2] = rot_z
    return root

def clock(name, loc, r=0.28, rot=(math.radians(90), 0, 0), start_hour=9.0):
    """Wall clock facing -Y. Returns (root, minute_pivot, hour_pivot, second_pivot)."""
    root = empty(name, loc)
    root.rotation_euler = rot
    cyl(name + "_face", r, 0.04, (0, 0, 0), toon("clockface", (0.98, 0.98, 0.96), shade=0.9, mid=0.95), 0, root)
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=0.035, location=(0, 0, 0))
    t = bpy.context.object; t.name = name + "_rim"; _finish(t, toon("clockrim", (0.85, 0.12, 0.12)), 0.006, root)
    for i in range(12):
        a = i * math.pi / 6
        box(f"{name}_tick{i}", (0.015, 0.05 if i % 3 == 0 else 0.03, 0.01), (0.8 * r * math.sin(a), 0.8 * r * math.cos(a), 0.025), ink(), 0, root, rot=(0, 0, -a))
    pivots = []
    for nm, ln, wd, col in (("min", 0.75, 0.018, None), ("hour", 0.5, 0.026, None), ("sec", 0.82, 0.007, (0.85, 0.1, 0.1))):
        p = empty(f"{name}_{nm}", (0, 0, 0.03 + len(pivots) * 0.005), root)
        box(f"{name}_{nm}hand", (wd, ln * r, 0.008), (0, ln * r / 2 - 0.02, 0), flat(f"hand{nm}", col) if col else ink(), 0, p)
        pivots.append(p)
    pivots[1].rotation_euler[2] = -start_hour / 12 * 2 * math.pi
    return root, pivots[0], pivots[1], pivots[2]

def door(name, loc, rot_z=0, color=(0.62, 0.78, 0.9), sign=None):
    root = empty(name, loc)
    box(name + "_frame", (1.1, 0.08, 2.25), (0, 0.02, 1.125), toon("doorframe", (0.95, 0.95, 0.97)), 0.012, root)
    box(name + "_leaf", (0.92, 0.1, 2.12), (0, 0, 1.06), toon(name + "_leafc", color), 0.012, root)
    box(name + "_win", (0.3, 0.11, 0.45), (0, -0.005, 1.6), toon("glass", (0.55, 0.85, 0.85), shade=0.85), 0.008, root)
    box(name + "_handle", (0.16, 0.06, 0.04), (0.33, -0.08, 1.0), toon("metal", (0.8, 0.8, 0.85)), 0.006, root)
    box(name + "_slot", (0.34, 0.11, 0.05), (0, -0.01, 0.75), toon("brass", (0.85, 0.65, 0.2)), 0.006, root)
    if sign:
        box(name + "_sign", (0.78, 0.12, 0.42), (0, -0.01, 1.18), toon("signbg", (0.98, 0.98, 0.98), shade=0.92, mid=0.96), 0.008, root, rot=(0, math.radians(-2), 0))
        for i, (txt, sz, col) in enumerate(sign):
            text(f"{name}_signt{i}", txt, (0, -0.075, 1.32 - i * 0.12 - (0.05 if i == len(sign) - 1 else 0)), sz, flat(f"signc{i}", col), parent=root)
        for sx in (-1, 1):
            box(f"{name}_tape{sx}", (0.12, 0.125, 0.05), (sx * 0.38, -0.012, 1.38), toon("tape", (0.95, 0.8, 0.3)), 0, root, rot=(0, sx * 0.7, 0))
    root.rotation_euler[2] = rot_z
    return root

# ---------------------------------------------------------------- animation helpers
def key(obj, path, frame, value, index=-1):
    if index >= 0:
        getattr(obj, path)[index] = value
    else:
        setattr(obj, path, value)
    obj.keyframe_insert(path, frame=frame, index=index)

def ease_all(obj, interp="BEZIER"):
    if obj.animation_data and obj.animation_data.action:
        for fc in obj.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = interp
                kp.easing = "EASE_IN_OUT"

def linear_all(obj):
    ease_all(obj, "LINEAR")

def handheld(obj, strength=0.004, scale=40.0):
    """Gentle camera drift via noise modifiers on rotation."""
    if not obj.animation_data or not obj.animation_data.action:
        key(obj, "rotation_euler", 1, obj.rotation_euler.copy())
    for i in range(3):
        fc = obj.animation_data.action.fcurves.find("rotation_euler", index=i)
        if fc is None:
            obj.keyframe_insert("rotation_euler", frame=1, index=i)
            fc = obj.animation_data.action.fcurves.find("rotation_euler", index=i)
        n = fc.modifiers.new("NOISE")
        n.strength = strength
        n.scale = scale
        n.phase = 7 * i + 3

def camera(name, loc, look_at, lens=26, dof_target=None, fstop=2.8):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 36
    c = bpy.data.objects.new(name, cd)
    bpy.context.collection.objects.link(c)
    c.location = loc
    aim(c, look_at)
    if dof_target is not None:
        cd.dof.use_dof = True
        cd.dof.focus_object = dof_target
        cd.dof.aperture_fstop = fstop
    return c

def aim(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()

def blink(eyes, frames, dur=4):
    for e in eyes:
        if e.type != "MESH":
            continue
        z = e.scale[2]
        for f in frames:
            key(e, "scale", f - 1, z, 2)
            key(e, "scale", f + dur // 2, 0.1 * z, 2)
            key(e, "scale", f + dur, z, 2)

def bob(obj, f0, f1, amp=0.02, period=16, axis=2, base=None):
    base = obj.location[axis] if base is None else base
    f = f0
    while f <= f1:
        key(obj, "location", f, base, axis)
        key(obj, "location", f + period // 2, base + amp, axis)
        f += period
    key(obj, "location", f1, base, axis)


def light_patch(name, pts, color=(1.0, 0.85, 0.3), alpha=0.45):
    """Painted-style flat light shape (window light on a wall)."""
    me = bpy.data.meshes.new(name)
    me.from_pydata(pts, [], [list(range(len(pts)))])
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.blend_method = "BLEND"
    m.shadow_method = "NONE"
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission"); em.inputs[0].default_value = (*lin(color), 1)
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader"); mix.inputs[0].default_value = alpha
    nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    o.data.materials.append(m)
    return o


def windows_mat(name, lit=(1.0, 0.82, 0.48), dark=(0.1, 0.13, 0.26), scale=1.0, bias=-0.3, strength=1.0):
    """Window grid overlay: mortar is transparent, 'bricks' are lit/dark windows.
    Put on a plane just in front of a toon facade. Animate inputs['Strength'] on node 'EM'."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.blend_method = "CLIP"
    m.shadow_method = "NONE"
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    co = _plane_coords(nt, "xz")
    b = nt.nodes.new("ShaderNodeTexBrick")
    b.offset = 0.0
    b.inputs["Color1"].default_value = (*lin(lit), 1)
    b.inputs["Color2"].default_value = (*lin(dark), 1)
    b.inputs["Scale"].default_value = scale
    b.inputs["Mortar Size"].default_value = 0.12
    b.inputs["Mortar Smooth"].default_value = 0.0
    b.inputs["Bias"].default_value = bias
    b.inputs["Brick Width"].default_value = 0.9
    b.inputs["Row Height"].default_value = 0.8
    nt.links.new(co.outputs[0], b.inputs[0])
    em = nt.nodes.new("ShaderNodeEmission"); em.name = "EM"
    em.inputs[1].default_value = strength
    nt.links.new(b.outputs[0], em.inputs[0])
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(b.outputs[1], mix.inputs[0])
    nt.links.new(em.outputs[0], mix.inputs[1]); nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    return m

def plane_xz(name, w, h, loc, mat, parent=None):
    """Vertical rectangle facing -Y with its own object-space coords (for textures)."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([(-w/2, 0, -h/2), (w/2, 0, -h/2), (w/2, 0, h/2), (-w/2, 0, h/2)], [], [[0, 1, 2, 3]])
    o = bpy.data.objects.new(name, me)
    o.location = loc
    bpy.context.collection.objects.link(o)
    o.data.materials.append(mat)
    if parent:
        o.parent = parent
    return o

def show(obj, frame, visible):
    """Keyframe render visibility (constant)."""
    obj.hide_render = not visible
    obj.keyframe_insert("hide_render", frame=frame)
    for fc in obj.animation_data.action.fcurves:
        if fc.data_path == "hide_render":
            for kp in fc.keyframe_points:
                kp.interpolation = "CONSTANT"

def anim_value(sock, frames_vals, path="default_value"):
    for f, v in frames_vals:
        sock.default_value = v
        sock.keyframe_insert(path, frame=f)
