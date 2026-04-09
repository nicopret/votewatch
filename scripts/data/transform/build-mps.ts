import { toDataSlug } from "../../../lib/data/slug.ts";
import type { MPContactDetails, MPsFile } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";
import {
  buildGeoLookup,
  constituencyLookupKey,
  normalizePartyName,
  toPartyLabel,
  type MembersApiPayload,
  type RealGeoFeature,
} from "./real-constituency-utils.ts";

const mpSourcePath = resolveProjectPath("sources", "mps", "current-constituencies-or-members.json");
const profileSourcePath = resolveProjectPath("sources", "mps", "member-profiles.json");
const geoPath = resolveProjectPath("data", "maps", "constituencies.geo.json");
const outputPath = resolveProjectPath("data", "generated", "mps.json");

interface MemberOverviewValue {
  id?: number | null;
  nameDisplayAs?: string | null;
  nameFullTitle?: string | null;
  gender?: string | null;
  latestParty?: {
    name?: string | null;
  } | null;
  latestHouseMembership?: {
    membershipStartDate?: string | null;
  } | null;
}

interface MemberOverviewResponse {
  value?: MemberOverviewValue | null;
}

interface BiographyItem {
  house?: number | null;
  name?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  additionalInfo?: string | null;
}

interface MemberBiographyValue {
  representations?: BiographyItem[] | null;
  houseMemberships?: BiographyItem[] | null;
  governmentPosts?: BiographyItem[] | null;
  oppositionPosts?: BiographyItem[] | null;
  otherPosts?: BiographyItem[] | null;
  committeeMemberships?: BiographyItem[] | null;
}

interface MemberBiographyResponse {
  value?: MemberBiographyValue | null;
}

interface ContactInformation {
  type?: string | null;
  isPreferred?: boolean | null;
  isWebAddress?: boolean | null;
  line1?: string | null;
  line2?: string | null;
  line3?: string | null;
  line4?: string | null;
  line5?: string | null;
  postcode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

interface ContactInformationResponse {
  value?: ContactInformation[] | null;
}

interface MemberProfileRecord {
  memberId: number;
  overview: MemberOverviewResponse | null;
  biography: MemberBiographyResponse | null;
  contact: ContactInformationResponse | null;
}

interface MemberProfilesSourceFile {
  items: MemberProfileRecord[];
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function normalizeGender(value: string | null | undefined): string | null {
  const normalized = normalizeNullableString(value)?.toLowerCase() ?? null;

  if (!normalized) {
    return null;
  }

  if (normalized === "m" || normalized === "male") {
    return "Male";
  }

  if (normalized === "f" || normalized === "female") {
    return "Female";
  }

  return normalized[0].toUpperCase() + normalized.slice(1);
}

function pickEarliestDate(items: Array<string | null | undefined>): string | null {
  const normalized = items
    .map((value) => normalizeIsoDate(value))
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => left.localeCompare(right));

  return normalized[0] ?? null;
}

function pickCurrentRole(biography: MemberBiographyValue | null | undefined): string | null {
  if (!biography) {
    return null;
  }

  // Prefer the highest-signal active role for UI: government, then opposition,
  // then other posts, then committee memberships if no formal post exists.
  const candidateGroups = [
    biography.governmentPosts ?? [],
    biography.oppositionPosts ?? [],
    biography.otherPosts ?? [],
    biography.committeeMemberships ?? [],
  ];

  for (const group of candidateGroups) {
    const activeRole = group.find((item) => !normalizeNullableString(item.endDate));
    const name = normalizeNullableString(activeRole?.name);

    if (name) {
      return name;
    }
  }

  return null;
}

function normalizeContactDetails(
  contacts: ContactInformation[] | null | undefined,
): MPContactDetails | null {
  const normalizedContacts = contacts ?? [];
  const byPreference = [...normalizedContacts].sort(
    (left, right) => Number(Boolean(right.isPreferred)) - Number(Boolean(left.isPreferred)),
  );

  function findValue(
    predicate: (contact: ContactInformation) => boolean,
    extractor: (contact: ContactInformation) => string | null,
  ): string | null {
    for (const contact of byPreference) {
      if (!predicate(contact)) {
        continue;
      }

      const value = extractor(contact);

      if (value) {
        return value;
      }
    }

    return null;
  }

  function buildAddress(contact: ContactInformation): string | null {
    const lines = [
      contact.line1,
      contact.line2,
      contact.line3,
      contact.line4,
      contact.line5,
      contact.postcode,
    ]
      .map((value) => normalizeNullableString(value))
      .filter((value): value is string => Boolean(value));

    return lines.length > 0 ? lines.join(", ") : null;
  }

  const details: MPContactDetails = {
    email: findValue(
      (contact) => Boolean(normalizeNullableString(contact.email)),
      (contact) => normalizeNullableString(contact.email),
    ),
    website: findValue(
      (contact) => (contact.type ?? "").toLowerCase().includes("website"),
      (contact) => normalizeNullableString(contact.website ?? contact.line1),
    ),
    phone: findValue(
      (contact) => Boolean(normalizeNullableString(contact.phone)),
      (contact) => normalizeNullableString(contact.phone),
    ),
    address: findValue(
      (contact) =>
        !(contact.isWebAddress ?? false) &&
        Boolean(buildAddress(contact)) &&
        ((contact.type ?? "").toLowerCase().includes("office") ||
          (contact.type ?? "").toLowerCase().includes("constituency") ||
          (contact.type ?? "").toLowerCase().includes("parliament")),
      buildAddress,
    ),
    xTwitter: findValue(
      (contact) => (contact.type ?? "").toLowerCase().includes("twitter"),
      (contact) => normalizeNullableString(contact.website ?? contact.line1),
    ),
    facebook: findValue(
      (contact) => (contact.type ?? "").toLowerCase().includes("facebook"),
      (contact) => normalizeNullableString(contact.website ?? contact.line1),
    ),
    instagram: findValue(
      (contact) => (contact.type ?? "").toLowerCase().includes("instagram"),
      (contact) => normalizeNullableString(contact.website ?? contact.line1),
    ),
  };

  return Object.values(details).some((value) => value) ? details : null;
}

export async function main() {
  const rawMps = await readJsonFile<MembersApiPayload>(mpSourcePath);
  const rawProfiles = await readJsonFile<MemberProfilesSourceFile>(profileSourcePath);
  const geo = await readJsonFile<{ features: RealGeoFeature[] }>(geoPath);
  const geoLookup = buildGeoLookup(geo.features);
  const profilesByMemberId = new Map(rawProfiles.items.map((item) => [item.memberId, item]));

  const items = rawMps.items
    .flatMap((record) => {
      const constituencyName = record.value.latestHouseMembership?.membershipFrom ?? "";
      const constituency = geoLookup.get(constituencyLookupKey(constituencyName));

      if (!constituency) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[votewatch:data] Skipping MP "${record.value.nameDisplayAs}" because constituency "${constituencyName}" was not found in GeoJSON.`,
          );
        }
        return [];
      }

      const profile = profilesByMemberId.get(record.value.id);
      const overview = profile?.overview?.value ?? null;
      const biography = profile?.biography?.value ?? null;
      const contact = profile?.contact?.value ?? null;
      const displayName =
        normalizeNullableString(overview?.nameDisplayAs) ??
        normalizeNullableString(record.value.nameDisplayAs);
      const fullName =
        normalizeNullableString(overview?.nameFullTitle) ??
        normalizeNullableString(record.value.nameFullTitle);
      const party = normalizePartyName(
        overview?.latestParty?.name ?? record.value.latestParty?.name,
      );
      const mpSince = pickEarliestDate([
        ...(biography?.representations ?? [])
          .filter((item) => item.house === 1)
          .map((item) => item.startDate),
        ...(biography?.houseMemberships ?? [])
          .filter((item) => item.house === 1)
          .map((item) => item.startDate),
        overview?.latestHouseMembership?.membershipStartDate ??
          record.value.latestHouseMembership?.membershipStartDate,
      ]);

      return [
        {
          id: `member-${record.value.id}`,
          memberId: record.value.id,
          slug: toDataSlug(displayName ?? fullName ?? String(record.value.id)),
          name: displayName ?? fullName ?? `Member ${record.value.id}`,
          fullName,
          displayName,
          gender: normalizeGender(overview?.gender ?? record.value.gender),
          dateOfBirth: null,
          mpSince,
          currentRole: pickCurrentRole(biography),
          contactDetails: normalizeContactDetails(contact),
          party,
          partyLabel: toPartyLabel(party),
          constituencyId: constituency.id,
          constituencySlug: constituency.slug,
          constituencyName: constituency.name,
        },
      ];
    })
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));

  const output: MPsFile = {
    generatedAt: new Date().toISOString(),
    items,
  };

  await writeJsonFile(outputPath, output);
  logStep(`Generated ${items.length} MP records at ${outputPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
