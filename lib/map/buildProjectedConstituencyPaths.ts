import { geoIdentity, geoMercator, geoPath } from "d3-geo";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "geojson";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

export interface ProjectedConstituencyPath {
  id: string;
  feature: JoinedConstituencyMapFeature;
  path: string;
}

export interface ProjectedConstituencyMap {
  width: number;
  height: number;
  paths: ProjectedConstituencyPath[];
}

function toFeatureCollection(
  features: JoinedConstituencyMapFeature[],
): FeatureCollection<Polygon | MultiPolygon, { id: string }> {
  return {
    type: "FeatureCollection",
    features: features.map((feature) => {
      const geometry: Polygon | MultiPolygon =
        feature.geometryType === "Polygon"
          ? {
              type: "Polygon",
              coordinates: feature.polygons[0] as number[][][],
            }
          : {
              type: "MultiPolygon",
              coordinates: feature.polygons as number[][][][],
            };

      return {
        type: "Feature",
        id: feature.id,
        properties: {
          id: feature.id,
        },
        geometry,
      } satisfies Feature<Polygon | MultiPolygon, { id: string }>;
    }),
  };
}

function warn(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[votewatch:map] ${message}`);
  }
}

function collectCoordinateRanges(
  featureCollection: FeatureCollection<Polygon | MultiPolygon, { id: string }>,
) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const feature of featureCollection.features) {
    const polygons =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (const [x, y] of ring) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
  }

  return { minX, maxX, minY, maxY };
}

export function buildProjectedConstituencyPaths({
  features,
  width = 1280,
  minHeight = 760,
  padding = 12,
}: {
  features: JoinedConstituencyMapFeature[];
  width?: number;
  minHeight?: number;
  padding?: number;
}): ProjectedConstituencyMap {
  if (features.length === 0) {
    return { width, height: minHeight, paths: [] };
  }

  const featureCollection = toFeatureCollection(features);
  const ranges = collectCoordinateRanges(featureCollection);
  const isProjectedPlanar =
    Math.abs(ranges.minX) > 180 ||
    Math.abs(ranges.maxX) > 180 ||
    Math.abs(ranges.minY) > 90 ||
    Math.abs(ranges.maxY) > 90;
  const projection = isProjectedPlanar
    ? geoIdentity().reflectY(true)
    : geoMercator();
  const fitProjection = projection as typeof projection & {
    fitWidth: (width: number, object: FeatureCollection<Polygon | MultiPolygon, { id: string }>) => unknown;
    fitExtent: (
      extent: [[number, number], [number, number]],
      object: FeatureCollection<Polygon | MultiPolygon, { id: string }>,
    ) => unknown;
  };

  fitProjection.fitWidth(width - padding * 2, featureCollection);

  const initialPathGenerator = geoPath(projection);
  const [[, minProjectedY], [, maxProjectedY]] = initialPathGenerator.bounds(featureCollection);
  const height = Math.max(
    minHeight,
    Math.ceil(maxProjectedY - minProjectedY + padding * 2),
  );

  fitProjection.fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    featureCollection,
  );

  const pathGenerator = geoPath(projection);

  const paths = features.flatMap((feature) => {
    const geoFeature = featureCollection.features.find((item) => item.id === feature.id);
    const path = geoFeature ? pathGenerator(geoFeature) : null;

    if (!path) {
      warn(`Could not generate SVG path for constituency "${feature.id}".`);
      return [];
    }

    return [{ id: feature.id, feature, path }];
  });

  if (process.env.NODE_ENV !== "production") {
    const geometryTypes = Array.from(new Set(features.map((feature) => feature.geometryType)));
    const strategy = isProjectedPlanar ? "planar-identity" : "geographic-mercator";
    console.info(
      `[votewatch:map] Projected ${paths.length} features using ${strategy}; geometry types: ${geometryTypes.join(", ")}; x:[${ranges.minX}, ${ranges.maxX}] y:[${ranges.minY}, ${ranges.maxY}]`,
    );
  }

  return {
    width,
    height,
    paths,
  };
}
