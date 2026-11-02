"""Turns an ink drawing into the pen strokes that made it, so the site can draw it line by line.

Thins the ink to one-pixel lines, follows them into strokes, joins strokes that carry on through a junction, and
orders them the way a hand works: the long outlines first, then the detail, each starting near where the pen stopped.

  uv run --no-project --python 3.11 --with numpy --with pillow --with scipy --with scikit-image \
    scripts/sketch-trace.py <drawing.png> <sketch.txt>

Output is plain text. The first line is the drawing's width and height. Every other line is one stroke: its weight
(1, 2 or 3), its first point, then each next point as a step from the last. Numbers are whole pixels.
"""

import math
import sys

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.filters import threshold_otsu
from skimage.measure import approximate_polygon
from skimage.morphology import remove_small_objects, skeletonize

MIN_SPECK_PX = 10
MIN_STROKE_PX = 7
JOIN_GAP_PX = 3.0
JOIN_ANGLE_DEG = 55
SIMPLIFY_PX = 0.85
OUTLINE_SHARE = 0.22

source, target = sys.argv[1:3]
gray = np.asarray(Image.open(source).convert("L"), dtype=np.float32) / 255
height, width = gray.shape
ink = remove_small_objects(gray < min(threshold_otsu(gray), 0.6), max_size=MIN_SPECK_PX)
thickness = ndimage.distance_transform_edt(ink)
skeleton = skeletonize(ink)

pixels = set(zip(*(a.tolist() for a in np.nonzero(skeleton))))
STEPS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def around(p):
    return [(p[0] + a, p[1] + b) for a, b in STEPS if (p[0] + a, p[1] + b) in pixels]


nodes = {p for p in pixels if len(around(p)) != 2}
walked = set()


def walk(start, step):
    path = [start, step]
    walked.update({(start, step), (step, start)})
    before, here = start, step
    while here not in nodes:
        onward = [q for q in around(here) if q != before and (here, q) not in walked]
        if not onward:
            break
        before, here = here, onward[0]
        walked.update({(before, here), (here, before)})
        path.append(here)
    return path


strokes = []
for origin in list(nodes) + list(pixels):
    for neighbour in around(origin):
        if (origin, neighbour) not in walked:
            strokes.append(walk(origin, neighbour))


def heading(path, at_end):
    points = path[-6:] if at_end else path[:6][::-1]
    return math.atan2(points[-1][0] - points[0][0], points[-1][1] - points[0][1])


def turn(a, b):
    d = abs(a - b) % (2 * math.pi)
    return min(d, 2 * math.pi - d)


# Join strokes that run on through a junction, so one movement of the pen stays one stroke.
ends = {}
for i, path in enumerate(strokes):
    for tip in (path[0], path[-1]):
        ends.setdefault((tip[0] // 4, tip[1] // 4), []).append(i)
alive = [True] * len(strokes)


def partner(i):
    tail = strokes[i][-1]
    best, best_turn = None, math.radians(JOIN_ANGLE_DEG)
    for a in (-1, 0, 1):
        for b in (-1, 0, 1):
            for j in ends.get((tail[0] // 4 + a, tail[1] // 4 + b), []):
                if j == i or not alive[j]:
                    continue
                for flip in (False, True):
                    candidate = strokes[j][::-1] if flip else strokes[j]
                    if math.dist(tail, candidate[0]) > JOIN_GAP_PX:
                        continue
                    t = turn(heading(strokes[i], True), heading(candidate, False))
                    if t < best_turn:
                        best, best_turn = (j, flip), t
    return best


for i in sorted(range(len(strokes)), key=lambda k: -len(strokes[k])):
    while alive[i]:
        found = partner(i)
        if not found:
            break
        j, flip = found
        strokes[i] = strokes[i] + (strokes[j][::-1] if flip else strokes[j])
        alive[j] = False
        tail = strokes[i][-1]
        ends.setdefault((tail[0] // 4, tail[1] // 4), []).append(i)

kept = []
for path, live in zip(strokes, alive):
    if not live or len(path) < MIN_STROKE_PX:
        continue
    line = approximate_polygon(np.array(path, dtype=np.float32), SIMPLIFY_PX)
    mean = float(np.mean([thickness[p] for p in path]))
    kept.append({"line": line, "weight": 1 if mean < 1.3 else 2 if mean < 2.3 else 3, "length": len(path)})


def order(group, pen):
    """Takes the stroke starting nearest the pen, again and again, reversing a stroke when its far end is closer."""
    left = list(group)
    done = []
    while left:
        firsts = np.array([s["line"][0] for s in left])
        lasts = np.array([s["line"][-1] for s in left])
        to_first = np.hypot(*(firsts - pen).T)
        to_last = np.hypot(*(lasts - pen).T)
        i = int(np.argmin(np.minimum(to_first, to_last)))
        stroke = left.pop(i)
        if to_last[i] < to_first[i]:
            stroke["line"] = stroke["line"][::-1]
        done.append(stroke)
        pen = stroke["line"][-1]
    return done, pen


kept.sort(key=lambda s: -s["length"])
outline_count = max(1, int(len(kept) * OUTLINE_SHARE))
outlines, pen = order(kept[:outline_count], np.array([height * 0.3, width * 0.5]))
detail, _ = order(kept[outline_count:], pen)

rows = [f"{width} {height}"]
for stroke in outlines + detail:
    points = np.rint(stroke["line"]).astype(int)[:, ::-1]
    steps = np.diff(points, axis=0)
    keep = steps[np.any(steps != 0, axis=1)]
    if not len(keep):
        continue
    numbers = [stroke["weight"], *points[0].tolist(), *keep.ravel().tolist()]
    rows.append(" ".join(str(n) for n in numbers))
with open(target, "w") as out:
    out.write("\n".join(rows))
print(f"{len(rows) - 1} strokes, {sum(len(r) for r in rows) // 1024} KB")
