import { toDataSlug } from "../../../lib/data/slug.ts";
import { rawConstituencySourceFileSchema } from "../../../lib/data/schemas.ts";
import type { ConstituencyGeoJson } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";

const rawGeoPath = resolveProjectPath("sources", "maps", "current-constituencies.geo.json");
const constituencySourcePath = resolveProjectPath("sources", "constituencies", "current.json");
const outputPath = resolveProjectPath("data", "maps", "constituencies.geo.json");

export async function main() {
  const rawGeo = (await readJsonFile(rawGeoPath)) as {
    type: string;
    features: Array<{
      type: string;
      properties: { id: string };
      geometry: { type: string; coordinates: unknown };
    }>;
  };
  const constituencySource = rawConstituencySourceFileSchema.parse(
    await readJsonFile(constituencySourcePath),
  );
  const constituenciesById = new Map(
    constituencySource.items.map((record) => [record.id, record]),
  );

  const features = rawGeo.features
    .map((feature) => {
      const constituency = constituenciesById.get(feature.properties.id);

      if (!constituency) {
        throw new Error(
          `Geo feature references missing constituency "${feature.properties.id}".`,
        );
      }

      return {
        type: "Feature" as const,
        properties: {
          id: constituency.id,
          slug: toDataSlug(constituency.name),
          name: constituency.name,
          nation: constituency.nation,
          region: constituency.region,
        },
        geometry: feature.geometry,
      };
    })
    .sort((left, right) => left.properties.name.localeCompare(right.properties.name, "en-GB"));

  const output: ConstituencyGeoJson = {
    type: "FeatureCollection",
    features,
  };

  await writeJsonFile(outputPath, output);
  logStep(`Generated ${features.length} geo features at ${outputPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
