import {
  fetchWithTimeout,
  isDirectExecution,
  logInfo,
  saveTextFile,
  resolveProjectPath,
  validateContentType,
} from "../utils/index.ts";

const SOURCE_URL =
  "https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/b49f0eeb2ce540f394831ba3a514d86e/geojson?layers=0";
const TARGET_PATH = resolveProjectPath("sources", "maps", "constituencies-2024-bgc.geojson");

function isGeoJsonFeatureCollection(value: unknown): value is {
  type: "FeatureCollection";
  features: unknown[];
} {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: string }).type === "FeatureCollection" &&
    Array.isArray((value as { features?: unknown[] }).features)
  );
}

export async function main() {
  logInfo(`Downloading ONS July 2024 constituency GeoJSON from ${SOURCE_URL}`);
  const response = await fetchWithTimeout(SOURCE_URL, {
    headers: {
      accept: "application/geo+json,application/json;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 120_000,
  });

  validateContentType(
    response,
    ["application/json", "application/geo+json", "application/octet-stream", "text/plain"],
    "Constituency boundary GeoJSON",
  );

  const body = await response.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(body);
  } catch (error) {
    throw new Error(
      `Boundary download did not parse as JSON. If the ArcGIS Hub file was unavailable, place the GeoJSON manually at ${TARGET_PATH}.`,
    );
  }

  if (isGeoJsonFeatureCollection(parsed)) {
    if (parsed.features.length === 0) {
      throw new Error("Boundary GeoJSON parsed successfully, but contains zero features.");
    }

    await saveTextFile(TARGET_PATH, `${JSON.stringify(parsed, null, 2)}\n`);
    logInfo(`Saved constituency boundary GeoJSON to ${TARGET_PATH}`);
    return;
  }

  const pendingStatus =
    typeof parsed === "object" && parsed !== null
      ? JSON.stringify(parsed)
      : String(parsed);

  throw new Error(
    `ArcGIS Hub download did not return a GeoJSON FeatureCollection. It may still be preparing the file. Response summary: ${pendingStatus}. Retry later, or place a downloaded official GeoJSON manually at ${TARGET_PATH}.`,
  );
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
