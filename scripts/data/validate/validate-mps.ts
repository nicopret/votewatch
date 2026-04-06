import {
  assertPartyLabelMatches,
  constituenciesFileSchema,
  mpsFileSchema,
} from "../../../lib/data/schemas.ts";
import { isDirectExecution, logStep, readJsonFile, resolveProjectPath } from "../utils.ts";

const constituenciesPath = resolveProjectPath("data", "generated", "constituencies.json");
const mpsPath = resolveProjectPath("data", "generated", "mps.json");

export async function main() {
  const constituencies = constituenciesFileSchema.parse(await readJsonFile(constituenciesPath));
  const mps = mpsFileSchema.parse(await readJsonFile(mpsPath));
  const constituenciesById = new Map(constituencies.items.map((record) => [record.id, record]));

  for (const record of mps.items) {
    assertPartyLabelMatches(record.party, record.partyLabel);

    const constituency = constituenciesById.get(record.constituencyId);
    if (!constituency) {
      throw new Error(
        `Missing constituency "${record.constituencyId}" for MP "${record.id}".`,
      );
    }

    if (constituency.slug !== record.constituencySlug) {
      throw new Error(
        `MP "${record.id}" references constituency slug "${record.constituencySlug}", expected "${constituency.slug}".`,
      );
    }
  }

  logStep(`Validated MP output at ${mpsPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
