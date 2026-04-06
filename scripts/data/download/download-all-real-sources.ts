import { main as downloadConstituencyGeoJson } from "./download-constituency-geojson.ts";
import { main as downloadGeneralElectionResults } from "./download-general-election-results.ts";
import { main as downloadCurrentConstituencyMembers } from "./download-current-constituency-members.ts";
import { main as downloadMembersOpenApi } from "./download-members-openapi.ts";
import { isDirectExecution, logInfo } from "../utils/index.ts";

export async function main() {
  logInfo("Starting official-source staging for constituency metadata and boundaries");
  await downloadGeneralElectionResults();
  await downloadMembersOpenApi();
  await downloadCurrentConstituencyMembers();
  await downloadConstituencyGeoJson();
  logInfo("Completed official-source staging");
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
