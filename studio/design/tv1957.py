# Design element 1: 1957 British console television. Builds the model + a room-corner context, renders with Cycles,
# saves design/tv1957.blend and design/tv1957.glb (model only) for the video pipeline.
import bpy, bmesh, math, os, time, mathutils
A = '/home/user/wisk/studio/public/assets/'; D = '/home/user/wisk/studio/design/'
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.cycles.samples = int(os.environ.get('SAMPLES', '384')); sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.012
sc.cycles.use_denoising = False; sc.cycles.max_bounces = 8; sc.cycles.caustics_reflective = False; sc.cycles.caustics_refractive = False; sc.cycles.blur_glossy = 0.6
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920; sc.render.resolution_percentage = int(os.environ.get('PCT', '100'))
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
sc.render.film_transparent = False
def img_node(nt, path, col=True, proj='BOX', vec=None):
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path, check_existing=True); t.projection = proj; t.projection_blend = 0.25
    if not col: t.image.colorspace_settings.name = 'Non-Color'
    if vec is not None: nt.links.new(vec, t.inputs['Vector'])
    return t
def mat_pbr(name, tex, scale=1.0, tint=None, coat=0.0, rough_mul=1.0, rot=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (scale, scale, scale); mp.inputs['Rotation'].default_value[2] = rot
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); v = mp.outputs['Vector']
    base = A + f'tex/{tex}/'
    dif = img_node(nt, base + 'diff.jpg', True, vec=v); col = dif.outputs['Color']
    if tint:
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
        nt.links.new(col, mx.inputs[6]); mx.inputs[7].default_value = tint; col = mx.outputs[2]
    nt.links.new(col, b.inputs['Base Color'])
    if os.path.exists(base + 'rough.jpg'):
        r = img_node(nt, base + 'rough.jpg', False, vec=v); mt = nt.nodes.new('ShaderNodeMath'); mt.operation = 'MULTIPLY'; mt.inputs[1].default_value = rough_mul
        nt.links.new(r.outputs['Color'], mt.inputs[0]); nt.links.new(mt.outputs[0], b.inputs['Roughness'])
    if os.path.exists(base + 'nor.jpg'):
        n = img_node(nt, base + 'nor.jpg', False, vec=v); nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.8
        nt.links.new(n.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.08
    return m
def mat(name, col, rough=0.5, metal=0.0, coat=0.0, emit=None, ek=0.0, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = col; b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.05
    if emit: b.inputs['Emission Color'].default_value = emit; b.inputs['Emission Strength'].default_value = ek
    if sheen: b.inputs['Sheen Weight'].default_value = sheen
    return m
def bevel(o, w=0.006, seg=4):
    md = o.modifiers.new('bev', 'BEVEL'); md.width = w; md.segments = seg; md.limit_method = 'ANGLE'; o.modifiers.new('wn', 'WEIGHTED_NORMAL')
    for p in o.data.polygons: p.use_smooth = True
def cube(name, size, loc, m, bw=0.006, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(m)
    if bw: bevel(o, bw)
    if parent: o.parent = parent
    return o
def cyl(name, r, h, loc, m, rot=(0, 0, 0), verts=48, r2=None, parent=None, bw=0.0):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    else: bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r2, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; o.name = name; o.data.materials.append(m)
    if bw: bevel(o, bw, 3)
    else:
        for p in o.data.polygons: p.use_smooth = True
    if parent: o.parent = parent
    return o
# ---------------- materials ----------------
walnut = mat_pbr('walnut', 'rosewood_veneer1', 2.2, (0.55, 0.40, 0.30, 1), coat=0.85, rough_mul=0.7)
walnutDark = mat_pbr('walnutDark', 'rosewood_veneer1', 2.2, (0.34, 0.24, 0.18, 1), coat=0.7, rough_mul=0.8, rot=1.5708)
ivory = mat('ivory', (0.83, 0.78, 0.66, 1), 0.28, coat=0.3)
bakelite = mat('bakelite', (0.09, 0.05, 0.03, 1), 0.22, coat=0.6)
chrome = mat('chrome', (0.9, 0.9, 0.9, 1), 0.08, 1.0)
brass = mat('brass', (0.85, 0.66, 0.36, 1), 0.25, 1.0)
cloth = mat_pbr('cloth', 'fabric_pattern_05', 6.0, (0.75, 0.62, 0.42, 1)); cloth.node_tree.nodes['Principled BSDF'].inputs['Sheen Weight'].default_value = 0.6
# CRT face: phosphor picture (emission) under thick curved glass (glossy coat)
crt = bpy.data.materials.new('crt'); crt.use_nodes = True; nt = crt.node_tree; b = nt.nodes['Principled BSDF']
pic = nt.nodes.new('ShaderNodeTexImage'); pic.image = bpy.data.images.load(D + 'tex/tv_broadcast.png'); uv = nt.nodes.new('ShaderNodeUVMap')
nt.links.new(uv.outputs['UV'], pic.inputs['Vector'])
b.inputs['Base Color'].default_value = (0.03, 0.035, 0.035, 1); b.inputs['Roughness'].default_value = 0.35
nt.links.new(pic.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = float(os.environ.get('SCREEN', '2.2'))
b.inputs['Coat Weight'].default_value = 1.0; b.inputs['Coat Roughness'].default_value = 0.015; b.inputs['Coat IOR'].default_value = 1.52
# ---------------- the television (origin at floor, front = -Y) ----------------
root = bpy.data.objects.new('TV1957', None); sc.collection.objects.link(root)
W, H, Dp, LEG = 0.56, 0.50, 0.46, 0.44
cab = cube('cabinet', (W, Dp, H), (0, 0, LEG + H / 2), walnut, 0.014, parent=root)
cube('front_panel', (W - 0.03, 0.012, H - 0.03), (0, -Dp / 2 - 0.002, LEG + H / 2), walnutDark, 0.004, parent=root)
cube('plinth', (W - 0.02, Dp - 0.02, 0.035), (0, 0, LEG + 0.012), walnutDark, 0.006, parent=root)
# ivory mask with a rounded-rectangle opening
mask = cube('mask', (0.42, 0.018, 0.33), (-0.02, -Dp / 2 - 0.012, LEG + H * 0.6), ivory, 0.008, parent=root)
hole = cube('hole', (0.34, 0.1, 0.255), (-0.02, -Dp / 2 - 0.012, LEG + H * 0.6), ivory, 0.0)
bv = hole.modifiers.new('r', 'BEVEL'); bv.width = 0.045; bv.segments = 10; bv.affect = 'EDGES'; bv.limit_method = 'ANGLE'; bv.angle_limit = math.radians(80)
bpy.context.view_layer.objects.active = hole
# only round the four edges along Y: bevel then apply
bpy.ops.object.modifier_apply(modifier='r')
bo = mask.modifiers.new('cut', 'BOOLEAN'); bo.object = hole; bo.operation = 'DIFFERENCE'; bpy.context.view_layer.objects.active = mask
bpy.ops.object.modifier_move_to_index(modifier='cut', index=0); bpy.data.objects.remove(hole)
# curved CRT face: rounded-rect grid bulging toward the viewer
bm = bmesh.new(); nx, nz = 64, 48; a, c = 0.172, 0.13
uvl = bm.loops.layers.uv.new()
verts = [[None] * (nz + 1) for _ in range(nx + 1)]
for i in range(nx + 1):
    for j in range(nz + 1):
        u, v = i / nx * 2 - 1, j / nz * 2 - 1
        # squircle mapping keeps corners round
        r = max(abs(u), abs(v)); su = u * (1 - 0.18 * v * v); sv = v * (1 - 0.18 * u * u)
        x, z = su * a, sv * c; y = -0.028 * (1 - su * su) * (1 - sv * sv) - 0.006
        verts[i][j] = bm.verts.new((x, y, z))
for i in range(nx):
    for j in range(nz):
        f = bm.faces.new((verts[i][j], verts[i + 1][j], verts[i + 1][j + 1], verts[i][j + 1]))
        for lp, (ii, jj) in zip(f.loops, [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]): lp[uvl].uv = (ii / nx, jj / nz)
me = bpy.data.meshes.new('crt'); bm.to_mesh(me); scr = bpy.data.objects.new('screen', me); sc.collection.objects.link(scr)
for p in me.polygons: p.use_smooth = True
me.materials.append(crt); scr.location = (-0.02, -Dp / 2 - 0.006, LEG + H * 0.6); scr.parent = root
# speaker: gold-fleck cloth behind brass slats, under the mask
cube('grille_cloth', (0.30, 0.006, 0.075), (-0.06, -Dp / 2 - 0.009, LEG + 0.085), cloth, 0.002, parent=root)
for k in range(5): cyl('slat', 0.0025, 0.30, (-0.06, -Dp / 2 - 0.014, LEG + 0.055 + k * 0.015), brass, rot=(0, math.pi / 2, 0), verts=12, parent=root)
cube('grille_frame', (0.318, 0.01, 0.092), (-0.06, -Dp / 2 - 0.006, LEG + 0.085), brass, 0.003, parent=root).modifiers.new('sol', 'SOLIDIFY')
# knobs (bakelite, knurled edge, chrome cap) + brass badge
for k, (x, z) in enumerate([(0.185, LEG + 0.12), (0.185, LEG + 0.05)]):
    kb = cyl('knob', 0.024, 0.026, (x, -Dp / 2 - 0.022, z), bakelite, rot=(math.pi / 2, 0, 0), verts=64, bw=0.003, parent=root)
    for q in range(28):
        t = q / 28 * 2 * math.pi
        cube('knurl', (0.003, 0.02, 0.004), (x + math.cos(t) * 0.0245, -Dp / 2 - 0.022, z + math.sin(t) * 0.0245), bakelite, 0.0008, rot=(0, -t, 0), parent=root)
    cyl('cap', 0.012, 0.004, (x, -Dp / 2 - 0.036, z), chrome, rot=(math.pi / 2, 0, 0), verts=48, bw=0.0012, parent=root)
    cube('pointer', (0.002, 0.003, 0.012), (x, -Dp / 2 - 0.0375, z + 0.006), ivory, 0.0005, parent=root)
cyl('badge', 0.016, 0.003, (0.185, -Dp / 2 - 0.01, LEG + 0.205), brass, rot=(math.pi / 2, 0, 0), verts=48, bw=0.001, parent=root)
# splayed tapered legs with brass ferrules
for sx in (-1, 1):
    for sy in (-1, 1):
        top = mathutils.Vector((sx * (W / 2 - 0.06), sy * (Dp / 2 - 0.06), LEG)); foot = top + mathutils.Vector((sx * 0.05, sy * 0.04, -LEG))
        mid = (top + foot) / 2; d = (top - foot); L = d.length
        q = d.normalized().to_track_quat('Z', 'Y').to_euler()
        cyl('leg', 0.019, L - 0.035, mid + d.normalized() * 0.0175, walnut, rot=q, verts=24, r2=0.011, parent=root)
        cyl('ferrule', 0.0115, 0.04, foot + d.normalized() * 0.02, brass, rot=q, verts=24, r2=0.009, parent=root)
# lace doily + small glass vase with three daffodils (spring 1957)
lace = bpy.data.materials.new('lace'); lace.use_nodes = True; nt = lace.node_tree; b = nt.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = (0.92, 0.9, 0.84, 1); b.inputs['Roughness'].default_value = 0.9
vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 140; vor.feature = 'DISTANCE_TO_EDGE'
cr = nt.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = 0.06; cr.color_ramp.elements[1].position = 0.08
nt.links.new(vor.outputs['Distance'], cr.inputs['Fac']); nt.links.new(cr.outputs['Color'], b.inputs['Alpha'])
lace.blend_method = 'HASHED'
bpy.ops.mesh.primitive_circle_add(vertices=96, radius=0.15, fill_type='NGON', location=(0.05, 0.02, LEG + H + 0.002)); o = bpy.context.object; o.data.materials.append(lace); o.parent = root
glass = mat('vaseglass', (0.85, 0.95, 0.9, 1), 0.02); glass.node_tree.nodes['Principled BSDF'].inputs['Transmission Weight'].default_value = 1.0
v = cyl('vase', 0.032, 0.13, (0.05, 0.02, LEG + H + 0.067), glass, verts=48, r2=0.022, parent=root)
sol = v.modifiers.new('s', 'SOLIDIFY'); sol.thickness = 0.003
stem = mat('stem', (0.18, 0.32, 0.1, 1), 0.5); petal = mat('petal', (0.95, 0.72, 0.08, 1), 0.45, sheen=0.4); trumpet = mat('trumpet', (0.98, 0.55, 0.05, 1), 0.4)
for k, (dx, dz, tilt) in enumerate([(-0.02, 0.24, 0.2), (0.015, 0.27, -0.15), (0.03, 0.22, 0.35)]):
    top = (0.05 + dx, 0.02, LEG + H + dz)
    cyl('stem', 0.003, dz, (0.05 + dx * 0.5, 0.02, LEG + H + dz / 2), stem, rot=(0, tilt * 0.4, 0), verts=8, parent=root)
    for q in range(6):
        t = q / 6 * 2 * math.pi
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.027, location=(top[0] + math.cos(t) * 0.026, top[1] - 0.01, top[2] + math.sin(t) * 0.026), segments=16, ring_count=8)
        pp = bpy.context.object; pp.scale = (1, 0.25, 0.55); pp.rotation_euler = (math.pi / 2 - 0.4, 0, t); pp.data.materials.append(petal); pp.parent = root
        for f in pp.data.polygons: f.use_smooth = True
    cyl('trumpet', 0.016, 0.03, (top[0], top[1] - 0.02, top[2]), trumpet, rot=(math.pi / 2 - 0.4, 0, 0), verts=24, r2=0.007, parent=root)
# ---------------- room corner context ----------------
floor = mat_pbr('floor', 'old_wood_floor', 0.7); wall = bpy.data.materials.new('wall'); wall.use_nodes = True; nt = wall.node_tree
tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1 / 0.68,) * 3; nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
wp = img_node(nt, D + 'tex/wallpaper_1957.png', True, vec=mp.outputs['Vector']); nt.links.new(wp.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
nt.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.85
paint = mat('skirting', (0.86, 0.84, 0.78, 1), 0.3, coat=0.4)
rug = mat_pbr('rug', 'fabric_pattern_07', 1.4); rug.node_tree.nodes['Principled BSDF'].inputs['Sheen Weight'].default_value = 0.8
TVX, TVY, ROT = -0.15, 0.35, math.radians(-28)
root.location = (TVX, TVY, 0); root.rotation_euler = (0, 0, ROT)
cube('floor', (6, 6, 0.04), (0, 0, -0.02), floor, 0)
cube('wall_back', (6, 0.04, 2.75), (0, 0.9, 1.375), wall, 0); cube('wall_left', (0.04, 6, 2.75), (-1.1, 0, 1.375), wall, 0)
cube('skirt_b', (6, 0.025, 0.14), (0, 0.875, 0.07), paint, 0.003); cube('skirt_l', (0.025, 6, 0.14), (-1.075, 0, 0.07), paint, 0.003)
cube('rug', (1.6, 1.2, 0.012), (0.45, -0.75, 0.006), rug, 0.004, rot=(0, 0, math.radians(-8)))
# lights: warm standard lamp (off-frame right), cool window light from the left, dim room fill
bpy.ops.object.light_add(type='AREA', location=(1.4, -1.0, 1.55)); L = bpy.context.object; L.data.energy = 75; L.data.color = (1.0, 0.66, 0.38); L.data.size = 0.35
L.rotation_euler = (mathutils.Vector((TVX, TVY, 0.75)) - L.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.light_add(type='AREA', location=(-1.05, -1.4, 1.5)); L2 = bpy.context.object; L2.data.energy = 160; L2.data.color = (0.75, 0.82, 1.0); L2.data.size = 1.4
L2.rotation_euler = (mathutils.Vector((0.2, 0.3, 0.8)) - L2.location).to_track_quat('-Z', 'Y').to_euler()
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; nt = w.node_tree
env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(A + 'hdri/lythwood_room_2k.hdr')
nt.links.new(env.outputs['Color'], nt.nodes['Background'].inputs['Color']); nt.nodes['Background'].inputs['Strength'].default_value = 0.18
# camera: waist height, 50 mm-ish, focus on the screen
bpy.ops.object.camera_add(location=(0.75, -2.25, 1.0)); cam = bpy.context.object; sc.camera = cam
look = mathutils.Vector((TVX - 0.02, TVY, 0.68)); cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.sensor_fit = 'VERTICAL'; cam.data.lens = 34; cam.data.dof.use_dof = True; cam.data.dof.focus_distance = (look - cam.location).length; cam.data.dof.aperture_fstop = 2.8
bpy.ops.wm.save_as_mainfile(filepath=D + 'tv1957.blend')
sc.render.filepath = os.environ.get('OUT', D + 'tv1957_v1.png')
t0 = time.time(); bpy.ops.render.render(write_still=True); print('RENDER_SECONDS', round(time.time() - t0, 1))
