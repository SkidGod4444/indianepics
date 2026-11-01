import { geoMercator, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";
import topo from "../../public/geo/south-asia.json";
import type { Polity } from "@/content/schema";

type CountryProps = { name: string; iso: string };

const topology = topo as unknown as Topology;
const objectName = Object.keys(topology.objects)[0];

export const countries = feature(
  topology,
  topology.objects[objectName] as GeometryCollection<CountryProps>,
) as FeatureCollection<Geometry, CountryProps>;

/** The camera: a fixed frame around the subcontinent so morphs stay legible. Clockwise, see ringToFeature. */
export const FRAME: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [64, 5],
      [64, 37.5],
      [98, 37.5],
      [98, 5],
      [64, 5],
    ],
  ],
};

export function makeProjection(width: number, height: number, pad = 16): GeoProjection {
  return geoMercator().fitExtent(
    [
      [pad, pad],
      [width - pad, height - pad],
    ],
    FRAME,
  );
}

/** Shoelace area in lon/lat. Positive = counter-clockwise with north up. */
function signedArea(ring: [number, number][]) {
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/** d3-geo treats polygons as spherical: the exterior ring must run clockwise or it means "everything else". */
export function ringToFeature(p: Polity): Feature<Polygon> {
  const ring = signedArea(p.ring) > 0 ? [...p.ring].reverse() : [...p.ring];
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx !== lx || fy !== ly) ring.push([fx, fy]);
  return { type: "Feature", properties: { id: p.id }, geometry: { type: "Polygon", coordinates: [ring] } };
}

export function pathFor(projection: GeoProjection) {
  return geoPath(projection);
}
