import constituenciesData from "@/data/generated/constituencies.json";
import mpsData from "@/data/generated/mps.json";
import type {
  ConstituenciesFile,
  ConstituencyRecord,
  MPsFile,
  MPRecord,
} from "@/lib/data/models";

const constituenciesFile = constituenciesData as ConstituenciesFile;
const mpsFile = mpsData as MPsFile;

export interface ConstituencyPageData {
  constituency: ConstituencyRecord;
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

export function getConstituencyPageData(slug: string): ConstituencyPageData | null {
  const constituency = getConstituencyBySlug(slug);

  if (!constituency) {
    return null;
  }

  return {
    constituency,
    mp: getMpById(constituency.mpId),
  };
}
