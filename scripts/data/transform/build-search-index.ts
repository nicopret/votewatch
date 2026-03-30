import { constituenciesFileSchema } from "../../../lib/data/schemas.ts";
import type { SearchIndexFile } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";

const constituenciesPath = resolveProjectPath("data", "generated", "constituencies.json");
const outputPath = resolveProjectPath("data", "generated", "search-index.json");

export async function main() {
  const constituencies = constituenciesFileSchema.parse(await readJsonFile(constituenciesPath));

  const items = constituencies.items.map((record) => ({
    id: record.id,
    slug: record.slug,
    name: record.name,
    type: "constituency" as const,
    mapType: "constituencies" as const,
    aliases: [record.mpName, record.region],
  }));

  const output: SearchIndexFile = {
    generatedAt: new Date().toISOString(),
    items,
  };

  await writeJsonFile(outputPath, output);
  logStep(`Generated ${items.length} search index entries at ${outputPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
