import {
  fetchWithTimeout,
  isDirectExecution,
  logInfo,
  resolveProjectPath,
  saveJsonFile,
  validateContentType,
} from "../utils/index.ts";

const ELECTIONS_INDEX_URL = "https://electionresults.parliament.uk/elections";
const OUTPUT_PATH = resolveProjectPath("sources", "constituencies", "recent-by-elections.json");

type RecentByElectionSource = {
  source: string;
  fetchedAt: string;
  currentParliamentByElectionsUrl: string;
  items: Array<{
    electionId: string;
    electionUrl: string;
    candidateResultsCsvUrl: string;
    constituencyAreaUrl: string | null;
    constituencyCode: string | null;
    constituencyName: string;
    constituencyClassification: string | null;
    constituencyRegion: string | null;
    constituencyNation: string | null;
    pollingDateText: string;
    title: string | null;
    resultSummaryText: string | null;
    countSummaryText: string | null;
    candidateResultsCsv: string;
  }>;
};

function extractFirstSection(html: string, sectionId: string): string | null {
  const match = html.match(new RegExp(`<div id="${sectionId}">([\\s\\S]*?)</div>`, "i"));
  return match?.[1] ?? null;
}

function parseCurrentParliamentByElectionsUrl(electionsHtml: string): string {
  const section = extractFirstSection(electionsHtml, "by-elections");
  const hrefMatch = section?.match(/href="([^"]+parliament-periods\/\d+#by-elections)"/i);

  if (!hrefMatch?.[1]) {
    throw new Error("Could not locate the current-parliament by-elections link on /elections.");
  }

  return hrefMatch[1];
}

function parseByElectionLinks(parliamentHtml: string) {
  const section = extractFirstSection(parliamentHtml, "by-elections");
  if (!section) {
    return [];
  }

  return [...section.matchAll(/href="([^"]*\/elections\/(\d+))"[^>]*>([^<]+)<\/a>/gi)].map(
    (match) => {
      const [pollingDateText, ...constituencyParts] = match[3].split(" - ");
      return {
        electionId: match[2],
        electionUrl: match[1],
        constituencyName: constituencyParts.join(" - ").trim(),
        pollingDateText: pollingDateText.trim(),
      };
    },
  );
}

function parseCandidateResultsCsvUrl(eventHtml: string, electionUrl: string): string {
  const hrefMatch = eventHtml.match(/href="([^"]+candidate-results\.csv)"/i);
  return hrefMatch?.[1] ?? `${electionUrl}/candidate-results.csv`;
}

function parseConstituencyAreaUrl(eventHtml: string): string | null {
  return eventHtml.match(/href="([^"]*\/constituency-areas\/\d+)"/i)?.[1] ?? null;
}

function parseConstituencyCode(areaHtml: string | null): string | null {
  return areaHtml?.match(/Geographic code:\s*([A-Z]\d{8})/i)?.[1] ?? null;
}

function parseConstituencyContext(areaHtml: string | null) {
  const match = areaHtml?.match(
    /A\s+([a-z]+)\s+constituency\s+in\s+([^,]+),\s+([A-Za-z ]+)\s+established/i,
  );

  return {
    classification: match?.[1]
      ? `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()}`
      : null,
    region: match?.[2]?.trim() ?? null,
    nation: match?.[3]?.trim() ?? null,
  };
}

function parseResultSummaryText(eventHtml: string): string | null {
  const section = extractFirstSection(eventHtml, "result-summary");
  const match = section?.match(/<p>(.*?)<\/p>/i);
  return match?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null;
}

function parseCountSummaryText(eventHtml: string): string | null {
  const match = eventHtml.match(/<p id="count">(.*?)<\/p>/i);
  return match?.[1]?.replace(/<[^>]+>/g, "").trim() ?? null;
}

function parseTitle(eventHtml: string): string | null {
  return eventHtml.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetchWithTimeout(url, {
    headers: {
      accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 90_000,
  });
  validateContentType(response, ["text/html"], `HTML page for ${url}`);
  return response.text();
}

async function fetchCsv(url: string): Promise<string> {
  const response = await fetchWithTimeout(url, {
    headers: {
      accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 90_000,
  });
  validateContentType(response, ["text/csv", "text/plain", "application/octet-stream"], `CSV for ${url}`);
  return response.text();
}

export async function main() {
  logInfo(`Discovering current-parliament by-elections from ${ELECTIONS_INDEX_URL}`);
  const electionsHtml = await fetchHtml(ELECTIONS_INDEX_URL);
  const currentParliamentByElectionsUrl = parseCurrentParliamentByElectionsUrl(electionsHtml).replace(
    /#by-elections$/,
    "",
  );
  const parliamentHtml = await fetchHtml(currentParliamentByElectionsUrl);
  const byElectionLinks = parseByElectionLinks(parliamentHtml);

  const items: RecentByElectionSource["items"] = [];

  for (const link of byElectionLinks) {
    logInfo(`Downloading by-election source data from ${link.electionUrl}`);
    const eventHtml = await fetchHtml(link.electionUrl);
    const candidateResultsCsvUrl = parseCandidateResultsCsvUrl(eventHtml, link.electionUrl);
    const candidateResultsCsv = await fetchCsv(candidateResultsCsvUrl);
    const constituencyAreaUrl = parseConstituencyAreaUrl(eventHtml);
    const areaHtml = constituencyAreaUrl ? await fetchHtml(constituencyAreaUrl) : null;
    const constituencyContext = parseConstituencyContext(areaHtml);

    items.push({
      electionId: link.electionId,
      electionUrl: link.electionUrl,
      candidateResultsCsvUrl,
      constituencyAreaUrl,
      constituencyCode: parseConstituencyCode(areaHtml),
      constituencyName: link.constituencyName,
      constituencyClassification: constituencyContext.classification,
      constituencyRegion: constituencyContext.region,
      constituencyNation: constituencyContext.nation,
      pollingDateText: link.pollingDateText,
      title: parseTitle(eventHtml),
      resultSummaryText: parseResultSummaryText(eventHtml),
      countSummaryText: parseCountSummaryText(eventHtml),
      candidateResultsCsv,
    });
  }

  const output: RecentByElectionSource = {
    source: "UK Parliament election results website by-election pages",
    fetchedAt: new Date().toISOString(),
    currentParliamentByElectionsUrl,
    items,
  };

  await saveJsonFile(OUTPUT_PATH, output);
  logInfo(`Saved ${items.length} recent by-election source records to ${OUTPUT_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
