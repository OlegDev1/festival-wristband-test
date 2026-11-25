"""Custom product-studio HDRI for the Tribu watch (equirect 1024x512, Radiance .hdr).
Black studio with softboxes and strip lights, placed for the opening pose (case turned -62 deg, camera on +Z):
the glass mirrors the left-back (-X,-Z), the camera-facing case flank mirrors +Z, the top edge mirrors the ceiling.
three.js equirect: image centre = +X, u=.75 = +Z (towards camera), u=.25 = -Z, top row = up.
Usage: python3 tools/make_hdr.py tinted hdr/tribu_studio.hdr   (live: tinted; also clean | strips)"""
import sys, numpy as np, cv2
W, H = 1024, 512
u = (np.arange(W) + .5) / W; v = 1 - (np.arange(H) + .5) / H
phi = (u - .5) * 2 * np.pi; lat = (v - .5) * np.pi
PH, LA = np.meshgrid(phi, lat)
D = np.stack([np.cos(PH) * np.cos(LA), np.sin(LA), np.sin(PH) * np.cos(LA)], -1)

def light(c, w, h, inten, col=(1, 1, 1), soft=.25, hot=.35, grad=0.):
    """rectangular softbox seen through a gnomonic projection: w,h = angular size in degrees, soft = feathered edge,
    hot = brighter centre (real softbox falloff), grad = brighter at the top (+) or bottom (-)"""
    c = np.array(c, float); c /= np.linalg.norm(c)
    up = np.array([0, 0, -1.]) if abs(c[1]) > .95 else np.array([0, 1., 0])
    t1 = np.cross(up, c); t1 /= np.linalg.norm(t1); t2 = np.cross(c, t1)
    dc = D @ c; ok = dc > 1e-3; dcs = np.where(ok, dc, 1)
    x = (D @ t1) / dcs / np.tan(np.radians(w / 2)); y = (D @ t2) / dcs / np.tan(np.radians(h / 2))
    e = lambda a: np.clip((1 - np.abs(a)) / soft, 0, 1) ** 2 * (3 - 2 * np.clip((1 - np.abs(a)) / soft, 0, 1))
    m = np.where(ok, e(x) * e(y), 0) * (1 - hot * np.clip(x * x + y * y, 0, 2) / 2) * np.clip(1 + grad * y, 0, 2)
    return m[..., None] * inten * np.array(col)[None, None]

def base(floor=.05, amb=.006):
    img = np.full((H, W, 3), amb)
    f = np.clip(-np.sin(LA) * 3, 0, 1)[..., None]                    # dim warm-grey studio floor, fading up to the horizon
    return img + f * floor * np.array([1, .93, .88])

def clean():
    return (base()
        + light((0, 1, .25), 70, 40, 3.2, hot=.25)                        # big overhead softbox: top edge of the case
        + light((.45, .45, .77), 38, 50, 2.6, grad=.4)                     # key softbox behind the camera, upper right: camera-facing flank
        + light((-.83, .12, -.56), 46, 72, 1.6, hot=.6, grad=.7)           # tall soft panel the glass mirrors: a gradient sweep over the black
        + light((.92, .05, .3), 6, 80, 7, soft=.35)                         # strip right: crisp line down the flank
        + light((-.55, .1, .83), 5, 75, 5, soft=.35)                        # strip front-left: line on the polished bezel
        + light((-.2, -.2, -.97), 30, 20, .5, hot=.1))                     # faint back fill

def strips():
    return (base(.035, .004)
        + light((0, 1, .25), 90, 8, 6, soft=.3)                             # thin overhead bar
        + light((.45, .35, .82), 6, 85, 9, soft=.35)                        # strip behind the camera
        + light((-.83, .12, -.56), 10, 85, 5, soft=.4, hot=.2, grad=.6)     # strip the glass mirrors: one clean diagonal line
        + light((.92, .05, .3), 5, 80, 8, soft=.35)
        + light((-.55, .1, .83), 4, 75, 6, soft=.35)
        + light((-.95, .15, .05), 4, 70, 5, soft=.35))

def tinted():
    return (clean()
        + light((-.95, 0, .32), 10, 60, 2.2, (1, .35, .24), soft=.5)        # coral accent (brand #ff5a3c), left
        + light((.7, .05, -.7), 10, 55, 1.6, (.26, .85, 1), soft=.5))       # cyan accent (#43d9ff), right-back

img = {'clean': clean, 'strips': strips, 'tinted': tinted}[sys.argv[1]]().astype(np.float32)
cv2.imwrite(sys.argv[2], img[..., ::-1])
w = np.cos(LA)[..., None]; print(sys.argv[1], 'mean', float((img * w).sum() / w.sum() / 3), 'max', float(img.max()))
