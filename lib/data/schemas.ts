import { z } from "zod";
import { PARTY_LABELS, PARTY_VALUES } from "./party.ts";

export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const partySchema = z.enum(PARTY_VALUES);

export const constituencyRecordSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  nation: z.string().min(1),
  region: z.string().min(1),
  party: partySchema,
  partyLabel: z.string().min(1),
  mpId: z.string().min(1),
  mpName: z.string().min(1),
  majority: z.number().int().nullable(),
  lastElectionYear: z.number().int().nullable(),
  lastElectionWinner: z.string().nullable(),
  lastElectionResult: z.record(z.string(), z.unknown()).nullable(),
});

export const constituencyBreakdownStatSchema = z.object({
  label: z.string().min(1),
  value: z.number().nonnegative(),
  unit: z.enum(["percent", "count"]),
});

export const constituencyDemographicsSchema = z.object({
  ageBreakdown: z.array(constituencyBreakdownStatSchema).nullable(),
  ethnicityBreakdown: z.array(constituencyBreakdownStatSchema).nullable(),
  employmentStats: z.array(constituencyBreakdownStatSchema).nullable(),
  housingStats: z.array(constituencyBreakdownStatSchema).nullable(),
  educationStats: z.array(constituencyBreakdownStatSchema).nullable(),
});

export const constituencyHouseholdIncomeProfileSchema = z.object({
  householdIncomeValue: z.number().nonnegative(),
  householdIncomeLabel: z.string().min(1),
  householdIncomeMeasure: z.string().min(1),
  householdIncomePeriod: z.string().min(1),
  householdIncomeSource: z.string().min(1),
  householdIncomeCurrency: z.literal("GBP"),
  aggregationMethod: z.string().min(1),
});

export const constituencyUnemploymentProfileSchema = z.object({
  unemploymentRate: z.number().nonnegative().nullable(),
  unemploymentCount: z.number().int().nonnegative().nullable(),
  unemploymentLabel: z.string().min(1),
  unemploymentPeriod: z.string().min(1),
  unemploymentSource: z.string().min(1),
});

export const constituencyVoteResultSchema = z.object({
  party: z.string().min(1),
  partySlug: partySchema,
  candidate: z.string().min(1).nullable(),
  votes: z.number().int().nonnegative(),
  voteShare: z.number().nonnegative().max(1).nullable(),
  resultPosition: z.number().int().positive().nullable(),
  isWinner: z.boolean(),
});

export const constituencyElectionTypeSchema = z.enum(["general_election", "by_election"]);

export const constituencyElectionEventSchema = z.object({
  electionId: z.string().min(1),
  electionType: constituencyElectionTypeSchema,
  electionLabel: z.string().min(1),
  electionYear: z.number().int().nullable(),
  pollingDate: z.string().datetime().nullable(),
  turnout: z.number().nonnegative().max(1).nullable(),
  electorate: z.number().int().nonnegative().nullable(),
  validVotes: z.number().int().nonnegative().nullable(),
  invalidVotes: z.number().int().nonnegative().nullable(),
  winnerName: z.string().min(1).nullable(),
  winnerParty: z.string().min(1).nullable(),
  winnerPartySlug: partySchema.nullable(),
  majority: z.number().int().nonnegative().nullable(),
  majorityPercent: z.number().nonnegative().max(1).nullable(),
  resultSummary: z.string().min(1).nullable(),
  voteResults: z.array(constituencyVoteResultSchema),
});

export const constituencyGeographyProfileSchema = z.object({
  boundaryCode: z.string().min(1).nullable(),
  boundaryGeoJsonPath: z.string().min(1).nullable(),
  areaKm2: z.number().positive().nullable(),
  mapAvailable: z.boolean(),
});

export const constituencyMetadataProfileSchema = z.object({
  sourceNames: z.array(z.string().min(1)).min(1),
  sourceUpdatedAt: z.string().datetime().nullable(),
  importedAt: z.string().datetime(),
  completenessScore: z.number().min(0).max(1),
  notes: z.array(z.string().min(1)),
});

export const constituencyProfileRecordSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  region: z.string().min(1),
  nation: z.string().min(1),
  classification: z.string().min(1).nullable(),
  areaKm2: z.number().positive().nullable(),
  electorate: z.number().int().nonnegative().nullable(),
  population: z.number().int().nonnegative().nullable(),
  populationDensity: z.number().positive().nullable(),
  income: constituencyHouseholdIncomeProfileSchema.nullable(),
  unemployment: constituencyUnemploymentProfileSchema.nullable(),
  demographics: constituencyDemographicsSchema.nullable(),
  election: constituencyElectionEventSchema.nullable(),
  electionEvents: z.array(constituencyElectionEventSchema),
  previousGeneralElection: constituencyElectionEventSchema.nullable(),
  geography: constituencyGeographyProfileSchema.nullable(),
  metadata: constituencyMetadataProfileSchema,
});

export const mpRecordSchema = z.object({
  id: z.string().min(1),
  memberId: z.number().int().positive().nullable(),
  slug: slugSchema,
  name: z.string().min(1),
  fullName: z.string().min(1).nullable(),
  displayName: z.string().min(1).nullable(),
  gender: z.string().min(1).nullable(),
  dateOfBirth: z.string().datetime().nullable(),
  mpSince: z.string().datetime().nullable(),
  currentRole: z.string().min(1).nullable(),
  contactDetails: z
    .object({
      email: z.string().min(1).nullable(),
      website: z.string().min(1).nullable(),
      phone: z.string().min(1).nullable(),
      address: z.string().min(1).nullable(),
      xTwitter: z.string().min(1).nullable(),
      facebook: z.string().min(1).nullable(),
      instagram: z.string().min(1).nullable(),
    })
    .nullable(),
  party: partySchema,
  partyLabel: z.string().min(1),
  constituencyId: z.string().min(1),
  constituencySlug: slugSchema,
  constituencyName: z.string().min(1),
});

export const searchIndexEntrySchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  type: z.literal("constituency"),
  mapType: z.literal("constituencies"),
  aliases: z.array(z.string().min(1)).optional(),
});

export const constituenciesFileSchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(constituencyRecordSchema),
});

export const constituencyProfilesFileSchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(constituencyProfileRecordSchema),
});

export const constituencyBoundaryMapRecordSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  boundaryCode: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  path: z.string().min(1),
  source: z.string().min(1),
  generatedAt: z.string().datetime(),
});

export const constituencyBoundaryMapsFileSchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(constituencyBoundaryMapRecordSchema),
});

export const mpsFileSchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(mpRecordSchema),
});

export const searchIndexFileSchema = z.object({
  generatedAt: z.string().datetime(),
  items: z.array(searchIndexEntrySchema),
});

export const geoFeaturePropertiesSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  nation: z.string().min(1),
  region: z.string().min(1),
});

export const geoFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: geoFeaturePropertiesSchema,
  geometry: z.object({
    type: z.string().min(1),
    coordinates: z.unknown(),
  }),
});

export const constituencyGeoJsonSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(geoFeatureSchema).min(1),
});

export const rawConstituencySourceFileSchema = z.object({
  dataset: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      nation: z.string().min(1),
      region: z.string().min(1),
      party: partySchema,
      mpId: z.string().min(1),
      mpName: z.string().min(1),
      majority: z.number().int().nullable(),
      lastElectionYear: z.number().int().nullable(),
      lastElectionWinner: z.string().nullable(),
      lastElectionResult: z.record(z.string(), z.unknown()).nullable(),
    }),
  ),
});

export const rawMPSourceFileSchema = z.object({
  dataset: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      party: partySchema,
      constituencyId: z.string().min(1),
      constituencyName: z.string().min(1),
    }),
  ),
});

export function assertPartyLabelMatches(party: z.infer<typeof partySchema>, label: string) {
  if (PARTY_LABELS[party] !== label) {
    throw new Error(`Party label mismatch for "${party}": received "${label}".`);
  }
}
