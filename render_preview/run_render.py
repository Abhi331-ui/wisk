import bpy, sys, os
here = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(here, 'anime_capitol_blender_scene.py')).read())
pct = int(sys.argv[1]) if len(sys.argv) > 1 else 100
bpy.context.scene.render.resolution_percentage = pct
bpy.context.scene.render.filepath = os.path.join(here, f'anime_capitol_realism_{pct}.png')
bpy.ops.render.render(write_still=True)
print('WROTE', bpy.context.scene.render.filepath)
