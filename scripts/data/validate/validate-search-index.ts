import {
  constituenciesFileSchema,
  constituencyGeoJsonSchema,
  searchIndexFileSchema,
} from "../../../lib/data/schemas.ts";
import { isDirectExecution, logStep, readJsonFile, resolveProjectPath } from "../utils.ts";

const constituenciesPath = resolveProjectPath("data", "generated", "constituencies.json");
const searchIndexPath = resolveProjectPath("data", "generated", "search-index.json");
const geoPath = resolveProjectPath("data", "maps", "constituencies.geo.json");

export async function main() {
  const constituencies = constituenciesFileSchema.parse(await readJsonFile(constituenciesPath));
  const searchIndex = searchIndexFileSchema.parse(await readJsonFile(searchIndexPath));
  const geo = constituencyGeoJsonSchema.parse(await readJsonFile(geoPath));

  const constituenciesById = new Map(constituencies.items.map((record) => [record.id, record]));
  const constituenciesBySlug = new Map(
    constituencies.items.map((record) => [record.slug, record]),
  );

  for (const entry of searchIndex.items) {
    const constituency = constituenciesById.get(entry.id);
    if (!constituency) {
      throw new Error(`Search index entry "${entry.id}" does not resolve to a constituency.`);
    }

    if (!constituenciesBySlug.has(entry.slug)) {
      throw new Error(`Search index slug "${entry.slug}" does not exist.`);
    }
  }

  for (const feature of geo.features) {
    if (!constituenciesById.has(feature.properties.id)) {
      throw new Error(`Geo feature "${feature.properties.id}" does not match a constituency.`);
    }
  }

  logStep(`Validated search index and GeoJSON output at ${searchIndexPath} and ${geoPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
