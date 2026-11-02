"""
The grain of an old sheet: fibres, mottling and foxing specks, as one small tile that repeats without a seam.
Every page in the book lays this over its era's paper colour, so the texture is one 512 px file, not a picture per page.

  uv run --no-project --python 3.11 --with numpy --with pillow scripts/build-paper.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

SIZE = 512
OUT = Path(__file__).resolve().parent.parent / "public/paper/grain.webp"
INK = (84, 52, 20)
rng = np.random.default_rng(1857)


def noise(fall: float) -> np.ndarray:
    """Random noise filtered in frequency, which makes it wrap at the tile's edges."""
    f = np.fft.fftfreq(SIZE)
    radius = np.hypot(*np.meshgrid(f, f)) + 1 / SIZE
    spectrum = np.fft.fft2(rng.standard_normal((SIZE, SIZE))) / radius**fall
    field = np.fft.ifft2(spectrum).real
    return (field - field.mean()) / field.std()


alpha = np.clip(noise(1.5) * 0.018 + 0.05, 0, 1)  # mottling, faint: anything bolder shows the tile repeating
alpha += np.clip(noise(0.5) * 0.03, 0, 1)  # tooth

fibres = np.zeros((SIZE, SIZE))
for _ in range(1500):
    x, y = rng.uniform(0, SIZE, 2)
    heading = rng.normal(0, 0.5)  # paper fibres lie mostly one way, along the mould
    bend = rng.normal(0, 0.012)
    depth = rng.uniform(0.012, 0.05)
    for _ in range(int(rng.uniform(8, 30))):
        fibres[int(y) % SIZE, int(x) % SIZE] = max(fibres[int(y) % SIZE, int(x) % SIZE], depth)
        x, y = x + np.cos(heading), y + np.sin(heading)
        heading += bend
alpha += fibres

yy, xx = np.mgrid[0:SIZE, 0:SIZE]
for _ in range(26):  # foxing
    cx, cy = rng.uniform(0, SIZE, 2)
    r = rng.uniform(0.8, 3.4)
    dx = np.minimum(np.abs(xx - cx), SIZE - np.abs(xx - cx))
    dy = np.minimum(np.abs(yy - cy), SIZE - np.abs(yy - cy))
    alpha += rng.uniform(0.06, 0.24) * np.exp(-(dx**2 + dy**2) / (2 * r**2))

alpha = np.clip(alpha, 0, 0.6)
rgba = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
rgba[..., :3] = INK
rgba[..., 3] = (alpha * 255).astype(np.uint8)
OUT.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(rgba).save(OUT, "WEBP", quality=30, alpha_quality=38, method=6)
print(f"{OUT.name}: {OUT.stat().st_size // 1024} KB")
