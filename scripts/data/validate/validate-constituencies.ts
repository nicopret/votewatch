import { PARTY_LABELS } from "../../../lib/data/party.ts";
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
  const mpsById = new Map(mps.items.map((record) => [record.id, record]));

  for (const record of constituencies.items) {
    assertPartyLabelMatches(record.party, record.partyLabel);

    const mp = mpsById.get(record.mpId);
    if (!mp) {
      throw new Error(`Missing MP "${record.mpId}" for constituency "${record.id}".`);
    }

    if (mp.constituencyId !== record.id) {
      throw new Error(
        `Constituency "${record.id}" links to MP "${record.mpId}", but that MP points to "${mp.constituencyId}".`,
      );
    }

    if (record.partyLabel !== PARTY_LABELS[record.party]) {
      throw new Error(`Unexpected party label for constituency "${record.id}".`);
    }
  }

  logStep(`Validated constituency output at ${constituenciesPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
