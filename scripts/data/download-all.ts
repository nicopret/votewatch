import { main as downloadConstituencies } from "./download/download-constituencies.ts";
import { main as downloadMps } from "./download/download-mps.ts";
import { main as downloadConstituencyMap } from "./download/download-constituency-map.ts";
import { isDirectExecution, logStep } from "./utils.ts";

export async function main() {
  logStep("Running constituency source staging");
  await downloadConstituencies();
  logStep("Running MP source staging");
  await downloadMps();
  logStep("Running constituency map source staging");
  await downloadConstituencyMap();
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
