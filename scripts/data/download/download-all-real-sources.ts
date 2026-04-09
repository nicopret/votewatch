import { main as downloadConstituencyPopulation } from "./download-constituency-population.ts";
import { main as downloadConstituencyGeoJson } from "./download-constituency-geojson.ts";
import { main as downloadElectionCandidacies } from "./download-election-candidacies.ts";
import { main as downloadRecentByElections } from "./download-recent-by-elections.ts";
import { main as downloadGeneralElectionResults } from "./download-general-election-results.ts";
import { main as downloadCurrentConstituencyMembers } from "./download-current-constituency-members.ts";
import { main as downloadMemberProfiles } from "./download-member-profiles.ts";
import { main as downloadMembersOpenApi } from "./download-members-openapi.ts";
import { main as downloadConstituencyAge } from "./download-constituency-age.ts";
import { main as downloadConstituencyIncome } from "./download-constituency-income.ts";
import { main as downloadConstituencyUnemployment } from "./download-constituency-unemployment.ts";
import { isDirectExecution, logInfo } from "../utils/index.ts";

export async function main() {
  logInfo("Starting official-source staging for constituency metadata and boundaries");
  await downloadGeneralElectionResults();
  await downloadElectionCandidacies();
  await downloadRecentByElections();
  await downloadMembersOpenApi();
  await downloadCurrentConstituencyMembers();
  await downloadMemberProfiles();
  await downloadConstituencyPopulation();
  await downloadConstituencyAge();
  await downloadConstituencyIncome();
  await downloadConstituencyUnemployment();
  await downloadConstituencyGeoJson();
  logInfo("Completed official-source staging");
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
