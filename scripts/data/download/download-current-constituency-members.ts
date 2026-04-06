import { discoverCurrentMembersSearchPath } from "../utils/members-api.ts";
import {
  fetchWithTimeout,
  isDirectExecution,
  logInfo,
  readJsonFile,
  resolveProjectPath,
  saveJsonFile,
  validateContentType,
} from "../utils/index.ts";

const OPENAPI_PATH = resolveProjectPath("sources", "mps", "members-api.openapi.json");
const TARGET_PATH = resolveProjectPath("sources", "mps", "current-constituencies-or-members.json");
const MEMBERS_API_ORIGIN = "https://members-api.parliament.uk";
const PAGE_SIZE = 20;

interface MembersSearchResponse {
  items: Array<unknown>;
  totalResults: number;
  skip: number;
  take: number;
}

function buildSearchUrl(pathname: string, skip: number): string {
  const url = new URL(pathname, MEMBERS_API_ORIGIN);
  url.searchParams.set("House", "1");
  url.searchParams.set("IsCurrentMember", "true");
  url.searchParams.set("skip", String(skip));
  url.searchParams.set("take", String(PAGE_SIZE));
  return url.toString();
}

export async function main() {
  const openApi = await readJsonFile<Record<string, unknown>>(OPENAPI_PATH).catch(() => {
    throw new Error(
      `Members API OpenAPI spec not found at ${OPENAPI_PATH}. Run data:download:members-openapi first.`,
    );
  });

  const discovered = discoverCurrentMembersSearchPath(openApi);
  logInfo(
    `Discovered current Commons members endpoint from OpenAPI spec: ${discovered.path}`,
  );

  const firstUrl = buildSearchUrl(discovered.path, 0);
  logInfo(`Downloading current Commons member data from ${firstUrl}`);

  const firstResponse = await fetchWithTimeout(firstUrl, {
    headers: {
      accept: "application/json",
    },
    timeoutMs: 90_000,
  });
  validateContentType(firstResponse, ["application/json", "text/json"], "Current Commons member search");
  const firstPage = (await firstResponse.json()) as MembersSearchResponse;

  if (!Array.isArray(firstPage.items) || typeof firstPage.totalResults !== "number") {
    throw new Error("Members API search response parsed, but did not match the expected paging shape.");
  }

  const items = [...firstPage.items];
  const totalResults = firstPage.totalResults;

  for (let skip = firstPage.take; skip < totalResults; skip += PAGE_SIZE) {
    const pageUrl = buildSearchUrl(discovered.path, skip);
    logInfo(`Downloading Members API page starting at ${skip}`);
    const pageResponse = await fetchWithTimeout(pageUrl, {
      headers: {
        accept: "application/json",
      },
      timeoutMs: 90_000,
    });
    validateContentType(pageResponse, ["application/json", "text/json"], "Current Commons member search");
    const page = (await pageResponse.json()) as MembersSearchResponse;

    if (!Array.isArray(page.items)) {
      throw new Error(`Members API page at skip=${skip} did not return an items array.`);
    }

    items.push(...page.items);
  }

  if (items.length === 0) {
    throw new Error("Members API returned zero current Commons members.");
  }

  await saveJsonFile(TARGET_PATH, {
    source: "members-api.parliament.uk",
    discoveredFromOpenApi: true,
    endpoint: discovered.path,
    query: {
      House: 1,
      IsCurrentMember: true,
      take: PAGE_SIZE,
    },
    fetchedAt: new Date().toISOString(),
    totalResults,
    itemCount: items.length,
    items,
  });

  logInfo(`Saved current Commons members and constituency references to ${TARGET_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
