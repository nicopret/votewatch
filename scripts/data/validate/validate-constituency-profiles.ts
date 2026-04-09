import {
  constituenciesFileSchema,
  constituencyProfilesFileSchema,
} from "../../../lib/data/schemas.ts";
import { isDirectExecution, logStep, readJsonFile, resolveProjectPath } from "../utils.ts";

const constituenciesPath = resolveProjectPath("data", "generated", "constituencies.json");
const constituencyProfilesPath = resolveProjectPath(
  "data",
  "generated",
  "constituency-profiles.json",
);

export async function main() {
  const constituencies = constituenciesFileSchema.parse(await readJsonFile(constituenciesPath));
  const profiles = constituencyProfilesFileSchema.parse(await readJsonFile(constituencyProfilesPath));
  const constituencyIds = new Set(constituencies.items.map((record) => record.id));
  let englandWalesIncomeCount = 0;
  let ukUnemploymentCount = 0;

  for (const record of profiles.items) {
    if (!constituencyIds.has(record.id)) {
      throw new Error(`Constituency profile "${record.id}" is missing from constituencies.json.`);
    }

    for (const event of record.electionEvents) {
      if (!event.pollingDate) {
        throw new Error(`Election event "${event.electionId}" for constituency "${record.id}" is missing a polling date.`);
      }

      const winnerCount = event.voteResults.filter((item) => item.isWinner).length;
      if (event.voteResults.length > 0 && winnerCount !== 1) {
        throw new Error(
          `Election event "${event.electionId}" for constituency "${record.id}" should have exactly one winning vote result, received ${winnerCount}.`,
        );
      }
    }

    if (record.electionEvents.length > 0 && !record.election) {
      throw new Error(`Constituency profile "${record.id}" has election events but no selected latest election.`);
    }

    if (record.election && record.electionEvents[0]?.electionId !== record.election.electionId) {
      throw new Error(`Constituency profile "${record.id}" latest selected election is not the first event in its history.`);
    }

    if (record.income && record.income.householdIncomeValue <= 0) {
      throw new Error(`Constituency profile "${record.id}" has a non-positive household income value.`);
    }

    if (record.unemployment) {
      if (
        record.unemployment.unemploymentRate !== null &&
        (record.unemployment.unemploymentRate < 0 || record.unemployment.unemploymentRate > 100)
      ) {
        throw new Error(`Constituency profile "${record.id}" has an invalid unemployment rate.`);
      }

      if (
        record.unemployment.unemploymentCount !== null &&
        record.unemployment.unemploymentCount < 0
      ) {
        throw new Error(`Constituency profile "${record.id}" has an invalid unemployment count.`);
      }

      if (
        record.unemployment.unemploymentRate === null &&
        record.unemployment.unemploymentCount === null
      ) {
        throw new Error(`Constituency profile "${record.id}" has an empty unemployment object.`);
      }

      ukUnemploymentCount += 1;
    }

    if ((record.id.startsWith("E") || record.id.startsWith("W")) && record.income) {
      englandWalesIncomeCount += 1;
    }
  }

  if (englandWalesIncomeCount === 0) {
    throw new Error("No England or Wales constituency profiles have household income data.");
  }

  if (ukUnemploymentCount === 0) {
    throw new Error("No constituency profiles have unemployment data.");
  }

  logStep(`Validated constituency profile output at ${constituencyProfilesPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
