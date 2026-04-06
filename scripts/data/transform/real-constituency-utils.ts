import { PARTY_LABELS, type PartyValue } from "../../../lib/data/party.ts";
import { toDataSlug } from "../../../lib/data/slug.ts";

export interface MembersApiItem {
  value: {
    id: number;
    nameDisplayAs: string;
    latestParty?: {
      name?: string | null;
    } | null;
    latestHouseMembership?: {
      membershipFrom?: string | null;
    } | null;
  };
}

export interface MembersApiPayload {
  items: MembersApiItem[];
}

export interface RealGeoFeature {
  properties: {
    id: string;
    slug: string;
    name: string;
    nation: string;
    region: string;
  };
}

function fixKnownEncodingIssues(value: string): string {
  return value
    .replace(/Ã…Âµ/g, "u")
    .replace(/Ã¥Âµ/g, "u")
    .replace(/Åµ/g, "w")
    .replace(/[ŵẃẁẅŴẂẀẄ]/g, "w")
    .replace(/Glynd.r/g, "Glyndwr")
    .replace(/glynd.r/g, "glyndwr")
    .replace(/FÃ©in/g, "Féin")
    .replace(/fÃ©in/g, "féin");
}

export function constituencyLookupKey(value: string): string {
  return toDataSlug(fixKnownEncodingIssues(value));
}

export function normalizePartyName(rawName: string | null | undefined): PartyValue {
  const normalized = fixKnownEncodingIssues(rawName ?? "").trim().toLowerCase();

  if (normalized.includes("conservative")) return "conservative";
  if (normalized.includes("labour")) return "labour";
  if (normalized.includes("liberal democrat")) return "libdem";
  if (normalized.includes("scottish national") || normalized === "snp") return "snp";
  if (normalized.includes("green")) return "green";
  if (normalized.includes("reform")) return "reform";
  if (normalized.includes("plaid cymru")) return "plaidcymru";
  if (normalized === "dup" || normalized.includes("democratic unionist")) return "dup";
  if (
    normalized.includes("sinn féin") ||
    normalized.includes("sinn fein") ||
    normalized.includes("sinn f")
  ) {
    return "sinnfein";
  }
  if (normalized === "alliance" || normalized.includes("alliance party")) return "alliance";
  if (normalized.includes("independent")) return "independent";

  return "other";
}

export function buildGeoLookup(features: RealGeoFeature[]) {
  return new Map(
    features.map((feature) => [constituencyLookupKey(feature.properties.name), feature.properties]),
  );
}

export function toPartyLabel(party: PartyValue): string {
  return PARTY_LABELS[party];
}
