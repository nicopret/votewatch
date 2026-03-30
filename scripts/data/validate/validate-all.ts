import { main as validateConstituencies } from "./validate-constituencies.ts";
import { main as validateMps } from "./validate-mps.ts";
import { main as validateSearchIndex } from "./validate-search-index.ts";
import { isDirectExecution, logStep } from "../utils.ts";

export async function main() {
  logStep("Validating constituency output");
  await validateConstituencies();
  logStep("Validating MP output");
  await validateMps();
  logStep("Validating search index and GeoJSON output");
  await validateSearchIndex();
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
