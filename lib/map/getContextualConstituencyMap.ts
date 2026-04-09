import { geoIdentity, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import constituencyData from "@/data/generated/constituencies.json";
import constituencyProfilesData from "@/data/generated/constituency-profiles.json";
import constituencyMap from "@/data/maps/constituencies.geo.json";
import type {
  ConstituenciesFile,
  ConstituencyGeoJson,
  ConstituencyGeoFeature,
  ConstituencyProfilesFile,
} from "@/lib/data/models";
import {
  debugPartyColorResolution,
  getPartyColorWithOpacity,
} from "@/lib/party-colors";

type MapPoint = [number, number];
type MapRing = MapPoint[];
type MapPolygon = MapRing[];
type MapFeatureGeometry = {
  geometryType: "Polygon" | "MultiPolygon";
  polygons: MapPolygon[];
};
type MapBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type ContextFeature = MapFeatureGeometry & {
  id: string;
  name: string;
  bounds: MapBounds;
  center: MapPoint;
  party: string | null;
  isSelected: boolean;
};

export type ContextualConstituencyMapPath = {
  id: string;
  name: string;
  path: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  isSelected: boolean;
};

export type ContextualConstituencyMap = {
  width: number;
  height: number;
  transform: string;
  paths: ContextualConstituencyMapPath[];
  caption: string;
  description: string;
};

const constituenciesFile = constituencyData as ConstituenciesFile;
const constituencyProfilesFile = constituencyProfilesData as ConstituencyProfilesFile;
const constituencyGeoJson = constituencyMap as ConstituencyGeoJson;
const constituenciesById = new Map(constituenciesFile.items.map((item) => [item.id, item]));
const profilesById = new Map(constituencyProfilesFile.items.map((item) => [item.id, item]));

function debugLogSelectedPartyResolution(selectedId: string, party: string | null) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const resolution = debugPartyColorResolution(party);
  console.info(
    `[votewatch:constituency-context-map] ${selectedId} winner="${resolution.input}" normalized="${resolution.normalizedKey}" color="${resolution.color}"`,
  );
}

function normalizeGeometry(feature: ConstituencyGeoFeature): MapFeatureGeometry | null {
  if (feature.geometry.type === "Polygon") {
    return {
      geometryType: "Polygon",
      polygons: [feature.geometry.coordinates as MapPolygon],
    };
  }

  if (feature.geometry.type === "MultiPolygon") {
    return {
      geometryType: "MultiPolygon",
      polygons: feature.geometry.coordinates as MapPolygon[],
    };
  }

  return null;
}

function collectBounds(polygons: MapPolygon[]): MapBounds {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

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

  return { minX, maxX, minY, maxY };
}

function getBoundsCenter(bounds: MapBounds): MapPoint {
  return [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2];
}

function getBoundsGap(left: MapBounds, right: MapBounds): number {
  const gapX = Math.max(0, left.minX - right.maxX, right.minX - left.maxX);
  const gapY = Math.max(0, left.minY - right.maxY, right.minY - left.maxY);
  return Math.hypot(gapX, gapY);
}

function getCenterDistance(left: MapPoint, right: MapPoint): number {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

function toFeatureCollection(
  features: ContextFeature[],
): FeatureCollection<Polygon | MultiPolygon, { id: string }> {
  return {
    type: "FeatureCollection",
    features: features.map((feature) => ({
      type: "Feature",
      id: feature.id,
      properties: { id: feature.id },
      geometry:
        feature.geometryType === "Polygon"
          ? {
              type: "Polygon",
              coordinates: feature.polygons[0] as number[][][],
            }
          : {
              type: "MultiPolygon",
              coordinates: feature.polygons as number[][][][],
            },
    })),
  };
}

function buildContextFeatures(selectedId: string): ContextFeature[] {
  return constituencyGeoJson.features.flatMap((feature) => {
    const geometry = normalizeGeometry(feature);

    if (!geometry) {
      return [];
    }

    const bounds = collectBounds(geometry.polygons);
    const center = getBoundsCenter(bounds);
    const profile = profilesById.get(feature.properties.id);
    const constituency = constituenciesById.get(feature.properties.id);

    return [
      {
        ...geometry,
        id: feature.properties.id,
        name: feature.properties.name,
        bounds,
        center,
        party:
          profile?.election?.winnerPartySlug ??
          profile?.election?.winnerParty ??
          constituency?.party ??
          constituency?.partyLabel ??
          null,
        isSelected: feature.properties.id === selectedId,
      },
    ];
  });
}

function selectNeighbourFeatures(
  features: ContextFeature[],
  selected: ContextFeature,
): ContextFeature[] {
  const selectedWidth = selected.bounds.maxX - selected.bounds.minX;
  const selectedHeight = selected.bounds.maxY - selected.bounds.minY;
  const selectedSize = Math.max(selectedWidth, selectedHeight);
  const maxContextDistance = Math.max(selectedSize * 2.5, 25000);
  const nearTouchTolerance = 1500;

  const ranked = features
    .filter((feature) => feature.id !== selected.id)
    .map((feature) => ({
      feature,
      gapDistance: getBoundsGap(selected.bounds, feature.bounds),
      centerDistance: getCenterDistance(selected.center, feature.center),
    }))
    .sort((left, right) => {
      if (left.gapDistance !== right.gapDistance) {
        return left.gapDistance - right.gapDistance;
      }

      return left.centerDistance - right.centerDistance;
    });

  // Prefer seats whose projected bounds touch or nearly touch the selected seat; if that yields
  // too little context, fall back to the next-closest local constituencies by centroid distance.
  const touching = ranked.filter(({ gapDistance }) => gapDistance <= nearTouchTolerance);
  const local = ranked.filter(
    ({ gapDistance, centerDistance }) =>
      gapDistance <= selectedSize * 0.8 || centerDistance <= maxContextDistance,
  );
  const combined = [...touching, ...local].reduce<typeof ranked>((items, current) => {
    if (items.some((item) => item.feature.id === current.feature.id)) {
      return items;
    }

    items.push(current);
    return items;
  }, []);
  const fallback = combined.length > 0 ? combined : ranked.slice(0, 6);

  return fallback.slice(0, 10).map(({ feature }) => feature);
}

export function getContextualConstituencyMap({
  selectedId,
  width,
  height,
  padding = 24,
  selectedScale = 0.8,
}: {
  selectedId: string;
  width: number;
  height: number;
  padding?: number;
  selectedScale?: number;
}): ContextualConstituencyMap | null {
  const features = buildContextFeatures(selectedId);
  const selected = features.find((feature) => feature.isSelected);

  if (!selected) {
    return null;
  }

  debugLogSelectedPartyResolution(selected.id, selected.party);

  const contextFeatures = [selected, ...selectNeighbourFeatures(features, selected)];
  const selectedCollection = toFeatureCollection([selected]);
  const contextCollection = toFeatureCollection(contextFeatures);
  const isProjectedPlanar =
    Math.abs(selected.bounds.minX) > 180 ||
    Math.abs(selected.bounds.maxX) > 180 ||
    Math.abs(selected.bounds.minY) > 90 ||
    Math.abs(selected.bounds.maxY) > 90;
  const projection = isProjectedPlanar ? geoIdentity().reflectY(true) : geoMercator();
  const fitProjection = projection as typeof projection & {
    fitExtent: (
      extent: [[number, number], [number, number]],
      object: FeatureCollection<Polygon | MultiPolygon, { id: string }>,
    ) => unknown;
  };

  fitProjection.fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    selectedCollection,
  );

  const pathGenerator = geoPath(projection);
  const paths = contextFeatures
    .flatMap((feature) => {
      const projectedFeature = contextCollection.features.find((item) => item.id === feature.id);
      const path = projectedFeature ? pathGenerator(projectedFeature as Feature) : null;

      if (!path) {
        return [];
      }

      return [
        {
          id: feature.id,
          name: feature.name,
          path,
          fill: getPartyColorWithOpacity(feature.party, feature.isSelected ? 1 : 0.3),
          stroke: feature.isSelected ? "rgba(26, 31, 44, 0.92)" : "rgba(26, 31, 44, 0.4)",
          strokeWidth: feature.isSelected ? 1.8 : 1.1,
          isSelected: feature.isSelected,
        },
      ];
    })
    .sort((left, right) => Number(left.isSelected) - Number(right.isSelected));

  return {
    width,
    height,
    transform: `translate(${width / 2} ${height / 2}) scale(${selectedScale}) translate(${-width / 2} ${-height / 2})`,
    paths,
    caption:
      "Selected constituency shown in full colour; neighbouring constituencies are shaded by their latest winning party.",
    description:
      "An SVG boundary map showing the selected constituency in full winning-party colour with nearby constituencies around it shaded at lower opacity for geographic and political context.",
  };
}
