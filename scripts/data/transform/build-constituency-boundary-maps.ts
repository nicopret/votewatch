import { geoIdentity, geoMercator, geoPath } from "d3-geo";
import type {
  ConstituencyBoundaryMapRecord,
  ConstituencyBoundaryMapsFile,
  ConstituencyGeoJson,
  ConstituencyGeoFeature,
} from "../../../lib/data/models.ts";
import { constituenciesFileSchema } from "../../../lib/data/schemas.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";
import { constituencyLookupKey } from "./real-constituency-utils.ts";

const geoPathInput = resolveProjectPath("data", "maps", "constituencies.geo.json");
const constituenciesPath = resolveProjectPath("data", "generated", "constituencies.json");
const outputPath = resolveProjectPath("data", "generated", "constituency-boundary-maps.json");

const VIEWBOX_WIDTH = 720;
const MIN_HEIGHT = 360;
const PADDING = 18;

function buildSingleBoundaryMap(feature: ConstituencyGeoFeature): Pick<
  ConstituencyBoundaryMapRecord,
  "width" | "height" | "path"
> | null {
  const ranges = collectCoordinateRanges(feature);
  const isProjectedPlanar =
    Math.abs(ranges.minX) > 180 ||
    Math.abs(ranges.maxX) > 180 ||
    Math.abs(ranges.minY) > 90 ||
    Math.abs(ranges.maxY) > 90;
  const projection = isProjectedPlanar ? geoIdentity().reflectY(true) : geoMercator();
  const fitProjection = projection as typeof projection & {
    fitWidth: (width: number, object: unknown) => unknown;
    fitExtent: (extent: [[number, number], [number, number]], object: unknown) => unknown;
  };

  fitProjection.fitWidth(VIEWBOX_WIDTH - PADDING * 2, feature as never);
  const initialPath = geoPath(projection);
  const bounds = initialPath.bounds(feature as never);
  const minY = bounds[0][1];
  const maxY = bounds[1][1];
  const projectedHeight = maxY - minY;
  const height = Math.max(MIN_HEIGHT, Math.ceil(projectedHeight + PADDING * 2));

  fitProjection.fitExtent(
    [
      [PADDING, PADDING],
      [VIEWBOX_WIDTH - PADDING, height - PADDING],
    ],
    feature as never,
  );

  const finalPath = geoPath(projection)(feature as never);
  if (!finalPath) {
    return null;
  }

  return {
    width: VIEWBOX_WIDTH,
    height,
    path: finalPath,
  };
}

function collectCoordinateRanges(feature: ConstituencyGeoFeature) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const polygons =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates as number[][][]]
      : (feature.geometry.coordinates as number[][][][]);

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return { minX, maxX, minY, maxY };
}

export async function main() {
  const generatedAt = new Date().toISOString();
  const geoJson = await readJsonFile<ConstituencyGeoJson>(geoPathInput);
  const constituencies = constituenciesFileSchema.parse(await readJsonFile(constituenciesPath));
  const constituenciesById = new Map(constituencies.items.map((item) => [item.id, item]));
  const constituenciesByName = new Map(
    constituencies.items.map((item) => [constituencyLookupKey(item.name), item]),
  );
  const items: ConstituencyBoundaryMapRecord[] = [];
  let unmatchedCount = 0;
  let renderFailureCount = 0;

  for (const feature of geoJson.features) {
    const matched =
      constituenciesById.get(feature.properties.id) ??
      constituenciesByName.get(constituencyLookupKey(feature.properties.name));

    if (!matched) {
      unmatchedCount += 1;
      continue;
    }

    const rendered = buildSingleBoundaryMap(feature);
    if (!rendered) {
      renderFailureCount += 1;
      continue;
    }

    items.push({
      id: matched.id,
      slug: matched.slug,
      name: matched.name,
      boundaryCode: feature.properties.id,
      width: rendered.width,
      height: rendered.height,
      path: rendered.path,
      source: "ONS Westminster Parliamentary Constituencies (July 2024) boundaries",
      generatedAt,
    });
  }

  const output: ConstituencyBoundaryMapsFile = {
    generatedAt,
    items: items.sort((left, right) => left.name.localeCompare(right.name, "en-GB")),
  };

  await writeJsonFile(outputPath, output);
  logStep(`Generated ${items.length} constituency boundary SVG records at ${outputPath}`);
  if (unmatchedCount > 0 || renderFailureCount > 0) {
    logStep(
      `Boundary map warnings: ${unmatchedCount} unmatched geometries, ${renderFailureCount} render failures.`,
    );
  }
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
