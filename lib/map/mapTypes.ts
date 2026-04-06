import type {
  ConstituenciesFile,
  ConstituencyGeoJson,
  MPRecord,
  SearchIndexEntry,
} from "@/lib/data/models";
import type { PartyKey } from "@/lib/types";

export type MapPoint = [number, number];
export type MapRing = MapPoint[];
export type MapPolygon = MapRing[];

export interface JoinedConstituencyMapFeature {
  id: string;
  slug: string;
  name: string;
  nation: string;
  region: string;
  party: PartyKey | "unknown";
  partyLabel: string;
  mpId: string;
  mpName: string;
  majority: number | null;
  lastElectionYear: number | null;
  lastElectionWinner: string | null;
  detailHref: string;
  aliases: string[];
  geometryType: "Polygon" | "MultiPolygon";
  polygons: MapPolygon[];
}

export interface JoinedConstituencyMapData {
  generatedAt: string;
  features: JoinedConstituencyMapFeature[];
  missingGeometryIds: string[];
  missingMetadataIds: string[];
}

export type ConstituencyFileData = ConstituenciesFile;
export type MPFileItems = MPRecord[];
export type SearchIndexItems = SearchIndexEntry[];
export type ConstituencyGeoJsonData = ConstituencyGeoJson;
