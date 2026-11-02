"""Turns a real painting, object or photograph into ink lines, ready for sketch-trace.py.

Uses an extended difference of Gaussians, which keeps the edges an engraver would cut and drops flat tone.
Indian miniature paintings already have strong outlines, so they survive this almost untouched.

  uv run --no-project --python 3.11 --with numpy --with pillow --with scipy \
    scripts/art-lines.py <source> <lines.png> [--width 1400] [--sigma 1.4] [--eps 0.012] [--crop x0,y0,x1,y1]
"""

import argparse

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument("source")
ap.add_argument("target")
ap.add_argument("--width", type=int, default=1400)
ap.add_argument("--sigma", type=float, default=1.4)
ap.add_argument("--eps", type=float, default=0.012)
ap.add_argument("--tau", type=float, default=0.985)
ap.add_argument("--smooth", type=float, default=0.9)
ap.add_argument("--crop")
ap.add_argument("--speck", type=int, default=30, help="drop ink blobs smaller than this many pixels")
args = ap.parse_args()

image = Image.open(args.source).convert("RGB")
if args.crop:
    x0, y0, x1, y1 = (float(v) for v in args.crop.split(","))
    w, h = image.size
    image = image.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))
scale = args.width / image.width
image = image.resize((args.width, round(image.height * scale)), Image.LANCZOS)
image = ImageOps.autocontrast(image, cutoff=1)

# Each colour channel on its own: Krishna's blue on a green field vanishes in greyscale.
ink = np.zeros((image.height, image.width), dtype=bool)
for band in image.split():
    gray = ndimage.gaussian_filter(np.asarray(band, dtype=np.float32) / 255, args.smooth)
    narrow = ndimage.gaussian_filter(gray, args.sigma)
    wide = ndimage.gaussian_filter(gray, args.sigma * 1.6)
    ink |= narrow - args.tau * wide < -args.eps + (1 - args.tau) * gray.mean()
labels, count = ndimage.label(ink, structure=np.ones((3, 3)))
sizes = np.bincount(labels.ravel())
keep = sizes >= args.speck
keep[0] = False
ink = keep[labels]
Image.fromarray(np.where(ink, 0, 255).astype(np.uint8)).save(args.target)
print(f"{args.target}: ink covers {ink.mean() * 100:.1f}%")
