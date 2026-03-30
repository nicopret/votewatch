export type PartyKey =
  | "conservative"
  | "labour"
  | "liberal-democrat"
  | "snp"
  | "green"
  | "reform"
  | "other"
  | "independent"
  | "no-overall-control";

export interface ConstituencySummary {
  id: string;
  slug: string;
  name: string;
  region: string;
  incumbentParty: PartyKey;
}

export interface ConstituencyCollection {
  updatedAt: string;
  items: ConstituencySummary[];
}

export interface SimpleMapFeatureProperties {
  code: string;
  name: string;
  party: PartyKey;
  labelX: number;
  labelY: number;
}

export interface SimpleMapGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export interface SimpleMapFeature {
  type: "Feature";
  properties: SimpleMapFeatureProperties;
  geometry: SimpleMapGeometry;
}

export interface SimpleFeatureCollection {
  type: "FeatureCollection";
  features: SimpleMapFeature[];
}
