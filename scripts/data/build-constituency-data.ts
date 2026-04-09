import { main as buildConstituencies } from "./transform/build-constituencies.ts";
import { main as buildConstituencyGeo } from "./transform/build-constituency-geo.ts";
import { main as buildConstituencyBoundaryMaps } from "./transform/build-constituency-boundary-maps.ts";
import { main as buildConstituencyProfiles } from "./transform/build-constituency-profiles.ts";
import { main as buildMps } from "./transform/build-mps.ts";
import { main as buildSearchIndex } from "./transform/build-search-index.ts";
import { isDirectExecution, logStep } from "./utils.ts";

export async function main() {
  logStep("Building constituency GeoJSON output");
  await buildConstituencyGeo();
  logStep("Building MP output");
  await buildMps();
  logStep("Building constituency profile output");
  await buildConstituencyProfiles();
  logStep("Building constituency boundary map output");
  await buildConstituencyBoundaryMaps();
  logStep("Building constituency output");
  await buildConstituencies();
  logStep("Building search index output");
  await buildSearchIndex();
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
