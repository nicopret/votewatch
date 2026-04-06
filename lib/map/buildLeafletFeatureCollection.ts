import proj4 from "proj4";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

const BRITISH_NATIONAL_GRID =
  "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs";
const WGS84 = "WGS84";

export interface LeafletConstituencyProperties {
  id: string;
  slug: string;
  name: string;
  nation: string;
  region: string;
  party: JoinedConstituencyMapFeature["party"];
  partyLabel: string;
  mpId: string;
  mpName: string;
  majority: number | null;
  lastElectionYear: number | null;
  lastElectionWinner: string | null;
  detailHref: string;
  aliases: string[];
}

export type LeafletConstituencyFeature = Feature<
  Polygon | MultiPolygon,
  LeafletConstituencyProperties
>;

export type LeafletConstituencyFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  LeafletConstituencyProperties
>;

function projectPoint([x, y]: [number, number]): [number, number] {
  const [longitude, latitude] = proj4(BRITISH_NATIONAL_GRID, WGS84, [x, y]);
  return [longitude, latitude];
}

function projectPolygonCoordinates(feature: JoinedConstituencyMapFeature) {
  const polygons = feature.polygons.map((polygon) =>
    polygon.map((ring) => ring.map((point) => projectPoint(point))),
  );

  if (feature.geometryType === "Polygon") {
    return {
      type: "Polygon" as const,
      coordinates: polygons[0] ?? [],
    };
  }

  return {
    type: "MultiPolygon" as const,
    coordinates: polygons,
  };
}

export function buildLeafletFeatureCollection(
  features: JoinedConstituencyMapFeature[],
): LeafletConstituencyFeatureCollection {
  return {
    type: "FeatureCollection",
    features: features.map((feature) => ({
      type: "Feature",
      properties: {
        id: feature.id,
        slug: feature.slug,
        name: feature.name,
        nation: feature.nation,
        region: feature.region,
        party: feature.party,
        partyLabel: feature.partyLabel,
        mpId: feature.mpId,
        mpName: feature.mpName,
        majority: feature.majority,
        lastElectionYear: feature.lastElectionYear,
        lastElectionWinner: feature.lastElectionWinner,
        detailHref: feature.detailHref,
        aliases: feature.aliases,
      },
      geometry: projectPolygonCoordinates(feature),
    })),
  };
}
