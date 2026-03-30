import { main as buildConstituencies } from "./transform/build-constituencies.ts";
import { main as buildConstituencyGeo } from "./transform/build-constituency-geo.ts";
import { main as buildMps } from "./transform/build-mps.ts";
import { main as buildSearchIndex } from "./transform/build-search-index.ts";
import { isDirectExecution, logStep } from "./utils.ts";

export async function main() {
  logStep("Building MP output");
  await buildMps();
  logStep("Building constituency output");
  await buildConstituencies();
  logStep("Building search index output");
  await buildSearchIndex();
  logStep("Building constituency GeoJSON output");
  await buildConstituencyGeo();
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
