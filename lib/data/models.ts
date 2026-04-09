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

export interface ConstituencyBreakdownStat {
  label: string;
  value: number;
  unit: "percent" | "count";
}

export interface ConstituencyDemographics {
  ageBreakdown: ConstituencyBreakdownStat[] | null;
  ethnicityBreakdown: ConstituencyBreakdownStat[] | null;
  employmentStats: ConstituencyBreakdownStat[] | null;
  housingStats: ConstituencyBreakdownStat[] | null;
  educationStats: ConstituencyBreakdownStat[] | null;
}

export interface ConstituencyHouseholdIncomeProfile {
  householdIncomeValue: number;
  householdIncomeLabel: string;
  householdIncomeMeasure: string;
  householdIncomePeriod: string;
  householdIncomeSource: string;
  householdIncomeCurrency: "GBP";
  aggregationMethod: string;
}

export interface ConstituencyUnemploymentProfile {
  unemploymentRate: number | null;
  unemploymentCount: number | null;
  unemploymentLabel: string;
  unemploymentPeriod: string;
  unemploymentSource: string;
}

export interface ConstituencyVoteResult {
  party: string;
  partySlug: Exclude<PartyValue, "noc"> | "noc";
  candidate: string | null;
  votes: number;
  voteShare: number | null;
  resultPosition: number | null;
  isWinner: boolean;
}

export type ConstituencyElectionType = "general_election" | "by_election";

export interface ConstituencyElectionEvent {
  electionId: string;
  electionType: ConstituencyElectionType;
  electionLabel: string;
  electionYear: number | null;
  pollingDate: string | null;
  turnout: number | null;
  electorate: number | null;
  validVotes: number | null;
  invalidVotes: number | null;
  winnerName: string | null;
  winnerParty: string | null;
  winnerPartySlug: Exclude<PartyValue, "noc"> | "noc" | null;
  majority: number | null;
  majorityPercent: number | null;
  resultSummary: string | null;
  voteResults: ConstituencyVoteResult[];
}

export interface ConstituencyGeographyProfile {
  boundaryCode: string | null;
  boundaryGeoJsonPath: string | null;
  areaKm2: number | null;
  mapAvailable: boolean;
}

export interface ConstituencyMetadataProfile {
  sourceNames: string[];
  sourceUpdatedAt: string | null;
  importedAt: string;
  completenessScore: number;
  notes: string[];
}

export interface ConstituencyProfileRecord {
  id: string;
  slug: string;
  name: string;
  region: string;
  nation: string;
  classification: string | null;
  areaKm2: number | null;
  electorate: number | null;
  population: number | null;
  populationDensity: number | null;
  income: ConstituencyHouseholdIncomeProfile | null;
  unemployment: ConstituencyUnemploymentProfile | null;
  demographics: ConstituencyDemographics | null;
  election: ConstituencyElectionEvent | null;
  electionEvents: ConstituencyElectionEvent[];
  previousGeneralElection: ConstituencyElectionEvent | null;
  geography: ConstituencyGeographyProfile | null;
  metadata: ConstituencyMetadataProfile;
}

export interface MPRecord {
  id: string;
  memberId: number | null;
  slug: string;
  name: string;
  fullName: string | null;
  displayName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  mpSince: string | null;
  currentRole: string | null;
  contactDetails: MPContactDetails | null;
  party: Exclude<PartyValue, "noc"> | "noc";
  partyLabel: string;
  constituencyId: string;
  constituencySlug: string;
  constituencyName: string;
}

export interface MPContactDetails {
  email: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  xTwitter: string | null;
  facebook: string | null;
  instagram: string | null;
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

export interface ConstituencyProfilesFile {
  generatedAt: string;
  items: ConstituencyProfileRecord[];
}

export interface ConstituencyBoundaryMapRecord {
  id: string;
  slug: string;
  name: string;
  boundaryCode: string;
  width: number;
  height: number;
  path: string;
  source: string;
  generatedAt: string;
}

export interface ConstituencyBoundaryMapsFile {
  generatedAt: string;
  items: ConstituencyBoundaryMapRecord[];
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

export interface MembersApiProfileRecord {
  memberId: number;
  overview: Record<string, unknown> | null;
  biography: Record<string, unknown> | null;
  contact: Record<string, unknown> | null;
}

export interface MembersApiProfilesSourceFile {
  source: string;
  fetchedAt: string;
  itemCount: number;
  items: MembersApiProfileRecord[];
}
