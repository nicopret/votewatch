import { mpsFileSchema } from "../../../lib/data/schemas.ts";
import type { ConstituenciesFile } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";
import {
  constituencyLookupKey,
  normalizePartyName,
  toPartyLabel,
  type MembersApiPayload,
  type RealGeoFeature,
} from "./real-constituency-utils.ts";

const membersSourcePath = resolveProjectPath("sources", "mps", "current-constituencies-or-members.json");
const geoPath = resolveProjectPath("data", "maps", "constituencies.geo.json");
const mpOutputPath = resolveProjectPath("data", "generated", "mps.json");
const outputPath = resolveProjectPath("data", "generated", "constituencies.json");

export async function main() {
  const members = await readJsonFile<MembersApiPayload>(membersSourcePath);
  const geo = await readJsonFile<{ features: RealGeoFeature[] }>(geoPath);
  const mps = mpsFileSchema.parse(await readJsonFile(mpOutputPath));
  const mpsById = new Map(mps.items.map((record) => [record.id, record]));
  const membersByConstituencyName = new Map(
    members.items.map((record) => [
      constituencyLookupKey(record.value.latestHouseMembership?.membershipFrom ?? ""),
      record,
    ]),
  );

  const items = geo.features
    .map((feature) => {
      const member = membersByConstituencyName.get(
        constituencyLookupKey(feature.properties.name),
      );
      const mpId = member ? `member-${member.value.id}` : "";
      const mp = mpId ? mpsById.get(mpId) : null;
      const party = normalizePartyName(member?.value.latestParty?.name);

      return {
        id: feature.properties.id,
        slug: feature.properties.slug,
        name: feature.properties.name,
        nation: feature.properties.nation,
        region: feature.properties.region,
        party,
        partyLabel: toPartyLabel(party),
        mpId,
        mpName: mp?.name ?? member?.value.nameDisplayAs ?? "Unavailable",
        majority: null,
        lastElectionYear: null,
        lastElectionWinner: null,
        lastElectionResult: null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));

  const output: ConstituenciesFile = {
    generatedAt: new Date().toISOString(),
    items,
  };

  await writeJsonFile(outputPath, output);
  logStep(`Generated ${items.length} constituency records at ${outputPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
