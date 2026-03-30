import type { PartyValue } from "./party.ts";

export interface ConstituencyRecord {
  id: string;
  slug: string;
  name: string;
  nation: string;
  region: string;
  party: Exclude<PartyValue, "noc"> | "noc";
  partyLabel: string;
  mpId: string;
  mpName: string;
  majority: number | null;
  lastElectionYear: number | null;
  lastElectionWinner: string | null;
  lastElectionResult: Record<string, unknown> | null;
}

export interface MPRecord {
  id: string;
  slug: string;
  name: string;
  party: Exclude<PartyValue, "noc"> | "noc";
  partyLabel: string;
  constituencyId: string;
  constituencySlug: string;
  constituencyName: string;
}

export interface SearchIndexEntry {
  id: string;
  slug: string;
  name: string;
  type: "constituency";
  mapType: "constituencies";
  aliases?: string[];
}

export interface GeoFeatureProperties {
  id: string;
  slug: string;
  name: string;
  nation: string;
  region: string;
}

export interface ConstituenciesFile {
  generatedAt: string;
  items: ConstituencyRecord[];
}

export interface MPsFile {
  generatedAt: string;
  items: MPRecord[];
}

export interface SearchIndexFile {
  generatedAt: string;
  items: SearchIndexEntry[];
}

export interface ConstituencyGeoFeature {
  type: "Feature";
  properties: GeoFeatureProperties;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

export interface ConstituencyGeoJson {
  type: "FeatureCollection";
  features: ConstituencyGeoFeature[];
}

export interface RawConstituencySourceRecord {
  id: string;
  name: string;
  nation: string;
  region: string;
  party: PartyValue;
  mpId: string;
  mpName: string;
  majority: number | null;
  lastElectionYear: number | null;
  lastElectionWinner: string | null;
  lastElectionResult: Record<string, unknown> | null;
}

export interface RawConstituencySourceFile {
  dataset: string;
  items: RawConstituencySourceRecord[];
}

export interface RawMPSourceRecord {
  id: string;
  name: string;
  party: PartyValue;
  constituencyId: string;
  constituencyName: string;
}

export interface RawMPSourceFile {
  dataset: string;
  items: RawMPSourceRecord[];
}
