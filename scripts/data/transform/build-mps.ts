import { toDataSlug } from "../../../lib/data/slug.ts";
import type { MPsFile } from "../../../lib/data/models.ts";
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
const geoPath = resolveProjectPath("data", "maps", "constituencies.geo.json");
const outputPath = resolveProjectPath("data", "generated", "mps.json");

export async function main() {
  const rawMps = await readJsonFile<MembersApiPayload>(mpSourcePath);
  const geo = await readJsonFile<{ features: RealGeoFeature[] }>(geoPath);
  const geoLookup = buildGeoLookup(geo.features);

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

      const party = normalizePartyName(record.value.latestParty?.name);

      return [
        {
          id: `member-${record.value.id}`,
          slug: toDataSlug(record.value.nameDisplayAs),
          name: record.value.nameDisplayAs,
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
