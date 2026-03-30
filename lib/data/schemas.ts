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

export const mpRecordSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
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
