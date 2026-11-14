"""Procedural Blender scene: cinematic hand-painted anime realism of a domed neoclassical building.
Run in Blender 4.x: blender -b -P anime_capitol_blender_scene.py
The script creates a complete scene and renders anime_capitol_realism.png.
"""
import bpy, math, random
from mathutils import Vector
from math import sin, cos, pi

random.seed(18)
# --------------------------- clean scene -----------------------------------
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
    pass
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1200
scene.render.resolution_y = 1800
scene.render.resolution_percentage = 100
scene.world.color = (0.18, 0.22, 0.32)

# --------------------------- materials ------------------------------------
def mat(name, color, rough=0.75, metallic=0.0, noise_scale=5.0, bump_strength=0.12):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value = (*color,1)
    p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metallic
    tex = m.node_tree.nodes.new('ShaderNodeTexNoise'); tex.inputs['Scale'].default_value = noise_scale
    tex.inputs['Detail'].default_value = 4; tex.inputs['Roughness'].default_value = .72
    ramp = m.node_tree.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position=.22; ramp.color_ramp.elements[0].color=(*[c*.72 for c in color],1)
    ramp.color_ramp.elements[1].position=.78; ramp.color_ramp.elements[1].color=(*[min(1,c*1.12) for c in color],1)
    bump = m.node_tree.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=bump_strength; bump.inputs['Distance'].default_value=.09
    links=m.node_tree.links; links.new(tex.outputs['Fac'],ramp.inputs['Fac']); links.new(ramp.outputs['Color'],p.inputs['Base Color']); links.new(tex.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m

limestone=mat('Warm ivory limestone',(.78,.68,.50),.86,0,18,.18)
light_stone=mat('Sunlit carved stone',(.91,.81,.64),.8,0,22,.12)
shadow_stone=mat('Stone in recesses',(.34,.28,.23),.92,0,14,.15)
roof=mat('Aged bronze roof details',(.24,.16,.09),.48,.55,9,.12)
glass=mat('Deep blue-black window glass',(.025,.045,.07),.22,.35,3,.02)
metal=mat('Black iron lamp metal',(.035,.045,.052),.3,.72,7,.06)
grass=mat('Velvety meadow grass',(.17,.27,.055),.98,0,35,.32)
pathmat=mat('Old sandstone paving',(.40,.31,.20),.95,0,28,.3)
flower_red=mat('Vermilion flowers',(.55,.055,.025),.8,0,12,.1)
flower_yellow=mat('Golden flowers',(.95,.47,.035),.8,0,12,.1)
leaf_green=mat('Deep foliage',(.055,.17,.045),.9,0,16,.18)
leaf_orange=mat('Autumn foliage',(.58,.12,.025),.85,0,12,.15)

# --------------------------- geometry helpers -----------------------------
def cube(name, loc, scale, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material: o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new('Soft worn stone edges','BEVEL'); mod.width=bevel; mod.segments=3
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o

def cylinder(name, loc, radius, depth, material, vertices=64, bevel=.04):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc); o=bpy.context.object; o.name=name
    if material:o.data.materials.append(material)
    if bevel:
        b=o.modifiers.new('Rounded stone arris','BEVEL'); b.width=bevel; b.segments=3; o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def uv_sphere(name, loc, scale, material, seg=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc); o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:o.data.materials.append(material)
    bpy.ops.object.shade_smooth(); return o

def beam_between(name, a, b, radius, material, vertices=12):
    mid=(Vector(a)+Vector(b))/2; vec=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=vec.length, location=mid)
    o=bpy.context.object; o.name=name; o.rotation_mode='QUATERNION'; o.rotation_quaternion=vec.to_track_quat('Z','Y')
    if material:o.data.materials.append(material)
    return o

def architrave(x,y,z,sx,sy,sz,material=light_stone): return cube('Moulded architectural band',(x,y,z),(sx,sy,sz),material,.08)

def column(x,y,z0,height,r=.34,material=light_stone):
    cylinder('Column plinth',(x,y,z0+.18),r*1.48,.36,limestone,32,.035)
    cylinder('Column base torus',(x,y,z0+.42),r*1.22,.16,material,32,.035)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r*.91, radius2=r*.72, depth=height-.9, location=(x,y,z0+height/2))
    shaft=bpy.context.object; shaft.name='Fluted classical column'; shaft.data.materials.append(material)
    for j in range(16):
        a=2*pi*j/16; rr=r*.73
        ob=uv_sphere('Subtle column flute',(x+rr*cos(a),y+rr*sin(a),z0+height/2),(.035,.035,(height-1.0)/2),light_stone,12,8)
    cylinder('Column neck',(x,y,z0+height-.42),r*1.08,.18,material,32,.025)
    cube('Column capital',(x,y,z0+height-.19),(r*2.65,r*2.65,.30),material,.08)

cube('Large grassy ground',(0,7,-.65),(150,150,1.2),grass,.2)
for x,y,sx,sy,sz in [(-34,36,28,12,12),(0,43,38,14,15),(37,39,27,12,11)]:
    h=uv_sphere('Soft rolling forest hill',(x,y,5),(sx,sy,sz),grass,48,24)
    for p in h.data.polygons:p.use_smooth=True

cube('Central main facade',(0,0,5.1),(23,8,10.2),limestone,.22)
cube('Left extended wing',(-17,1,4.0),(13,7,8),limestone,.18)
cube('Right extended wing',(17,1,4.0),(13,7,8),limestone,.18)
for z,depth in [(1.0,.45),(9.6,.42)]:
    architrave(0,-4.08,z,23.3,.55,depth)
    architrave(-17,-2.58,z,13.3,.48,depth); architrave(17,-2.58,z,13.3,.48,depth)
cube('Portico entablature',(0,-5.2,9.5),(14.4,1.2,.85),light_stone,.12)
verts=[(-7.2,-5.85,9.9),(7.2,-5.85,9.9),(0,-5.85,12.5),(-7.2,-4.65,9.9),(7.2,-4.65,9.9),(0,-4.65,12.5)]
faces=[(0,1,2),(3,5,4),(0,3,4,1),(0,2,5,3),(1,4,5,2)]
me=bpy.data.meshes.new('Pediment mesh'); me.from_pydata(verts,[],faces); me.materials.append(light_stone); ob=bpy.data.objects.new('Classical triangular pediment',me); bpy.context.collection.objects.link(ob)
for x in [-5.7,-3.8,-1.9,0,1.9,3.8,5.7]: column(x,-5.7,1.0,8.0,.43)
for x in [-10.2,10.2]:
    cube('Facade pilaster',(x,-4.12,5.0),(.5,.38,8.5),light_stone,.05)
for x in [-10.8,-7.8,7.8,10.8]:
    for z in [3.1,7.0]:
        cube('Window shadow reveal',(x,-4.13,z),(1.35,.16,2.05),shadow_stone,.04)
        cube('Dark window glass',(x,-4.24,z),(1.03,.08,1.72),glass,.025)
        for dx in [-.57,.57]: cube('Window stone jamb',(x+dx,-4.3,z),(.12,.18,2.12),light_stone,.025)
        cube('Window lintel',(x,-4.3,z+1.05),(1.3,.18,.14),light_stone,.025)
        cube('Window sill',(x,-4.34,z-1.05),(1.4,.22,.18),light_stone,.035)
        cube('Window mullion',(x,-4.31,z),(.055,.1,1.7),limestone,.01)
for side in [-1,1]:
    for x in ([ -21,-17,-13] if side==-1 else [13,17,21]):
        for z in [3.0,6.2]:
            cube('Wing window recess',(x,-2.62,z),(1.25,.12,1.7),shadow_stone,.03)
            cube('Wing dark glazing',(x,-2.72,z),(1.0,.06,1.42),glass,.02)
            cube('Wing window sill',(x,-2.78,z-.88),(1.4,.18,.12),light_stone,.02)
for x in [i*.55-23 for i in range(84)]:
    if abs(x)<7.4: continue
    cylinder('Baluster',(x,-3.1,10.05),.07,.72,light_stone,12,.015)
cube('Balustrade top rail',(0,-3.1,10.45),(46,.35,.18),light_stone,.05)

cylinder('Rotunda lower ring',(0,0,11.1),8.0,1.0,light_stone,96,.12)
cylinder('Rotunda drum',(0,0,14.8),7.45,7.0,limestone,96,.08)
cylinder('Rotunda upper cornice',(0,0,18.35),7.8,.55,light_stone,96,.08)
for i in range(32):
    a=2*pi*i/32; x=7.25*cos(a); y=7.25*sin(a)
    cylinder('Rotunda pilaster shaft',(x,y,14.8),.19,6.4,light_stone,16,.025)
    cylinder('Rotunda pilaster capital',(x,y,18.05),.34,.28,light_stone,16,.03)
    cylinder('Rotunda pilaster base',(x,y,11.55),.31,.35,light_stone,16,.03)
D=uv_sphere('Great ribbed stone dome',(0,0,20.1),(7.35,7.35,7.6),light_stone,96,48)
for i in range(32):
    a=2*pi*i/32
    pts=[]
    for k in range(20):
        t=.10+(1.36*k/19); r=7.34*cos(t); z=20.1+7.58*sin(t)
        pts.append((r*cos(a),r*sin(a),z))
    cu=bpy.data.curves.new('Dome raised rib curve','CURVE'); cu.dimensions='3D'; cu.bevel_depth=.055; cu.bevel_resolution=3
    sp=cu.splines.new('POLY'); sp.points.add(len(pts)-1)
    for q,co in zip(sp.points,pts):q.co=(*co,1)
    curve=bpy.data.objects.new('Dome radial rib',cu); bpy.context.collection.objects.link(curve); cu.materials.append(limestone)
for i in range(32):
    a=2*pi*i/32; r=7.32
    ob=cube('Small dome clerestory window',(r*cos(a),r*sin(a),20.7),(.38,.12,.82),glass,.025)
    ob.rotation_euler[2]=a+pi/2
cylinder('Lantern base',(0,0,27.25),1.15,.35,roof,48,.05)
cylinder('Lantern tower',(0,0,28.55),.82,2.3,light_stone,48,.06)
for i in range(12):
    a=2*pi*i/12; x=.8*cos(a); y=.8*sin(a)
    cube('Lantern narrow window',(x,y,28.55),(.13,.08,1.25),shadow_stone,.02)
cylinder('Lantern cap',(0,0,29.75),.95,.25,light_stone,48,.05)
bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.72,radius2=.10,depth=1.5,location=(0,0,30.55)); bpy.context.object.name='Lantern pointed finial'; bpy.context.object.data.materials.append(roof)

for i in range(12):
    z=.35+i*.29; y=-7.0-i*.48; width=14.0-i*.35
    cube('Broad stone stair tread',(0,y,z),(width,1.05,.42),light_stone,.07)
cube('Upper landing',(0,-12.9,3.55),(14.2,2.3,.5),limestone,.08)

cube('Main approach path',(0,-27,-.02),(13,30,.20),pathmat,.08)
for row in range(22):
    y=-13.5-row*1.25
    for col in range(7):
        x=(col-3)*1.78 + random.uniform(-.18,.18)
        slab=cube('Irregular hand-laid paving stone',(x,y+random.uniform(-.18,.18),.10),(1.62+random.uniform(-.15,.1),1.08,.10),random.choice([pathmat,limestone,shadow_stone]),.045)
        slab.rotation_euler[2]=random.uniform(-.035,.035)
for side in [-1,1]:
    cube('Low garden edging',(side*7.2,-22,.18),(.35,26,.35),light_stone,.05)
    for n in range(90):
        x=side*random.uniform(7.8,11.0); y=random.uniform(-35,-7)
        uv_sphere('Small flower head',(x,y,.38+random.uniform(0,.15)),(.12,.12,.12),random.choice([flower_red,flower_yellow,leaf_green]),12,8)

def lamp(x,y):
    cylinder('Lamp iron foot',(x,y,.38),.28,.55,metal,20,.035)
    cylinder('Tall lamp post',(x,y,2.35),.095,3.6,metal,20,.02)
    cylinder('Lamp collar',(x,y,4.05),.18,.16,roof,20,.02)
    uv_sphere('Glowing frosted globe',(x,y,4.48),(.48,.48,.48),None,24,16)
    bulb=bpy.data.materials.new('Warm luminous lamp glass'); bulb.use_nodes=True
    p=bulb.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(1,.72,.35,1); p.inputs['Emission Color'].default_value=(1,.55,.18,1); p.inputs['Emission Strength'].default_value=1.7; p.inputs['Roughness'].default_value=.25
    bpy.context.object.data.materials.append(bulb)
    cylinder('Lamp crown',(x,y,4.98),.26,.12,metal,20,.02)
    bpy.ops.object.light_add(type='POINT',location=(x,y,4.45)); l=bpy.context.object; l.name='Lamp warm glow'; l.data.energy=32; l.data.color=(1,.58,.28); l.data.shadow_soft_size=1.0
for y in [-8,-14,-20,-26,-32]:
    for x in [-8.1,8.1]: lamp(x,y)

def tree(x,y,height,orange=False):
    trunkmat=mat('Tree bark '+str(round(x,1)),(.16,.075,.035),.95,0,12,.25)
    cylinder('Tree trunk',(x,y,height*.34),.28,height*.68,trunkmat,12,.04)
    for j in range(5):
        a=j*2*pi/5; beam_between('Branch',(x,y,height*.45),(x+1.0*cos(a),y+1.0*sin(a),height*.85),.12,trunkmat,8)
    for j in range(18):
        a=random.random()*2*pi; r=random.uniform(.4,2.0); z=random.uniform(height*.55,height*1.05)
        uv_sphere('Painterly tree canopy',(x+r*cos(a),y+r*sin(a),z),(random.uniform(.65,1.15),random.uniform(.65,1.15),random.uniform(.7,1.25)),leaf_orange if orange else leaf_green,16,10)
for x,y,h,o in [(-24,-3,13,True),(24,0,14,False),(-31,15,17,True),(30,16,16,False)]:tree(x,y,h,o)

bpy.ops.object.camera_add(location=(39,-78,31)); cam=bpy.context.object; cam.name='Hero architectural camera'
target=Vector((0,-1,14)); cam.rotation_euler=(target-Vector(cam.location)).to_track_quat('-Z','Y').to_euler(); cam.data.lens=48; cam.data.dof.use_dof=True
focus=bpy.data.objects.new('Focus on central facade',None); bpy.context.collection.objects.link(focus); focus.location=(0,-4,13); cam.data.dof.focus_object=focus; cam.data.dof.aperture_fstop=8
scene.camera=cam
bpy.ops.object.light_add(type='SUN',location=(-30,-35,55)); sun=bpy.context.object; sun.name='Golden hour sunlight'; sun.rotation_euler=(math.radians(25),math.radians(-28),math.radians(-28)); sun.data.energy=2.2; sun.data.angle=math.radians(18)
bpy.ops.object.light_add(type='AREA',location=(5,-30,27)); fill=bpy.context.object; fill.name='Large soft sky fill'; fill.data.energy=1800; fill.data.shape='DISK'; fill.data.size=24; fill.rotation_euler=(Vector((0,0,12))-fill.location).to_track_quat('-Z','Y').to_euler()
world=bpy.data.worlds.new('Blue evening sky') if not bpy.data.worlds else bpy.data.worlds[0]
scene.world=world; world.use_nodes=True
bg=world.node_tree.nodes.get('Background'); bg.inputs['Color'].default_value=(.12,.20,.38,1); bg.inputs['Strength'].default_value=.45
vol=bpy.data.materials.new('Distant atmospheric haze'); vol.use_nodes=True
nodes=vol.node_tree.nodes; nodes.clear(); out=nodes.new('ShaderNodeOutputMaterial'); principled=nodes.new('ShaderNodeVolumePrincipled'); principled.inputs['Density'].default_value=.003; principled.inputs['Color'].default_value=(.55,.63,.8,1); vol.node_tree.links.new(principled.outputs['Volume'],out.inputs['Volume'])
cube('Atmosphere volume container',(0,5,25),(180,180,90),vol,0)

scene.view_settings.view_transform='AgX'
scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG'; scene.render.filepath='//anime_capitol_realism.png'
scene.render.film_transparent=False
bpy.ops.object.select_all(action='DESELECT'); cam.select_set(True); bpy.context.view_layer.objects.active=cam
print('Scene built. Press F12 to render, or run in background to save anime_capitol_realism.png.')
