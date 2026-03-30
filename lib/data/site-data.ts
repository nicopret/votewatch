import constituencyData from "@/data/generated/constituencies.json";
import constituencyMap from "@/data/maps/constituencies.geo.json";
import type {
  ConstituenciesFile,
  ConstituencyGeoJson,
  GeoFeatureProperties,
} from "@/lib/data/models";
import type { ConstituencyCollection, SimpleFeatureCollection } from "@/lib/types";

type LegacyConstituencyFile = {
  updatedAt: string;
  items: Array<{
    id: string;
    slug: string;
    name: string;
    region: string;
    incumbentParty: ConstituencyCollection["items"][number]["incumbentParty"];
  }>;
};

type LegacyMapFile = SimpleFeatureCollection;

function hasGeneratedConstituencyShape(value: unknown): value is ConstituenciesFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "generatedAt" in value &&
    Array.isArray((value as ConstituenciesFile).items)
  );
}

function hasGeneratedMapShape(value: unknown): value is ConstituencyGeoJson {
  return (
    typeof value === "object" &&
    value !== null &&
    value instanceof Object &&
    (value as ConstituencyGeoJson).type === "FeatureCollection" &&
    Array.isArray((value as ConstituencyGeoJson).features) &&
    Boolean((value as ConstituencyGeoJson).features[0]?.properties?.id)
  );
}

export function getConstituencyCollection(): ConstituencyCollection {
  if (!hasGeneratedConstituencyShape(constituencyData)) {
    const legacy = constituencyData as unknown as LegacyConstituencyFile;

    return {
      updatedAt: legacy.updatedAt,
      items: legacy.items,
    };
  }

  const generated = constituencyData as ConstituenciesFile;

  return {
    updatedAt: generated.generatedAt,
    items: generated.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      region: item.region,
      incumbentParty: item.party,
    })),
  };
}

export function getConstituencyMap(): SimpleFeatureCollection {
  if (!hasGeneratedMapShape(constituencyMap)) {
    return constituencyMap as unknown as LegacyMapFile;
  }

  const generatedMap = constituencyMap as ConstituencyGeoJson;
  const generatedConstituencies = hasGeneratedConstituencyShape(constituencyData)
    ? (constituencyData as ConstituenciesFile)
    : null;

  const constituencies = new Map(
    (generatedConstituencies?.items ?? []).map((item) => [item.id, item]),
  );

  const bounds = generatedMap.features.flatMap((feature) =>
    ((feature.geometry.coordinates as number[][][])[0] ?? []).map(([x, y]) => [Number(x), Number(y)]),
  );
  const minX = Math.min(...bounds.map(([x]) => x));
  const maxX = Math.max(...bounds.map(([x]) => x));
  const minY = Math.min(...bounds.map(([, y]) => y));
  const maxY = Math.max(...bounds.map(([, y]) => y));

  const scalePoint = ([x, y]: [number, number]): [number, number] => {
    const scaledX = 24 + ((x - minX) / Math.max(maxX - minX, 1)) * 272;
    const scaledY = 24 + ((maxY - y) / Math.max(maxY - minY, 1)) * 172;
    return [Math.round(scaledX * 10) / 10, Math.round(scaledY * 10) / 10];
  };

  return {
    type: "FeatureCollection",
    features: generatedMap.features.map((feature) => {
      const properties = feature.properties as GeoFeatureProperties;
      const constituency = constituencies.get(properties.id);
      const coordinates = (feature.geometry.coordinates as number[][][]).map((ring) =>
        ring.map((point) => scalePoint([Number(point[0]), Number(point[1])])),
      );
      const outerRing = coordinates[0] ?? [];
      const labelX =
        outerRing.reduce((sum, point) => sum + Number(point[0]), 0) /
        Math.max(outerRing.length, 1);
      const labelY =
        outerRing.reduce((sum, point) => sum + Number(point[1]), 0) /
        Math.max(outerRing.length, 1);

      if (!constituency) {
        throw new Error(`Map feature "${properties.id}" does not match a constituency record.`);
      }

      return {
        type: "Feature" as const,
        properties: {
          code: properties.id,
          name: properties.name,
          party: constituency.party,
          labelX,
          labelY,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates,
        },
      };
    }),
  };
}
