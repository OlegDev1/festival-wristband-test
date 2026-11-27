"""Renders the band's scroll turn as a frame sequence for the website, plus frames.json (framing + screen geometry).

The website (src/band/band.js) plays these frames as you scroll: frame 0 = opening pose (side, three-quarter),
last frame = feature pose (screen facing you). The HTML screen is laid on top in CSS 3D with the same pose.

On a Mac (Apple GPU):  sh blender/render-mac.sh   (or: Blender -b band.blend -P render.py)
Options (env vars): FRAMES=60  PPU=2 (pixels per CSS px at --k=1; 3 = full)  SAMPLES=48 (128 = full)  OUT=<website>/frames  ONLY=0,30,59  GPU=1
                    MOBILE=0.7 (also writes a smaller copy of every frame to frames/m/ for phones; 0 = off)
"""
import bpy, math, os, json, sys
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(bpy.data.filepath or __file__))
sys.path.insert(0, HERE)
S = 0.01
D = 1800                                  # camera distance in BU (= CSS perspective at --k=1)
M = Matrix(((1, 0, 0), (0, 0, -1), (0, -1, 0)))

# poses (degrees, CSS rotateX / rotateY): keep in sync with src/band/band.js
R0 = dict(rx=0.0, ry=-62.0)               # opening: three-quarter side view, the loop reads as a ring
R1 = dict(rx=4.0, ry=-8.0)                # features: screen toward you, a slight turn so the flank shows

FRAMES = int(os.environ.get('FRAMES', 60))
PPU = float(os.environ.get('PPU', 2))         # medium (full quality: PPU=3 SAMPLES=128)
SAMPLES = int(os.environ.get('SAMPLES', 48))  # denoised, so 48 is clean at this size
OUT = os.environ.get('OUT', os.path.join(HERE, '..', 'frames') if os.path.basename(HERE) == 'blender' else os.path.join(HERE, 'frames'))
ONLY = [int(x) for x in os.environ['ONLY'].split(',')] if os.environ.get('ONLY') else None
MARGIN = 14                               # BU around the band in every frame
MOBILE = float(os.environ.get('MOBILE', 0.7))


def css_rot(rx, ry):
    a, b = math.radians(rx), math.radians(ry)
    Rx = Matrix(((1, 0, 0), (0, math.cos(a), -math.sin(a)), (0, math.sin(a), math.cos(a))))
    Ry = Matrix(((math.cos(b), 0, math.sin(b)), (0, 1, 0), (-math.sin(b), 0, math.cos(b))))
    return M @ (Rx @ Ry) @ M


def pose_at(i):
    t = i / (FRAMES - 1)
    return R0['rx'] + (R1['rx'] - R0['rx']) * t, R0['ry'] + (R1['ry'] - R0['ry']) * t


def set_pose(rx, ry):
    bpy.data.objects['Band'].matrix_world = css_rot(rx, ry).to_4x4()
    bpy.context.view_layer.update()


def band_points(step=3):
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for ob in bpy.data.objects:
        if ob.type != 'MESH':
            continue
        ev = ob.evaluated_get(dg); me = ev.to_mesh()
        mw = ev.matrix_world
        pts += [mw @ me.vertices[k].co for k in range(0, len(me.vertices), step)]
        ev.to_mesh_clear()
    return pts


def proj(p):
    """world point -> CSS px at k=1 on the band-centre plane (x right, y down), camera on -Y at D"""
    x, y, z = p.x / S, p.y / S, p.z / S
    f = D / (D + y)
    return x * f, -z * f


def union_box():
    xs, ys = [], []
    for i in range(0, FRAMES, max(1, FRAMES // 30)) or [0]:
        set_pose(*pose_at(i))
        for p in band_points():
            x, y = proj(p); xs.append(x); ys.append(y)
    set_pose(*pose_at(FRAMES - 1))
    for p in band_points():
        x, y = proj(p); xs.append(x); ys.append(y)
    return min(xs) - MARGIN, min(ys) - MARGIN, max(xs) + MARGIN, max(ys) + MARGIN


def ring_centre(rx, ry):
    """centre of the band's on-screen extent for a pose (the site uses it to centre the ring in the hero)"""
    set_pose(rx, ry)
    xy = [proj(p) for p in band_points()]
    xs = [a for a, b in xy]; ys = [b for a, b in xy]
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2


def setup_camera(box):
    sc = bpy.context.scene; cam = sc.camera
    x0, y0, x1, y1 = box
    rx, ry = round((x1 - x0) * PPU), round((y1 - y0) * PPU)
    Fw, Fh = rx / PPU, ry / PPU
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    x0, x1, y0, y1 = cx - Fw / 2, cx + Fw / 2, cy - Fh / 2, cy + Fh / 2
    Fm = max(Fw, Fh)
    cd = cam.data
    cd.type = 'PERSP'; cd.sensor_fit = 'AUTO'; cd.sensor_width = 36
    cd.lens = 18 * D / (Fm / 2)
    cd.shift_x = cx / Fm; cd.shift_y = -cy / Fm
    sc.render.resolution_x, sc.render.resolution_y = rx, ry
    sc.render.resolution_percentage = 100
    return dict(x=round(x0, 3), y=round(y0, 3), w=round(Fw, 3), h=round(Fh, 3), px=[rx, ry])


def small(src, dst, px, quality):
    """scaled copy of a rendered frame (Blender scales and saves it; no extra software needed)"""
    img = bpy.data.images.load(src)
    img.scale(px[0], px[1])
    img.file_format = 'WEBP'
    img.save(filepath=dst, quality=quality)
    bpy.data.images.remove(img)


def use_gpu():
    if os.environ.get('GPU', '1') == '0':
        return 'CPU'
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
            try:
                prefs.compute_device_type = kind
            except TypeError:
                continue
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if devs:
                for d in prefs.devices:
                    d.use = d.type == kind
                bpy.context.scene.cycles.device = 'GPU'
                return kind
    except Exception as e:
        print('GPU setup failed, using CPU:', e)
    bpy.context.scene.cycles.device = 'CPU'
    return 'CPU'


def main():
    sc = bpy.context.scene
    os.makedirs(OUT, exist_ok=True)
    dev = use_gpu()
    sc.cycles.samples = SAMPLES
    box = setup_camera(union_box())
    cx, cy = ring_centre(R0['rx'], R0['ry'])
    meta = dict(frames=FRAMES, r0=R0, r1=R1, box=box, ppu=PPU, d=D, ring0=[round(cx, 2), round(cy, 2)],
                screen=dict(w=156 - 32, h=340 - 32, z=33.05), file='f%03d.webp')
    if MOBILE > 0:      # smaller copy for phones: the site picks it when it is sharp enough for the screen
        meta['m'] = dict(dir='m/', px=[int(box['px'][0] * MOBILE), int(box['px'][1] * MOBILE)])
        os.makedirs(os.path.join(OUT, 'm'), exist_ok=True)
    with open(os.path.join(OUT, 'frames.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    print('device', dev, 'box', box, 'ring0', cx, cy, flush=True)
    ims = sc.render.image_settings
    ims.file_format = 'WEBP'; ims.color_mode = 'RGBA'; ims.quality = int(os.environ.get('QUALITY', 86))
    for i in (ONLY or range(FRAMES)):
        set_pose(*pose_at(i))
        sc.render.filepath = os.path.join(OUT, 'f%03d.webp' % i)
        bpy.ops.render.render(write_still=True)
        if MOBILE > 0:
            small(sc.render.filepath, os.path.join(OUT, 'm', 'f%03d.webp' % i), meta['m']['px'], ims.quality)
        print('frame', i + 1, '/', FRAMES, flush=True)
    print('done ->', OUT)


if __name__ == '__main__':
    main()
