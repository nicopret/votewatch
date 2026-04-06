import { toDataSlug } from "../../../lib/data/slug.ts";
import type { ConstituencyGeoJson } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";

const rawGeoPath = resolveProjectPath("sources", "maps", "constituencies-2024-bgc.geojson");
const outputPath = resolveProjectPath("data", "maps", "constituencies.geo.json");

function inferNationFromCode(code: string): string {
  if (code.startsWith("S")) {
    return "Scotland";
  }

  if (code.startsWith("W")) {
    return "Wales";
  }

  if (code.startsWith("N")) {
    return "Northern Ireland";
  }

  return "England";
}

export async function main() {
  const rawGeo = (await readJsonFile(rawGeoPath)) as {
    type: string;
    features: Array<{
      type: string;
      properties: {
        PCON24CD?: string;
        PCON24NM?: string;
      };
      geometry: { type: string; coordinates: unknown };
    }>;
  };

  const features = rawGeo.features
    .map((feature) => {
      const id = feature.properties.PCON24CD;
      const name = feature.properties.PCON24NM;

      if (!id || !name) {
        throw new Error(
          "Real constituency GeoJSON is missing expected PCON24CD/PCON24NM properties.",
        );
      }

      return {
        type: "Feature" as const,
        properties: {
          id,
          slug: toDataSlug(name),
          name,
          nation: inferNationFromCode(id),
          region: inferNationFromCode(id),
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
