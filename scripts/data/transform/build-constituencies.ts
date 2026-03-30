import { PARTY_LABELS } from "../../../lib/data/party.ts";
import { toDataSlug } from "../../../lib/data/slug.ts";
import { mpsFileSchema, rawConstituencySourceFileSchema } from "../../../lib/data/schemas.ts";
import type { ConstituenciesFile } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";

const constituencySourcePath = resolveProjectPath("sources", "constituencies", "current.json");
const mpOutputPath = resolveProjectPath("data", "generated", "mps.json");
const outputPath = resolveProjectPath("data", "generated", "constituencies.json");

export async function main() {
  const rawConstituencies = rawConstituencySourceFileSchema.parse(
    await readJsonFile(constituencySourcePath),
  );
  const mps = mpsFileSchema.parse(await readJsonFile(mpOutputPath));
  const mpsById = new Map(mps.items.map((record) => [record.id, record]));

  const items = rawConstituencies.items
    .map((record) => {
      const mp = mpsById.get(record.mpId);

      if (!mp) {
        throw new Error(
          `Constituency "${record.name}" references missing MP "${record.mpId}".`,
        );
      }

      return {
        id: record.id,
        slug: toDataSlug(record.name),
        name: record.name,
        nation: record.nation,
        region: record.region,
        party: record.party,
        partyLabel: PARTY_LABELS[record.party],
        mpId: mp.id,
        mpName: mp.name,
        majority: record.majority,
        lastElectionYear: record.lastElectionYear,
        lastElectionWinner: record.lastElectionWinner,
        lastElectionResult: record.lastElectionResult,
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
