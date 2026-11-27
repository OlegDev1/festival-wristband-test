"""Builds the Tribu festival band scene (pill module + woven plum loop) and saves band.blend.

Units: 1 "band unit" (BU) = 1 CSS px at --k = 1 on the website; Blender units = BU * 0.01.
Band local axes (Blender): X = across the wrist, Z = along the module's long axis (up), -Y = the screen's facing direction.
The camera sits 1800 BU in front (-Y), the same distance as the website's CSS perspective, so the HTML screen lines up.

Run:  python3 build.py            (or: blender -b -P build.py)
"""
import bpy, bmesh, math, os, json
import numpy as np
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
S = 0.01                      # BU -> Blender units

# ---- dimensions (BU) -------------------------------------------------------------------------------------------
W, H, T = 156, 340, 60        # module width, length, thickness
R = W / 2                     # radius of the pill ends
C = H / 2 - R                 # half length of the straight sides
GLASS_TOP = 33                # glass flat top, in front of the module centre
SCREEN_INSET = 16             # lit screen area, inset from the module outline
BACK = 20                     # case back (was 30: the case is thinner now; glass and screen stay where they were)
STRAP_W, STRAP_T = 136, 16    # strap width (around the wrist) and thickness (soft silicone)
STRAP_W0 = 152                # strap width where it grows out of the cradle behind the case
HOLE_R, HOLE_STEP = 10, 44    # strap holes: radius, spacing along the loop
STRAP_FRONT = T / 2 + STRAP_T / 2 + 1     # (old) strap behind the module; only the optional connectors use it
STRAP_Y = 12                  # strap centre line inside the silicone cradle, in the back half of the case
STRAP_PIN = 110               # straight inside the case only; it curves back before it leaves the case ends
WRIST_D, WRIST_H = 410, 178   # loop: long front to back, low (top barely above the case ends, like the photo)

NL, NA = 24, 56               # points per straight side / per pill end


def stadium(inset):
    """pill outline (x, z) inset by `inset`; same point count for every inset so rings can be lofted"""
    r = R - inset
    pts = []
    for i in range(NL):                                   # right side, bottom -> top
        pts.append((r, -C + 2 * C * i / NL))
    for i in range(NA):                                   # top end, right -> left
        a = math.pi * i / NA
        pts.append((r * math.cos(a), C + r * math.sin(a)))
    for i in range(NL):                                   # left side, top -> bottom
        pts.append((-r, C - 2 * C * i / NL))
    for i in range(NA):                                   # bottom end, left -> right
        a = math.pi + math.pi * i / NA
        pts.append((r * math.cos(a), -C + r * math.sin(a)))
    return pts


def loft(name, rings, cap_front=False, cap_back=False, back_mat=None):
    """rings: list of (y, inset) from front (-y) to back; returns a smooth-shaded mesh object (sharp at the caps)"""
    bm = bmesh.new()
    loops = []
    for y, ins in rings:
        loops.append([bm.verts.new((x * S, y * S, z * S)) for x, z in stadium(ins)])
    n = len(loops[0])
    for a, b in zip(loops, loops[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    caps = []
    if cap_front:
        caps.append(bm.faces.new(list(reversed(loops[0]))))
    if cap_back:
        f = bm.faces.new(loops[-1]); caps.append(f)
        if back_mat is not None:
            f.material_index = 1
    bm.normal_update()
    for f in bm.faces:
        f.smooth = True
    for f in caps:
        f.smooth = False
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    for f in caps:
        pass
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


# ---- materials ---------------------------------------------------------------------------------------------------
def principled(name, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']
    for k, v in kw.items():
        p.inputs[k].default_value = v
    return m, p


def mat_silver():
    """bead-blasted, champagne anodised aluminium: satin metal with a fine grain"""
    m, p = principled('Aluminium', **{'Base Color': (0.80, 0.68, 0.54, 1), 'Metallic': 1.0, 'Roughness': 0.27,
                                        'Anisotropic': 0.15, 'Coat Weight': 0.25, 'Coat Roughness': 0.12})
    N, L = m.node_tree.nodes, m.node_tree.links
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 2500; nz.inputs['Detail'].default_value = 1
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.08
    L.new(nz.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs['Normal'], p.inputs['Normal'])
    return m


def mat_glass():
    m, p = principled('Glass', **{'Base Color': (0.0, 0.0, 0.0, 1), 'Roughness': 0.0, 'IOR': 1.52,
                                    'Specular IOR Level': 0.7, 'Coat Weight': 1.0, 'Coat Roughness': 0.0,
                                    'Coat IOR': 1.52})
    return m


def mat_screen():
    """the lit area of the display; black when off (the website lays the live UI on top of it)"""
    m, p = principled('Screen', **{'Base Color': (0.002, 0.002, 0.003, 1), 'Roughness': 0.03, 'IOR': 1.77,
                                     'Coat Weight': 1.0, 'Coat Roughness': 0.02})
    return m


def mat_back():
    m, p = principled('Back', **{'Base Color': (0.025, 0.022, 0.024, 1), 'Roughness': 0.45})
    return m


def mat_silicone(color=(0.86, 0.66, 0.52)):
    """warm peach-cream soft-touch silicone: soft subsurface, low sheen, faint micro texture"""
    m, p = principled('Silicone', **{'Base Color': (*color, 1), 'Roughness': 0.48, 'Specular IOR Level': 0.45,
                                       'Subsurface Weight': 0.35, 'Subsurface Radius': (1.0, 0.55, 0.35),
                                       'Subsurface Scale': 0.03, 'Coat Weight': 0.12, 'Coat Roughness': 0.35,
                                       'Sheen Weight': 0.15, 'Sheen Roughness': 0.5})
    N, L = m.node_tree.nodes, m.node_tree.links
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1800; nz.inputs['Detail'].default_value = 2
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.05
    L.new(nz.outputs['Fac'], bump.inputs['Height']); L.new(bump.outputs['Normal'], p.inputs['Normal'])
    m['u_node'] = ''
    return m


def mat_strap(color=(0.072, 0.006, 0.040)):
    """deep plum woven nylon: procedural plain weave in UV space (u along the strap, v around the cross-section)"""
    m = bpy.data.materials.new('Strap')
    m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    p = N['Principled BSDF']
    p.location = (900, 0)

    def math_node(op, a=None, b=None, x=0, y=0, val_b=None, val_a=None):
        n = N.new('ShaderNodeMath'); n.operation = op; n.location = (x, y)
        if a is not None: L.new(a, n.inputs[0])
        elif val_a is not None: n.inputs[0].default_value = val_a
        if b is not None: L.new(b, n.inputs[1])
        elif val_b is not None: n.inputs[1].default_value = val_b
        return n.outputs[0]

    tc = N.new('ShaderNodeTexCoord'); tc.location = (-1400, 0)
    sep = N.new('ShaderNodeSeparateXYZ'); sep.location = (-1200, 0)
    L.new(tc.outputs['UV'], sep.inputs[0])
    # UV units are 100 BU. Weft (across the strap) every ~2.6 BU, warp (along) every ~3.4 BU
    U = math_node('MULTIPLY', sep.outputs[0], val_b=1.0, x=-1000, y=100)          # frequency set below (exact tiling)
    V = math_node('MULTIPLY', sep.outputs[1], val_b=29.0, x=-1000, y=-100)
    m['u_node'] = U.node.name
    fu = math_node('FRACT', U, x=-800, y=200); cu = math_node('FLOOR', U, x=-800, y=100)
    fv = math_node('FRACT', V, x=-800, y=-100); cv = math_node('FLOOR', V, x=-800, y=-200)
    par = math_node('FLOORED_MODULO', math_node('ADD', cu, cv, x=-600, y=0), val_b=2.0, x=-450, y=0)
    # thread cross profiles: sin(pi*f)^0.6, rounder threads
    su = math_node('POWER', math_node('SINE', math_node('MULTIPLY', fu, val_b=math.pi, x=-600, y=250), x=-450, y=250), val_b=0.6, x=-300, y=250)
    sv = math_node('POWER', math_node('SINE', math_node('MULTIPLY', fv, val_b=math.pi, x=-600, y=-250), x=-450, y=-250), val_b=0.6, x=-300, y=-250)
    # weft on top (ribs across the strap): height = su-profile across U, arched along V; warp on top: the reverse
    weft = math_node('MULTIPLY', su, math_node('ADD', math_node('MULTIPLY', sv, val_b=0.35, x=-150, y=-350), val_b=0.65, x=0, y=-350), x=150, y=250)
    warp = math_node('MULTIPLY', sv, math_node('ADD', math_node('MULTIPLY', su, val_b=0.35, x=-150, y=350), val_b=0.55, x=0, y=350), x=150, y=-250)
    mix = N.new('ShaderNodeMix'); mix.data_type = 'FLOAT'; mix.location = (350, 0)
    L.new(par, mix.inputs['Factor']); L.new(weft, mix.inputs['A']); L.new(warp, mix.inputs['B'])
    h = mix.outputs['Result']
    # fine fibre noise
    nz = N.new('ShaderNodeTexNoise'); nz.location = (150, -500); nz.inputs['Scale'].default_value = 900; nz.inputs['Detail'].default_value = 2
    L.new(tc.outputs['UV'], nz.inputs['Vector'])
    hh = math_node('ADD', h, math_node('MULTIPLY', nz.outputs['Fac'], val_b=0.18, x=350, y=-500), x=550, y=-200)
    bump = N.new('ShaderNodeBump'); bump.location = (700, -300)
    bump.inputs['Strength'].default_value = 0.85; bump.inputs['Distance'].default_value = 0.0035
    L.new(hh, bump.inputs['Height']); L.new(bump.outputs['Normal'], p.inputs['Normal'])
    # colour: darker in the gaps, a touch lighter on the crowns
    ramp = N.new('ShaderNodeValToRGB'); ramp.location = (550, 250)
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (color[0] * 0.35, color[1] * 0.35, color[2] * 0.35, 1)
    ramp.color_ramp.elements[1].position = 0.9
    ramp.color_ramp.elements[1].color = (color[0] * 1.25, color[1] * 1.25, color[2] * 1.25, 1)
    L.new(hh, ramp.inputs['Fac'])
    L.new(ramp.outputs['Color'], p.inputs['Base Color'])
    rough = math_node('SUBTRACT', val_a=0.78, b=math_node('MULTIPLY', h, val_b=0.22, x=550, y=50), x=700, y=50)
    L.new(rough, p.inputs['Roughness'])
    p.inputs['Sheen Weight'].default_value = 0.7
    p.inputs['Sheen Roughness'].default_value = 0.35
    p.inputs['Sheen Tint'].default_value = (1.0, 0.62, 0.86, 1)
    p.inputs['Specular IOR Level'].default_value = 0.45
    return m


# ---- strap path ----------------------------------------------------------------------------------------------------
def strap_path(n_out=480):
    """closed centre line of the loop in the band's Y-Z plane (BU): flat behind the module, round around the wrist.
       Starts at the back of the loop so the texture seam is hidden."""
    yc = STRAP_Y + WRIST_D / 2 + STRAP_T / 2
    ay = WRIST_D / 2 + STRAP_T / 2
    t = np.linspace(0, 2 * np.pi, 3000, endpoint=False) + np.pi
    c, s = np.cos(t), np.sin(t)
    e = np.where(c >= 0, 2 / 5.0, 2 / 2.3)
    y = yc - ay * np.sign(c) * np.abs(c) ** e
    z = WRIST_H * np.sign(s) * np.abs(s) ** e
    pin = (y < yc) & (np.abs(z) <= STRAP_PIN)
    y = np.where(pin, STRAP_Y, y)
    for _ in range(1500):                                  # relax into a smooth curve, keeping the flat part flat
        y2 = 0.5 * y + 0.25 * (np.roll(y, 1) + np.roll(y, -1))
        z2 = 0.5 * z + 0.25 * (np.roll(z, 1) + np.roll(z, -1))
        y = np.where(pin, STRAP_Y, y2); z = np.where(pin, z, z2)
    P = np.stack([y, z], 1)
    seg = np.linalg.norm(np.roll(P, -1, 0) - P, axis=1)
    cum = np.concatenate([[0], np.cumsum(seg)])
    Ltot = cum[-1]
    d = np.linspace(0, Ltot, n_out, endpoint=False)
    Pc = np.vstack([P, P[:1]])
    yy = np.interp(d, cum, Pc[:, 0]); zz = np.interp(d, cum, Pc[:, 1])
    return np.stack([yy, zz], 1), Ltot, yc


def strap_section(w=STRAP_W, t=STRAP_T):
    """rounded-rectangle cross-section: list of (x, n) with n = offset along the outward normal; perimeter params"""
    w2, t2 = w / 2, t / 2
    cr = min(6.5, t2 - 0.01, w2 - 0.01)
    sec = []
    def arc(cx, cn, a0):
        for k in range(9):
            a = a0 + k / 8 * math.pi / 2
            sec.append((cx + cr * math.cos(a), cn + cr * math.sin(a)))
    def line(x0, n0, x1, n1, k=10):
        for i in range(1, k):
            f = i / k; sec.append((x0 + (x1 - x0) * f, n0 + (n1 - n0) * f))
    arc(w2 - cr, t2 - cr, 0); line(w2 - cr, t2, -w2 + cr, t2, 40)
    arc(-w2 + cr, t2 - cr, math.pi / 2); line(-w2, t2 - cr, -w2, -t2 + cr, 3)
    arc(-w2 + cr, -t2 + cr, math.pi); line(-w2 + cr, -t2, w2 - cr, -t2, 40)
    arc(w2 - cr, -t2 + cr, 3 * math.pi / 2); line(w2, -t2 + cr, w2, t2 - cr, 3)
    sec.append(sec[0])
    per = [0.0]
    for a, b in zip(sec, sec[1:]):
        per.append(per[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return sec, per


def build_strap(mat):
    P, Ltot, yc = strap_path()
    sec, per = strap_section()
    N, M = len(P), len(sec)
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new('UVMap')
    rings = []
    for i in range(N + 1):
        q = P[i % N]; q0 = P[(i - 1) % N]; q1 = P[(i + 1) % N]
        ty, tz = q1 - q0; tl = math.hypot(ty, tz)
        ny, nz = tz / tl, -ty / tl
        if ny * (q[0] - yc) + nz * q[1] < 0:                  # make the normal point out of the loop
            ny, nz = -ny, -nz
        # full module width where it leaves the module, easing to the wrist width as it curves back
        f = min(1.0, max(0.0, (q[0] - STRAP_Y - 10) / 120)); f = f * f * (3 - 2 * f)
        sec_i, _ = strap_section(STRAP_W0 + (STRAP_W - STRAP_W0) * f)
        rings.append([bm.verts.new((x * S, (q[0] + ny * n) * S, (q[1] + nz * n) * S)) for x, n in sec_i])
    seg = np.linalg.norm(np.roll(P, -1, 0) - P, axis=1); cum = np.concatenate([[0], np.cumsum(seg)])
    for i in range(N):
        a, b = rings[i], rings[i + 1]
        for k in range(M - 1):
            f = bm.faces.new((a[k], b[k], b[k + 1], a[k + 1]))
            f.smooth = True
            uvs = [(cum[i] / 100, per[k] / 100), (cum[i + 1] / 100, per[k] / 100),
                   (cum[i + 1] / 100, per[k + 1] / 100), (cum[i] / 100, per[k + 1] / 100)]
            for loop, uv in zip(f.loops, uvs):
                loop[uv_layer].uv = uv
    # weld the seam ring and the closing profile point
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.normal_update()
    me = bpy.data.meshes.new('Strap'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('Strap', me); bpy.context.collection.objects.link(ob)
    ob.data.materials.append(mat)
    if mat.get('u_node'):
        # exact weave tiling along the loop: whole number of warp cells around Ltot
        cells = round(Ltot / 3.4)
        un = mat.node_tree.nodes[mat['u_node']]
        un.inputs[1].default_value = cells / (Ltot / 100)
    return ob, Ltot, P, cum, yc


def build_clasp(P, cum, Ltot, yc, sil_mat, pin_mat):
    """the buckle on the back of the loop, like the photo: the holed end lies on the inner face of the strap (holes
       read as dimples), a metal pin pokes in through one hole, and a keeper holds the rounded tip.
       s = arc length from the back of the loop; s > 0 runs toward the bottom of the band."""
    Pc = np.vstack([P, P[:1]])
    def frame_at(s):
        s = s % Ltot
        y = np.interp(s, cum, Pc[:, 0]); z = np.interp(s, cum, Pc[:, 1])
        d = 2.0
        y0 = np.interp((s - d) % Ltot, cum, Pc[:, 0]); z0 = np.interp((s - d) % Ltot, cum, Pc[:, 1])
        y1 = np.interp((s + d) % Ltot, cum, Pc[:, 0]); z1 = np.interp((s + d) % Ltot, cum, Pc[:, 1])
        ty, tz = y1 - y0, z1 - z0; tl = math.hypot(ty, tz); ty, tz = ty / tl, tz / tl
        ny, nz = tz, -ty
        if ny * (y - yc) + nz * z < 0:
            ny, nz = -ny, -nz
        return Vector((0, y, z)), Vector((0, ny, nz)), Vector((0, ty, tz))

    def smooth(f):
        f = min(1.0, max(0.0, f)); return f * f * (3 - 2 * f)

    s_a, s_b = -0.27 * Ltot, 0.17 * Ltot          # the holed end: from the upper back to its tip at the lower back
    RAMP, TIP = 70.0, (STRAP_W - 4) / 2
    W = STRAP_W - 3
    # ---- the holed end: a strap layer swept along the loop, rising out of it and ending in a round tip
    bm = bmesh.new(); rings = []
    n = int((s_b - s_a) / 2.5)
    for i in range(n + 1):
        s = s_a + (s_b - s_a) * i / n
        q, nrm, _ = frame_at(s)
        r = smooth((s - s_a) / RAMP)
        off = -STRAP_T * r                                # 0 = inside the strap, -STRAP_T = lying on its inner face
        th = STRAP_T - 3 + 3 * r
        d = s_b - s
        w = W if d >= TIP else max(4.0, 2 * TIP * math.sqrt(max(0.0, 1 - ((TIP - d) / TIP) ** 2)))
        sec, _ = strap_section(w, th)
        rings.append([bm.verts.new(((x) * S, (q.y + nrm.y * (off + nn)) * S, (q.z + nrm.z * (off + nn)) * S))
                      for x, nn in sec[:-1]])
    m = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for k in range(m):
            f = bm.faces.new((a[k], b[k], b[(k + 1) % m], a[(k + 1) % m])); f.smooth = True
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    bm.normal_update()
    me = bpy.data.meshes.new('StrapEnd'); bm.to_mesh(me); bm.free()
    end = bpy.data.objects.new('StrapEnd', me); bpy.context.collection.objects.link(end)
    end.data.materials.append(sil_mat)
    # ---- holes through the holed end only (the strap underneath shows through: dimples)
    hs = [s_a + RAMP + 22 + k * HOLE_STEP for k in range(40)]
    hs = [s for s in hs if s < s_b - TIP - 70]
    pin_s = hs[len(hs) // 2]
    bm = bmesh.new()
    for s in hs:
        q, nrm, _ = frame_at(s)
        M4 = Matrix.Translation((q - nrm * STRAP_T) * S) @ nrm.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=HOLE_R * S, radius2=HOLE_R * S,
                              depth=STRAP_T * 1.6 * S, matrix=M4)
    cme = bpy.data.meshes.new('Holes'); bm.to_mesh(cme); bm.free()
    cut = bpy.data.objects.new('Holes', cme); bpy.context.collection.objects.link(cut)
    mod = end.modifiers.new('holes', 'BOOLEAN'); mod.operation = 'DIFFERENCE'; mod.object = cut; mod.solver = 'EXACT'
    bpy.context.view_layer.objects.active = end
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cut)
    end.data.set_sharp_from_angle(angle=math.radians(55))
    # ---- the pin: metal stud from the strap underneath, up through one hole, domed top just above the surface
    q, nrm, _ = frame_at(pin_s)
    h = STRAP_T + 5
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=7.5 * S, depth=h * S,
                                        location=(q - nrm * (STRAP_T / 2 + h / 2)) * S,
                                        rotation=nrm.to_track_quat('Z', 'Y').to_euler())
    pin = bpy.context.object; pin.name = 'Pin'
    bev = pin.modifiers.new('bevel', 'BEVEL'); bev.width = 3.2 * S; bev.segments = 8
    bpy.ops.object.shade_smooth(); pin.data.materials.append(pin_mat)
    # ---- keeper: a short silicone band around both layers, just before the tip
    q, nrm, tg = frame_at(s_b - TIP - 34)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal(((W + 12) * S, 22 * S, (2 * STRAP_T + 7) * S, 1)))
    kme = bpy.data.meshes.new('Keeper'); bm.to_mesh(kme); bm.free()
    keeper = bpy.data.objects.new('Keeper', kme); bpy.context.collection.objects.link(keeper)
    R3 = Matrix((tg.cross(nrm), tg, nrm)).transposed()
    keeper.matrix_world = Matrix.Translation((q - nrm * (STRAP_T / 2)) * S) @ R3.to_4x4()
    bev = keeper.modifiers.new('bevel', 'BEVEL'); bev.width = 7 * S; bev.segments = 6; bev.limit_method = 'NONE'
    for p in keeper.data.polygons:
        p.use_smooth = True
    keeper.data.materials.append(sil_mat)
    return [end, pin, keeper]


def build_cradle(mat):
    """silicone cradle hugging the back half of the case: the strap grows out of it, so case and strap read as one"""
    rings = [(-7.0, 0.4), (-6.2, -1.4), (-4.8, -2.4), (-2.5, -2.9), (6.0, -2.9), (12.0, -2.3), (17.0, -0.6),
             (21.0, 2.8), (23.5, 7.5), (24.6, 13.0), (25.0, 18.0)]
    ob = loft('Cradle', rings, cap_back=True)
    ob.data.materials.append(mat)
    return ob


def rounded_box(name, size, loc, bevel, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=[v * S for v in loc])
    ob = bpy.context.object; ob.name = name
    ob.scale = [v * S for v in size]
    bpy.ops.object.transform_apply(scale=True)
    mod = ob.modifiers.new('bevel', 'BEVEL'); mod.width = bevel * S; mod.segments = 6; mod.limit_method = 'NONE'
    mod.harden_normals = False
    bpy.ops.object.shade_smooth()
    ob.data.materials.append(mat)
    return ob


# ---- scene -----------------------------------------------------------------------------------------------------------
def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    silver, glass, screen, back, strap = mat_silver(), mat_glass(), mat_screen(), mat_back(), mat_silicone()
    chrome, _ = principled('Chrome', **{'Base Color': (0.92, 0.91, 0.90, 1), 'Metallic': 1.0, 'Roughness': 0.12})

    root = bpy.data.objects.new('Band', None); sc.collection.objects.link(root)

    # module body: polished lip around the glass, straight flank, rounded back
    body = loft('Case', [(-30.0, 9.0), (-30.6, 6.8), (-30.5, 4.6), (-29.7, 2.6), (-28.3, 1.1), (-26.4, 0.25), (-24.0, 0.0),
                         (BACK - 22.0, 0.0), (BACK - 17.0, 0.5), (BACK - 12.0, 1.8), (BACK - 7.5, 4.0), (BACK - 4.0, 7.0), (BACK - 1.6, 10.2), (BACK - 0.3, 13.5), (BACK, 16.0)],
                cap_back=True, back_mat=True)
    body.data.materials.append(silver); body.data.materials.append(back)
    # glass: sits in the lip, rounded edge, flat top
    gl = loft('Glass', [(-29.0, 9.05), (-31.0, 9.25), (-32.2, 9.9), (-32.8, 11.0), (-33.0, 12.6)], cap_front=True)
    gl.data.materials.append(glass)
    # screen: the area the website covers with the HTML UI
    sbm = bmesh.new()
    vs = [sbm.verts.new((x * S, -(GLASS_TOP + 0.05) * S, z * S)) for x, z in stadium(SCREEN_INSET)]
    sbm.faces.new(list(reversed(vs)))
    sme = bpy.data.meshes.new('Screen'); sbm.to_mesh(sme); sbm.free()
    scr = bpy.data.objects.new('Screen', sme); sc.collection.objects.link(scr); scr.data.materials.append(screen)

    st, Ltot, P, cum, yc = build_strap(strap)
    clasp = build_clasp(P, cum, Ltot, yc, strap, chrome)
    cradle = build_cradle(strap)
    # connectors at both ends: a silver bridge the strap passes under
    con = []
    for sgn in ((1, -1) if os.environ.get('CONNECTORS') else ()):
        con.append(rounded_box('Connector' + ('Top' if sgn > 0 else 'Bot'), (STRAP_W + 6, 26, 24),
                               (0, STRAP_FRONT + 1, sgn * (H / 2 - 16)), 11, silver))
    for ob in [body, gl, scr, st, cradle] + clasp + con:
        ob.parent = root

    # camera: 1800 BU in front, like the CSS perspective
    cam_d = bpy.data.cameras.new('Cam'); cam = bpy.data.objects.new('Cam', cam_d); sc.collection.objects.link(cam)
    cam.location = (0, -1800 * S, 0); cam.rotation_euler = (math.pi / 2, 0, 0)
    cam_d.clip_start = 5; cam_d.clip_end = 40
    sc.camera = cam

    # world: the site's own studio HDRI (three.js equirect: centre = +X, u .75 = toward the camera)
    wo = bpy.data.worlds.new('Studio'); sc.world = wo; wo.use_nodes = True
    wn = wo.node_tree.nodes; wl = wo.node_tree.links
    env = wn.new('ShaderNodeTexEnvironment')
    hdr = os.path.join(HERE, '..', 'hdr', 'tribu_studio.hdr')
    env.image = bpy.data.images.load(hdr if os.path.exists(hdr) else os.path.join(HERE, 'tribu_studio.hdr'))
    env.image.pack()                      # keep the HDRI inside band.blend so it renders anywhere
    mp = wn.new('ShaderNodeMapping'); tc = wn.new('ShaderNodeTexCoord')
    mp.inputs['Rotation'].default_value = (0, 0, math.pi)
    wl.new(tc.outputs['Generated'], mp.inputs['Vector']); wl.new(mp.outputs['Vector'], env.inputs['Vector'])
    bg = wn['Background']; bg.inputs['Strength'].default_value = 1.0
    wl.new(env.outputs['Color'], bg.inputs['Color'])

    # direct lights, mirroring the site's three.js rig (three (x,y,z) -> blender (x,-z,y))
    def sun(name, d3, col, strength, angle=8):
        ld = bpy.data.lights.new(name, 'SUN'); ld.energy = strength; ld.color = col; ld.angle = math.radians(angle)
        ob = bpy.data.objects.new(name, ld); sc.collection.objects.link(ob)
        x, y, z = d3; v = Vector((x, -z, y)).normalized()
        ob.rotation_euler = (-v).to_track_quat('-Z', 'Y').to_euler()
        return ob
    sun('Key', (300, 500, 600), (1.0, 0.95, 0.9), 2.6, 12)
    sun('Side', (700, 250, 150), (1.0, 0.96, 0.93), 1.6, 15)
    sun('RimCyan', (-500, 120, -400), (0.26, 0.85, 1.0), 0.7, 10)
    sun('RimCoral', (-400, -300, 300), (1.0, 0.35, 0.24), 0.5, 15)
    sun('Back', (200, 300, -700), (1.0, 0.55, 0.75), 1.2, 10)

    r = sc.render
    r.engine = 'CYCLES'; sc.cycles.samples = 128; sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.02
    sc.cycles.max_bounces = 8; sc.cycles.glossy_bounces = 4; sc.cycles.transparent_max_bounces = 4
    r.film_transparent = True
    r.image_settings.file_format = 'PNG'; r.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = 0.0
    return sc, Ltot


# ---- pose & framing (shared with render.py) --------------------------------------------------------------------------
M = Matrix(((1, 0, 0), (0, 0, -1), (0, -1, 0)))       # CSS (x right, y down, z to viewer) <-> Blender


def css_rot(rx, ry):
    """CSS rotateX(rx) rotateY(ry) (degrees) as a Blender rotation matrix"""
    a, b = math.radians(rx), math.radians(ry)
    Rx = Matrix(((1, 0, 0), (0, math.cos(a), -math.sin(a)), (0, math.sin(a), math.cos(a))))
    Ry = Matrix(((math.cos(b), 0, math.sin(b)), (0, 1, 0), (-math.sin(b), 0, math.cos(b))))
    return M @ (Rx @ Ry) @ M


def set_pose(rx, ry):
    bpy.data.objects['Band'].matrix_world = css_rot(rx, ry).to_4x4()


def project_bu(points_world, d=1800):
    """world points (Blender units) -> CSS px at k=1 on the band-centre plane (x right, y down)"""
    out = []
    for p in points_world:
        x, y, z = p.x / S, p.y / S, p.z / S               # BU; camera at y = -d
        f = d / (d + y)
        out.append((x * f, -z * f))
    return out


if __name__ == '__main__':
    sc, Ltot = build()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'band.blend'))
    print('built, strap length', round(Ltot), 'BU')
