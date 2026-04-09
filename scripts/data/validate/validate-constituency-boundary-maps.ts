import {
  constituenciesFileSchema,
  constituencyBoundaryMapsFileSchema,
} from "../../../lib/data/schemas.ts";
import { isDirectExecution, logStep, readJsonFile, resolveProjectPath } from "../utils.ts";

const constituenciesPath = resolveProjectPath("data", "generated", "constituencies.json");
const boundaryMapsPath = resolveProjectPath("data", "generated", "constituency-boundary-maps.json");

export async function main() {
  const constituencies = constituenciesFileSchema.parse(await readJsonFile(constituenciesPath));
  const boundaryMaps = constituencyBoundaryMapsFileSchema.parse(await readJsonFile(boundaryMapsPath));
  const constituencyIds = new Set(constituencies.items.map((item) => item.id));

  for (const item of boundaryMaps.items) {
    if (!constituencyIds.has(item.id)) {
      throw new Error(`Boundary map "${item.id}" does not match any constituency record.`);
    }
  }

  logStep(`Validated constituency boundary map output at ${boundaryMapsPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
