import {
  constituencyProfilesFileSchema,
  mpsFileSchema,
} from "../../../lib/data/schemas.ts";
import type { ConstituenciesFile } from "../../../lib/data/models.ts";
import {
  isDirectExecution,
  logStep,
  readJsonFile,
  resolveProjectPath,
  writeJsonFile,
} from "../utils.ts";
import {
  constituencyLookupKey,
  normalizePartyName,
  toPartyLabel,
  type MembersApiPayload,
} from "./real-constituency-utils.ts";

const membersSourcePath = resolveProjectPath("sources", "mps", "current-constituencies-or-members.json");
const mpOutputPath = resolveProjectPath("data", "generated", "mps.json");
const constituencyProfilesPath = resolveProjectPath(
  "data",
  "generated",
  "constituency-profiles.json",
);
const outputPath = resolveProjectPath("data", "generated", "constituencies.json");

export async function main() {
  const members = await readJsonFile<MembersApiPayload>(membersSourcePath);
  const mps = mpsFileSchema.parse(await readJsonFile(mpOutputPath));
  const profiles = constituencyProfilesFileSchema.parse(await readJsonFile(constituencyProfilesPath));
  const mpsById = new Map(mps.items.map((record) => [record.id, record]));
  const membersByConstituencyName = new Map(
    members.items.map((record) => [
      constituencyLookupKey(record.value.latestHouseMembership?.membershipFrom ?? ""),
      record,
    ]),
  );
  const profilesByName = new Map(
    profiles.items.map((record) => [constituencyLookupKey(record.name), record]),
  );

  const items = profiles.items
    .map((profile) => {
      const member = membersByConstituencyName.get(
        constituencyLookupKey(profile.name),
      );
      const mpId = member ? `member-${member.value.id}` : "";
      const mp = mpId ? mpsById.get(mpId) : null;
      const party = normalizePartyName(member?.value.latestParty?.name);
      const matchedProfile = profilesByName.get(constituencyLookupKey(profile.name)) ?? profile;

      return {
        id: matchedProfile.id,
        slug: matchedProfile.slug,
        name: matchedProfile.name,
        nation: matchedProfile.nation,
        region: matchedProfile.region,
        party,
        partyLabel: toPartyLabel(party),
        mpId,
        mpName: mp?.name ?? member?.value.nameDisplayAs ?? "Unavailable",
        majority: matchedProfile.election?.majority ?? null,
        lastElectionYear: matchedProfile.election?.electionYear ?? null,
        lastElectionWinner: matchedProfile.election?.winnerName ?? null,
        lastElectionResult: matchedProfile.election
          ? {
              winnerParty: matchedProfile.election.winnerParty,
              majorityPercent: matchedProfile.election.majorityPercent,
              turnout: matchedProfile.election.turnout,
            }
          : null,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));

  const output: ConstituenciesFile = {
    generatedAt: new Date().toISOString(),
    items,
  };

  await writeJsonFile(outputPath, output);
  logStep(`Generated ${items.length} constituency records at ${outputPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
