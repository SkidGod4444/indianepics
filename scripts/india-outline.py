"""Swaps India's shape in public/geo/south-asia.json for the Survey of India outline.

The Geospatial Guidelines of 2021 require political maps of India to follow Survey of India boundaries. The source is
DataMeet's india-soi.geojson (CC BY 4.0, github.com/datameet/maps), simplified to the size this map draws it. India is
moved to the end of the file so it is painted last and its own outline is the one on screen.

  uv run --no-project --python 3.11 --with shapely scripts/india-outline.py <india-soi.geojson>
"""

import json
import sys

from shapely.geometry import MultiPolygon, shape
from shapely.ops import unary_union
from shapely.validation import make_valid

TOPO = "public/geo/south-asia.json"
TOLERANCE_DEG = 0.012
SMALLEST_ISLAND_DEG2 = 0.0003

source = json.load(open(sys.argv[1]))
features = source["features"] if source.get("type") == "FeatureCollection" else [source]
land = unary_union([make_valid(shape(f["geometry"])) for f in features])
land = land.simplify(TOLERANCE_DEG, preserve_topology=True)
polygons = [p for p in (land.geoms if isinstance(land, MultiPolygon) else [land]) if p.area >= SMALLEST_ISLAND_DEG2]
polygons.sort(key=lambda p: -p.area)

topo = json.load(open(TOPO))
(sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]


def arc(ring):
    """A ring as a quantised, delta-encoded arc. Returns the arc's index."""
    points = [(round((x - tx) / sx), round((y - ty) / sy)) for x, y in ring.coords]
    steps = [points[0]] + [(b[0] - a[0], b[1] - a[1]) for a, b in zip(points, points[1:]) if a != b]
    topo["arcs"].append([list(s) for s in steps])
    return len(topo["arcs"]) - 1


shapes = [[[arc(p.exterior)], *[[arc(hole)] for hole in p.interiors if hole.envelope.area > 0.01]] for p in polygons]
layer = next(iter(topo["objects"].values()))
india = next(g for g in layer["geometries"] if g["properties"]["name"] == "India")
india.update(type="MultiPolygon", arcs=shapes)
layer["geometries"] = [g for g in layer["geometries"] if g is not india] + [india]
json.dump(topo, open(TOPO, "w"), separators=(",", ":"))
print(f"{len(polygons)} land parts, {sum(len(p.exterior.coords) for p in polygons)} points")
