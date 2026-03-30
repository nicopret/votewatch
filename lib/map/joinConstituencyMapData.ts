import type {
  ConstituencyFileData,
  ConstituencyGeoJsonData,
  JoinedConstituencyMapData,
  JoinedConstituencyMapFeature,
  MapPolygon,
  MPFileItems,
  SearchIndexItems,
} from "@/lib/map/mapTypes";
import { PARTY_VALUES } from "@/lib/data/party";

function normalizeGeometry(
  geometry: ConstituencyGeoJsonData["features"][number]["geometry"],
): { geometryType: "Polygon" | "MultiPolygon"; polygons: MapPolygon[] } | null {
  if (geometry.type === "Polygon") {
    return {
      geometryType: "Polygon",
      polygons: [geometry.coordinates as MapPolygon],
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      geometryType: "MultiPolygon",
      polygons: geometry.coordinates as MapPolygon[],
    };
  }

  return null;
}

function warn(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[votewatch:map] ${message}`);
  }
}

export function joinConstituencyMapData({
  constituencies,
  mps,
  searchIndex,
  geoJson,
}: {
  constituencies: ConstituencyFileData;
  mps: MPFileItems;
  searchIndex: SearchIndexItems;
  geoJson: ConstituencyGeoJsonData;
}): JoinedConstituencyMapData {
  const constituenciesById = new Map(
    constituencies.items.map((record) => [record.id, record]),
  );
  const mpsByConstituencyId = new Map(mps.map((record) => [record.constituencyId, record]));
  const searchById = new Map(searchIndex.map((record) => [record.id, record]));

  const missingMetadataIds: string[] = [];
  const matchedIds = new Set<string>();
  const features: JoinedConstituencyMapFeature[] = [];

  for (const feature of geoJson.features) {
    const constituencyId = feature.properties.id;
    const constituency = constituenciesById.get(constituencyId);

    const normalized = normalizeGeometry(feature.geometry);
    if (!normalized) {
      warn(
        `Skipping constituency "${constituencyId}" because geometry type "${feature.geometry.type}" is not supported.`,
      );
      continue;
    }

    if (!constituency) {
      missingMetadataIds.push(constituencyId);
      warn(`Rendering constituency "${constituencyId}" without metadata fallback.`);
    }

    const mp = constituency ? mpsByConstituencyId.get(constituencyId) : null;
    const searchEntry = searchById.get(constituencyId);
    const party =
      constituency && PARTY_VALUES.includes(constituency.party)
        ? constituency.party
        : ("unknown" as const);

    matchedIds.add(constituencyId);
    features.push({
      id: constituency?.id ?? feature.properties.id,
      slug: constituency?.slug ?? feature.properties.slug,
      name: constituency?.name ?? feature.properties.name,
      nation: constituency?.nation ?? feature.properties.nation,
      region: constituency?.region ?? feature.properties.region,
      party,
      partyLabel: constituency?.partyLabel ?? "Unknown",
      mpId: mp?.id ?? constituency?.mpId ?? "",
      mpName: mp?.name ?? constituency?.mpName ?? "Unavailable",
      majority: constituency?.majority ?? null,
      lastElectionYear: constituency?.lastElectionYear ?? null,
      lastElectionWinner: constituency?.lastElectionWinner ?? null,
      detailHref: `/constituencies/${constituency?.slug ?? feature.properties.slug}`,
      aliases: searchEntry?.aliases ?? [],
      geometryType: normalized.geometryType,
      polygons: normalized.polygons,
    });
  }

  const missingGeometryIds = constituencies.items
    .filter((record) => !matchedIds.has(record.id))
    .map((record) => record.id);

  for (const constituencyId of missingGeometryIds) {
    warn(`No geometry found for constituency "${constituencyId}".`);
  }

  return {
    generatedAt: constituencies.generatedAt,
    features: features.sort((left, right) => left.name.localeCompare(right.name, "en-GB")),
    missingGeometryIds,
    missingMetadataIds,
  };
}
