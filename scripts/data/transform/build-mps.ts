import { PARTY_LABELS } from "../../../lib/data/party.ts";
import { toDataSlug } from "../../../lib/data/slug.ts";
import { rawConstituencySourceFileSchema, rawMPSourceFileSchema } from "../../../lib/data/schemas.ts";
import type { MPsFile } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";

const constituencySourcePath = resolveProjectPath("sources", "constituencies", "current.json");
const mpSourcePath = resolveProjectPath("sources", "mps", "current.json");
const outputPath = resolveProjectPath("data", "generated", "mps.json");

export async function main() {
  const rawConstituencies = rawConstituencySourceFileSchema.parse(
    await readJsonFile(constituencySourcePath),
  );
  const rawMps = rawMPSourceFileSchema.parse(await readJsonFile(mpSourcePath));

  const constituenciesById = new Map(
    rawConstituencies.items.map((record) => [record.id, record]),
  );

  const items = rawMps.items
    .map((record) => {
      const constituency = constituenciesById.get(record.constituencyId);

      if (!constituency) {
        throw new Error(
          `MP "${record.name}" references missing constituency "${record.constituencyId}".`,
        );
      }

      return {
        id: record.id,
        slug: toDataSlug(record.name),
        name: record.name,
        party: record.party,
        partyLabel: PARTY_LABELS[record.party],
        constituencyId: constituency.id,
        constituencySlug: toDataSlug(constituency.name),
        constituencyName: constituency.name,
      };
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
