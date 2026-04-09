import constituenciesData from "@/data/generated/constituencies.json";
import constituencyBoundaryMapsData from "@/data/generated/constituency-boundary-maps.json";
import constituencyProfilesData from "@/data/generated/constituency-profiles.json";
import mpsData from "@/data/generated/mps.json";
import type {
  ConstituencyBoundaryMapRecord,
  ConstituencyBoundaryMapsFile,
  ConstituenciesFile,
  ConstituencyProfileRecord,
  ConstituencyProfilesFile,
  ConstituencyRecord,
  MPsFile,
  MPRecord,
} from "@/lib/data/models";

const constituenciesFile = constituenciesData as ConstituenciesFile;
const constituencyBoundaryMapsFile = constituencyBoundaryMapsData as ConstituencyBoundaryMapsFile;
const constituencyProfilesFile = constituencyProfilesData as ConstituencyProfilesFile;
const mpsFile = mpsData as MPsFile;
const constituencyBoundaryMapsById = new Map(
  constituencyBoundaryMapsFile.items.map((item) => [item.id, item]),
);
const constituencyProfilesById = new Map(
  constituencyProfilesFile.items.map((item) => [item.id, item]),
);

export interface ConstituencyPageData {
  constituency: ConstituencyRecord;
  boundaryMap: ConstituencyBoundaryMapRecord | null;
  profile: ConstituencyProfileRecord | null;
  mp: MPRecord | null;
}

export function getAllConstituencies(): ConstituencyRecord[] {
  return constituenciesFile.items;
}

export function getAllConstituencySlugs(): string[] {
  return constituenciesFile.items.map((item) => item.slug);
}

export function getConstituencyBySlug(slug: string): ConstituencyRecord | null {
  return constituenciesFile.items.find((item) => item.slug === slug) ?? null;
}

export function getMpById(id: string): MPRecord | null {
  return mpsFile.items.find((item) => item.id === id) ?? null;
}

export function getConstituencyProfileById(id: string): ConstituencyProfileRecord | null {
  return constituencyProfilesById.get(id) ?? null;
}

export function getConstituencyBoundaryMapByConstituency(
  constituency: ConstituencyRecord,
): ConstituencyBoundaryMapRecord | null {
  return (
    constituencyBoundaryMapsById.get(constituency.id) ??
    constituencyBoundaryMapsFile.items.find((item) => item.slug === constituency.slug) ??
    null
  );
}

export function getConstituencyPageData(slug: string): ConstituencyPageData | null {
  const constituency = getConstituencyBySlug(slug);

  if (!constituency) {
    return null;
  }

  return {
    constituency,
    boundaryMap: getConstituencyBoundaryMapByConstituency(constituency),
    profile: getConstituencyProfileById(constituency.id),
    mp: getMpById(constituency.mpId),
  };
}
