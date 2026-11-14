# Blender 5.3: realistic materials + lighting for the microwave scenes, baked into lightmaps for the three.js renderer.
# usage: python mwbake.py <world.glb> <outdir> <size> <samples> [rooms]
import sys, math, os
GLB, OUTD, SIZE, SMP = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
ROOMS = sys.argv[5].split(",") if len(sys.argv) > 5 else ["lab", "show", "kitchen", "school"]
ROOMS = ROOMS + [r + "_floor" for r in ROOMS]
sys.argv = ["x", "none", "/dev/null", "64", "64", "1"]
src = open("/root/shorts/blend/bg.py").read(); src = src[:src.index("# ---------------------------------------------------------------- scenes")]
exec(compile(src, "bghelpers", "exec"))
lab_src = open("/root/shorts/blend/mwlab.py").read()
for fn in ("checker", "plaster", "emit"):
    i = lab_src.index("def " + fn + "("); j = lab_src.index("\ndef ", i + 5); exec(compile(lab_src[i:j], fn, "exec"))
from mathutils import Vector
os.makedirs(OUTD, exist_ok=True)
bpy.ops.import_scene.gltf(filepath=GLB)

def metal(name, col, rough=0.3):   # painted / brushed metal: diffuse so it bakes with colour
    def b(nt, bsdf, out):
        v = coord(nt); n = noise(nt, v, 30, 6); c = hexc(col)
        nt.links.new(ramp(nt, n.outputs["Fac"], [(0.3, tuple(x * 0.88 for x in c)), (0.7, tuple(min(1, x * 1.06) for x in c))]), bsdf.inputs["Base Color"])
        bsdf.inputs["Metallic"].default_value = 0.0; bsdf.inputs["Roughness"].default_value = rough
    return mat(name, b)
MAPM = {
    "lino": lambda: checker("lino", "#262c3c", "#e6e0cf", 2.2), "wallG": lambda: plaster("wallG", "#9aa58a"), "wallK": lambda: plaster("wallK", "#e6dcc4"),
    "tile": lambda: checker("tile", "#c8ccd2", "#eef0f2", 2.4), "wood": lambda: deck("woodf", "#8a5e36"), "barn": lambda: clap("barn", "#9a3a2c"),
    "stone": lambda: plain("stone", "#9a948a", 0.9, 0, 6, 0.25), "grass": lambda: grassm("grassb"), "trim": lambda: plain("trimb", "#efe8d8", 0.5),
    "base": lambda: plain("baseb", "#3a3a40", 0.6), "sky": lambda: emit("skyw", "#a9c9ea", 1.15), "chalk": lambda: plain("chalk", "#2f4a3a", 0.9, 0, 8, 0.2),
    "glass": lambda: plain("glassb", "#2a3448", 0.08), "door": lambda: wood("doorb", "#5a3a24", 2), "roof": lambda: plain("roofb", "#4e4e58", 0.8, 0, 4, 0.2),
    "steel": lambda: metal("steelb", "#8a929c", 0.35), "steelD": lambda: metal("steelDb", "#4a5058", 0.4), "dial": lambda: plain("dialb", "#f0ead8", 0.35),
    "tube": lambda: emit("tubeb", "#ffb24a", 3.0), "copper": lambda: metal("copperb", "#c8743a", 0.28), "scope": lambda: emit("scopeb", "#5ad06a", 3.0),
    "bench": lambda: wood("benchb", "#6a5a48", 2), "green": lambda: plain("greenb", "#3f7a5a", 0.45), "paperM": lambda: plain("paperb", "#f3ecd8", 0.8, 0, 30, 0.05),
    "curtain": lambda: cloth("curtainb", "#8a2a2a"), "chrome": lambda: metal("chromeb", "#dde0e4", 0.15), "dark": lambda: plain("darkb", "#1f1f24", 0.5),
    "pianoW": lambda: wood("pianob", "#3a2418", 3), "keys": lambda: plain("keysb", "#f6f2e6", 0.3), "cab": lambda: plain("cabb", "#8aa8c0", 0.45),
    "counter": lambda: plain("counterb", "#e8e4dc", 0.25, 0, 3, 0.05), "fridge": lambda: plain("fridgeb", "#f2f2f0", 0.25), "black": lambda: plain("blackb", "#2a2a30", 0.4),
    "mwin": lambda: emit("mwinb", "#ffd890", 1.4), "leaf": lambda: leaf("leafb"), "leaf2": lambda: leaf("leaf2b", "#3e6a2e", "#7a9e3e"), "trunk": lambda: wood("trunkb", "#5a4030", 3),
    "hill": lambda: plain("hillb", "#8c93a8", 0.9),
}
BOUNDS = {"lab": (-12, 12, -8, 8), "show": (34, 46, -5, 5), "kitchen": (-45, -35, -4.5, 4.5), "school": (66, 94, -14, 14)}
objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
groups = {r: [] for r in BOUNDS}
for o in objs:
    c = o.matrix_world @ (sum((Vector(v) for v in o.bound_box), Vector()) / 8)
    for r, (x0, x1, y0, y1) in BOUNDS.items():
        if x0 <= c.x <= x1 and y0 <= c.y <= y1: groups[r].append(o); break
    else: o.hide_render = True
def _unused(): pass
def matname(o):
    n = o.material_slots[0].material.name if o.material_slots and o.material_slots[0].material else o.name
    return n.split(".")[0]
def matname0(o):
    n = o.material_slots[0].material.name if o.material_slots and o.material_slots[0].material else o.name
    return n.split(".")[0]
FLOORM = {"lino", "tile", "wood"}
for r in list(groups):
    fl = [o for o in groups[r] if matname0(o) in FLOORM and (o.dimensions.z < 0.3) and o.dimensions.x * o.dimensions.y > 20]
    if fl: groups[r + "_floor"] = fl; groups[r] = [o for o in groups[r] if o not in fl]
for r, lst in groups.items():
    for o in lst:
        k = matname(o); f = MAPM.get(k)
        newm = (f() if f else plain("def", "#888888")).copy(); newm.name = f"{r}_{k}"
        o.data.materials.clear(); o.data.materials.append(newm)

def area(name, loc, look, size, energy, col, sx=None):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = energy; ld.color = col; ld.size = size
    if sx: ld.shape = "RECTANGLE"; ld.size, ld.size_y = sx
    o = bpy.data.objects.new(name, ld); S.collection.objects.link(o); o.location = loc; o.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler(); return o
def point(name, loc, energy, col, r=0.2):
    ld = bpy.data.lights.new(name, "POINT"); ld.energy = energy; ld.color = col; ld.shadow_soft_size = r
    o = bpy.data.objects.new(name, ld); S.collection.objects.link(o); o.location = loc; return o
# three.js (x, y, z) -> blender (x, -z, y)
def B3(x, y, z): return (x, -z, y)
# lab: daylight pouring through the three back windows, soft ceiling bounce, orange tube glow
for wx in (-6, 0, 6): area("win", B3(wx, 3.0, -6.4), B3(wx + 1.5, 0, -1.0), 1, 650, (1.0, 0.93, 0.82), (2.9, 2.1))
area("labceil", B3(0, 4.7, 0), B3(0, 0, 0), 1, 900, (1.0, 0.95, 0.88), (16, 9))
point("tube", B3(2.3, 1.9, -4.0), 260, (1.0, 0.6, 0.25), 0.25)
# showroom: warm overhead + spot on the radarange
area("showceil", B3(40, 4.7, 0), B3(40, 0, 0), 1, 700, (1.0, 0.9, 0.78), (8, 6))
area("showkey", B3(37, 3.5, 3), B3(39.3, 1.0, -2.2), 1.5, 300, (1.0, 0.92, 0.8))
# kitchen: window daylight + ceiling
area("kwin", B3(-41.2, 1.9, -3.0), B3(-40, 0.8, 0), 1, 300, (0.95, 0.97, 1.0), (2.0, 0.9))
area("kceil", B3(-40, 3.0, 0), B3(-40, 0, 0), 1, 500, (1.0, 0.96, 0.9), (7, 5))
# exterior (school): golden sun + sky
sd = Vector((-0.5, -0.45, 0.6)).normalized(); ld = bpy.data.lights.new("sun", "SUN"); ld.energy = 4.5; ld.color = (1.0, 0.88, 0.7); ld.angle = math.radians(2)
so = bpy.data.objects.new("sun", ld); S.collection.objects.link(so); so.rotation_euler = (-sd).to_track_quat("-Z", "Y").to_euler()
w = bpy.data.worlds.new("w"); S.world = w; w.use_nodes = True; bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0.62, 0.74, 0.92, 1); bg.inputs[1].default_value = 0.7

S.render.engine = "CYCLES"; S.cycles.device = "CPU"; S.cycles.samples = SMP; S.cycles.use_denoising = False
for r in ROOMS:
    lst = [o for o in groups[r] if o.name in bpy.data.objects]
    if not lst: continue
    bpy.ops.object.select_all(action="DESELECT")
    for o in lst: o.select_set(True)
    bpy.context.view_layer.objects.active = lst[0]; bpy.ops.object.make_single_user(object=True, obdata=True); bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active; ob.name = "room_" + r
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    while ob.data.uv_layers: ob.data.uv_layers.remove(ob.data.uv_layers[0])
    ob.data.uv_layers.new(name="lm"); ob.data.uv_layers.active_index = 0
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT"); bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004); bpy.ops.object.mode_set(mode="OBJECT")
    import numpy as np
    def bake(kind, size, smp, direct, indirect, color, emit=False):
        img = bpy.data.images.new(f"{kind}_{r}", size, size, float_buffer=True)
        for ms in ob.material_slots:
            nt = ms.material.node_tree
            n = nt.nodes.get("BAKE") or nt.nodes.new("ShaderNodeTexImage"); n.name = "BAKE"; n.image = img; nt.nodes.active = n; n.select = True
        S.cycles.samples = smp; bk = S.render.bake; bk.margin = 8
        bk.use_pass_direct = direct; bk.use_pass_indirect = indirect; bk.use_pass_color = color
        bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True); bpy.context.view_layer.objects.active = ob
        bpy.ops.object.bake(type="EMIT" if emit else "DIFFUSE")
        a = np.array(img.pixels[:], dtype=np.float32).reshape(size, size, 4)[..., :3]; return a
    SZ = SIZE * (2 if r in ("lab", "lab_floor") else 1)
    alb = bake("alb", SZ, 1, False, False, True)
    lit = bake("lit", SIZE // 2, SMP, True, True, False)
    emi = bake("emi", SZ, 1, False, False, False, emit=True)
    def blur(x, k):
        for _ in range(3):
            c = np.cumsum(np.pad(x, ((k, k), (0, 0), (0, 0)), mode="edge"), axis=0); x = (c[2 * k:] - c[:-2 * k]) / (2 * k)
            c = np.cumsum(np.pad(x, ((0, 0), (k, k), (0, 0)), mode="edge"), axis=1); x = (c[:, 2 * k:] - c[:, :-2 * k]) / (2 * k)
        return x
    lit = blur(lit, 2)
    f_ = SZ // (SIZE // 2); lit = np.repeat(np.repeat(lit, f_, axis=0), f_, axis=1)[:SZ, :SZ]
    col = alb * lit * 1.15 + emi
    col = 1.0 - np.exp(-col * 1.25)                                    # soft filmic roll-off
    out = bpy.data.images.new("bake_" + r, SZ, SZ, float_buffer=True)
    rgba = np.concatenate([col, np.ones((SZ, SZ, 1), np.float32)], axis=2)
    out.pixels.foreach_set(rgba.ravel()); out.update()
    S.view_settings.view_transform = "Standard"; S.view_settings.look = "None"; S.view_settings.exposure = 0
    out.save_render(f"{OUTD}/bake_{r}.png", scene=S)
    # export the room with one unlit material that uses the baked map on the lightmap UVs
    m = bpy.data.materials.new("baked_" + r); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes["Principled BSDF"]
    ti = nt.nodes.new("ShaderNodeTexImage"); ti.image = bpy.data.images.load(f"{OUTD}/bake_{r}.png"); nt.links.new(ti.outputs[0], bs.inputs["Base Color"])
    ob.data.materials.clear(); ob.data.materials.append(m)
    bpy.ops.object.select_all(action="DESELECT"); ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=f"{OUTD}/room_{r}.glb", use_selection=True, export_format="GLB")
    print("BAKED", r, len(ob.data.polygons))
