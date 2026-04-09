import {
  fetchWithTimeout,
  isDirectExecution,
  logInfo,
  readJsonFile,
  resolveProjectPath,
  saveJsonFile,
  validateContentType,
} from "../utils/index.ts";

const MEMBERS_API_ORIGIN = "https://members-api.parliament.uk";
const currentMembersPath = resolveProjectPath(
  "sources",
  "mps",
  "current-constituencies-or-members.json",
);
const outputPath = resolveProjectPath("sources", "mps", "member-profiles.json");
const CONCURRENCY = 8;

interface MembersApiItem {
  value?: {
    id?: number | null;
  } | null;
}

interface MembersApiPayload {
  items?: MembersApiItem[] | null;
}

interface MemberProfileRecord {
  memberId: number;
  overview: Record<string, unknown> | null;
  biography: Record<string, unknown> | null;
  contact: Record<string, unknown> | null;
}

function buildMemberUrl(memberId: number, suffix = ""): string {
  return new URL(`/api/Members/${memberId}${suffix}`, MEMBERS_API_ORIGIN).toString();
}

async function fetchJsonOrNull(url: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        accept: "application/json",
      },
      timeoutMs: 90_000,
    });
    validateContentType(response, ["application/json", "text/json"], url);
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    logInfo(
      `Warning: failed to fetch ${url}. Proceeding with null for that endpoint. ${String(error)}`,
    );
    return null;
  }
}

async function fetchProfile(memberId: number): Promise<MemberProfileRecord> {
  const [overview, biography, contact] = await Promise.all([
    fetchJsonOrNull(buildMemberUrl(memberId)),
    fetchJsonOrNull(buildMemberUrl(memberId, "/Biography")),
    fetchJsonOrNull(buildMemberUrl(memberId, "/Contact")),
  ]);

  return {
    memberId,
    overview,
    biography,
    contact,
  };
}

async function mapWithConcurrency<TInput, TOutput>(
  values: TInput[],
  mapper: (value: TInput, index: number) => Promise<TOutput>,
  concurrency: number,
): Promise<TOutput[]> {
  const results = new Array<TOutput>(values.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= values.length) {
        return;
      }

      results[currentIndex] = await mapper(values[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker()),
  );

  return results;
}

export async function main() {
  const currentMembers = await readJsonFile<MembersApiPayload>(currentMembersPath);
  const memberIds = (currentMembers.items ?? [])
    .map((item) => item.value?.id ?? null)
    .filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value > 0);

  if (memberIds.length === 0) {
    throw new Error(`No member IDs found in ${currentMembersPath}.`);
  }

  logInfo(`Downloading detailed profiles for ${memberIds.length} current Commons members`);
  const items = await mapWithConcurrency(memberIds, fetchProfile, CONCURRENCY);

  await saveJsonFile(outputPath, {
    source: "members-api.parliament.uk",
    fetchedAt: new Date().toISOString(),
    itemCount: items.length,
    items,
  });

  logInfo(`Saved detailed member profiles to ${outputPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
