import { stat } from "node:fs/promises";
import { geoArea } from "d3-geo";
import xlsx from "xlsx";
import {
  aggregateWeightedMeanHouseholdIncome,
  buildConstituencyHouseholdIncomeProfile,
  HOUSEHOLD_INCOME_SOURCE,
} from "../../../lib/data/household-income.ts";
import {
  buildConstituencyUnemploymentProfile,
  UNEMPLOYMENT_SOURCE,
} from "../../../lib/data/unemployment.ts";
import {
  buildElectionLabel,
  resolveConstituencyMatch,
  selectLatestElectionEvent,
  selectPreviousGeneralElectionEvent,
  sortElectionEventsByDateDesc,
} from "../../../lib/data/elections.ts";
import type { PartyValue } from "../../../lib/data/party.ts";
import type {
  ConstituencyBreakdownStat,
  ConstituencyElectionEvent,
  ConstituencyGeoFeature,
  ConstituencyProfileRecord,
  ConstituencyProfilesFile,
} from "../../../lib/data/models.ts";
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
  type RealGeoFeature,
} from "./real-constituency-utils.ts";

const EARTH_RADIUS_KM = 6371.0088;

const geoPath = resolveProjectPath("data", "maps", "constituencies.geo.json");
const electionCandidaciesPath = resolveProjectPath(
  "sources",
  "constituencies",
  "general-election-2024-candidacies.csv",
);
const recentByElectionsPath = resolveProjectPath(
  "sources",
  "constituencies",
  "recent-by-elections.json",
);
const populationWorkbookPath = resolveProjectPath(
  "sources",
  "constituencies",
  "ons-population-density-2024-constituencies.xlsx",
);
const ageWorkbookPath = resolveProjectPath(
  "sources",
  "constituencies",
  "census2021-rm200-p19wpc.xlsx",
);
const incomeWorkbookPath = resolveProjectPath(
  "sources",
  "constituencies",
  "ons-small-area-income-fye-2023.xlsx",
);
const msoaToConstituencyLookupPath = resolveProjectPath(
  "sources",
  "constituencies",
  "msoa21-to-pcon-best-fit-ew.csv",
);
const msoaHouseholdsPath = resolveProjectPath(
  "sources",
  "constituencies",
  "census2021-ts041-msoa-households.csv",
);
const unemploymentWorkbookPath = resolveProjectPath(
  "sources",
  "constituencies",
  "ons-claimant-count-constituencies-dec-2025.xls",
);
const outputPath = resolveProjectPath("data", "generated", "constituency-profiles.json");

type PopulationRow = {
  "PCON 2024 Code": string;
  "PCON 2024 Name": string;
  "Area Sq Km": number | string;
  "Mid-2024: Population": number | string;
  "Mid-2024: People per Sq Km": number | string;
};

type GeneralElectionRow = {
  "General election polling date": string;
  "Country name": string;
  "English region name": string;
  "Constituency name": string;
  "Constituency geographic code": string;
  "Constituency designation": string;
  Electorate: number | string;
  "Election valid vote count": number | string;
  "Election invalid vote count": number | string;
  "Election result summary": string;
  "Candidate family name": string;
  "Candidate given name": string;
  "Main party name": string;
  "Candidate is standing as independent": boolean | string;
  "Candidate vote count": number | string;
  "Candidate vote share": number | string;
  Majority: number | string;
  "Candidate result position": number | string;
};

type ByElectionCandidateRow = {
  "Candidate family name": string;
  "Candidate given name": string;
  "Main party name": string;
  "Candidate is standing as independent": boolean | string;
  "Candidate vote count": number | string;
  "Candidate vote share": number | string;
  "Candidate result position": number | string;
};

type RecentByElectionSourceFile = {
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

type PopulationRecord = {
  code: string;
  name: string;
  areaKm2: number | null;
  population: number | null;
  density: number | null;
};

type ConstituencyAgeRow = {
  "Post-2019 Westminster Parliamentary constituencies Code": string;
  "Post-2019 Westminster Parliamentary constituencies": string;
  "Age (91 categories)": string;
  "Sex (2 categories)": string;
  Observation: number | string;
};

type ConstituencyAgeRecord = {
  code: string;
  name: string;
  ageBreakdown: ConstituencyBreakdownStat[];
};

type MsoaIncomeRow = {
  "MSOA code": string;
  "MSOA name": string;
  "Disposable (net) annual income (£)": number | string;
};

type MsoaIncomeRecord = {
  code: string;
  name: string;
  disposableAnnualIncome: number;
};

function getMsoaIncomeValue(row: Record<string, unknown>): number | null {
  const incomeEntry = Object.entries(row).find(([key]) =>
    key.startsWith("Disposable (net) annual income ("),
  );

  return incomeEntry ? toNumber(incomeEntry[1]) : null;
}

function readMsoaIncomeRecordsSafe(): MsoaIncomeRecord[] {
  const workbook = xlsx.readFile(incomeWorkbookPath);
  const sheet = workbook.Sheets["Net annual income"];

  if (!sheet) {
    throw new Error('Income workbook is missing the expected "Net annual income" sheet.');
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, range: 3 });
  return rows
    .map((row) => ({
      code: String(row["MSOA code"] ?? "").trim(),
      name: String(row["MSOA name"] ?? "").trim(),
      disposableAnnualIncome: getMsoaIncomeValue(row) ?? Number.NaN,
    }))
    .filter(
      (row) => row.code && row.name && Number.isFinite(row.disposableAnnualIncome) && row.disposableAnnualIncome >= 0,
    );
}

type MsoaHouseholdRow = {
  "geography code": string;
  geography: string;
  "Number of households: Number of households; measures: Value": number | string;
};

type MsoaHouseholdRecord = {
  code: string;
  name: string;
  householdCount: number;
};

type MsoaConstituencyLookupRow = {
  MSOA21CD: string;
  MSOA21NM: string;
  PCON25CD: string;
  PCON25NM: string;
};

type MsoaConstituencyLookupRecord = {
  msoaCode: string;
  msoaName: string;
  constituencyCode: string;
  constituencyName: string;
};

type ConstituencyIncomeAggregate = {
  code: string | null;
  name: string;
  householdIncomeValue: number;
};

type ConstituencyUnemploymentRow = {
  Geography: string;
  "Geography code": string;
  "Number of people1": number | string;
  "Proportion of people2": number | string;
};

type ConstituencyUnemploymentRecord = {
  code: string;
  name: string;
  unemploymentRate: number | null;
  unemploymentCount: number | null;
};

type BuiltElectionContext = {
  code: string | null;
  name: string;
  country: string | null;
  region: string | null;
  classification: string | null;
  event: ConstituencyElectionEvent;
};

function readPopulationRecords(): PopulationRecord[] {
  const workbook = xlsx.readFile(populationWorkbookPath);
  const sheet = workbook.Sheets["Mid-2022 to mid-2024 PCON"];

  if (!sheet) {
    throw new Error(
      'ONS population workbook is missing the expected "Mid-2022 to mid-2024 PCON" sheet.',
    );
  }

  const rows = xlsx.utils.sheet_to_json<PopulationRow>(sheet, { defval: null, range: 3 });
  return rows
    .map((row) => ({
      code: String(row["PCON 2024 Code"] ?? "").trim(),
      name: String(row["PCON 2024 Name"] ?? "").trim(),
      areaKm2: toNumber(row["Area Sq Km"]),
      population: toInteger(row["Mid-2024: Population"]),
      density: toNumber(row["Mid-2024: People per Sq Km"]),
    }))
    .filter((row) => row.code && row.name);
}

const AGE_BAND_LABELS = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"];

// The source workbook is single-year Census 2021 age data; we collapse it into
// stable 10-year bands for a compact constituency-level chart.
function resolveAgeBandLabel(ageLabel: string): string | null {
  const normalized = ageLabel.trim();

  if (!normalized) {
    return null;
  }

  if (normalized === "Aged under 1 year") {
    return "0-9";
  }

  const numericMatch = normalized.match(/Aged (\d+) year/);
  const age = numericMatch ? Number(numericMatch[1]) : Number.NaN;

  if (!Number.isFinite(age)) {
    return null;
  }

  if (age >= 80) {
    return "80+";
  }

  const bandStart = Math.floor(age / 10) * 10;
  return `${bandStart}-${bandStart + 9}`;
}

function readConstituencyAgeRecords(): ConstituencyAgeRecord[] {
  const workbook = xlsx.readFile(ageWorkbookPath);
  const sheet = workbook.Sheets.Dataset;

  if (!sheet) {
    throw new Error('Constituency age workbook is missing the expected "Dataset" sheet.');
  }

  const rows = xlsx.utils.sheet_to_json<ConstituencyAgeRow>(sheet, { defval: null });
  const grouped = new Map<
    string,
    {
      code: string;
      name: string;
      bandCounts: Map<string, number>;
    }
  >();

  for (const row of rows) {
    const code = String(row["Post-2019 Westminster Parliamentary constituencies Code"] ?? "").trim();
    const name = String(row["Post-2019 Westminster Parliamentary constituencies"] ?? "").trim();
    const ageBandLabel = resolveAgeBandLabel(String(row["Age (91 categories)"] ?? ""));
    const observation = toInteger(row.Observation);

    if (!code || !name || !ageBandLabel || observation === null) {
      continue;
    }

    const current = grouped.get(code) ?? {
      code,
      name,
      bandCounts: new Map(AGE_BAND_LABELS.map((label) => [label, 0])),
    };

    current.bandCounts.set(ageBandLabel, (current.bandCounts.get(ageBandLabel) ?? 0) + observation);
    grouped.set(code, current);
  }

  return [...grouped.values()].map((entry) => ({
    code: entry.code,
    name: entry.name,
    ageBreakdown: AGE_BAND_LABELS.map((label) => ({
      label,
      value: entry.bandCounts.get(label) ?? 0,
      unit: "count",
    })),
  }));
}

function readMsoaIncomeRecords(): MsoaIncomeRecord[] {
  const workbook = xlsx.readFile(incomeWorkbookPath);
  const sheet = workbook.Sheets["Net annual income"];

  if (!sheet) {
    throw new Error('Income workbook is missing the expected "Net annual income" sheet.');
  }

  const rows = xlsx.utils.sheet_to_json<MsoaIncomeRow>(sheet, { defval: null, range: 3 });
  return rows
    .map((row) => ({
      code: String(row["MSOA code"] ?? "").trim(),
      name: String(row["MSOA name"] ?? "").trim(),
      disposableAnnualIncome: toNumber(row["Disposable (net) annual income (£)"]) ?? Number.NaN,
    }))
    .filter(
      (row) => row.code && row.name && Number.isFinite(row.disposableAnnualIncome) && row.disposableAnnualIncome >= 0,
    );
}

function readMsoaHouseholdRecords(): MsoaHouseholdRecord[] {
  const workbook = xlsx.readFile(msoaHouseholdsPath, { raw: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error("MSOA household counts CSV did not expose a worksheet.");
  }

  const rows = xlsx.utils.sheet_to_json<MsoaHouseholdRow>(firstSheet, { defval: null });
  return rows
    .map((row) => ({
      code: String(row["geography code"] ?? "").trim(),
      name: String(row.geography ?? "").trim(),
      householdCount:
        toInteger(row["Number of households: Number of households; measures: Value"]) ?? Number.NaN,
    }))
    .filter((row) => row.code && row.name && Number.isFinite(row.householdCount) && row.householdCount > 0);
}

function readMsoaToConstituencyLookupRecords(): MsoaConstituencyLookupRecord[] {
  const workbook = xlsx.readFile(msoaToConstituencyLookupPath, { raw: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error("MSOA-to-constituency lookup CSV did not expose a worksheet.");
  }

  const rows = xlsx.utils.sheet_to_json<MsoaConstituencyLookupRow>(firstSheet, { defval: null });
  return rows
    .map((row) => ({
      msoaCode: String(row.MSOA21CD ?? "").trim(),
      msoaName: String(row.MSOA21NM ?? "").trim(),
      constituencyCode: String(row.PCON25CD ?? "").trim(),
      constituencyName: String(row.PCON25NM ?? "").trim(),
    }))
    .filter((row) => row.msoaCode && row.msoaName && row.constituencyCode && row.constituencyName);
}

function readConstituencyUnemploymentRecords(): {
  period: string;
  records: ConstituencyUnemploymentRecord[];
} {
  const workbook = xlsx.readFile(unemploymentWorkbookPath);
  const coverSheet = workbook.Sheets.Cover_sheet;
  const dataSheet = workbook.Sheets.CC02;

  if (!coverSheet || !dataSheet) {
    throw new Error('Unemployment workbook is missing the expected "Cover_sheet" or "CC02" sheet.');
  }

  const coverRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(coverSheet, { defval: null });
  const coverText = coverRows
    .flatMap((row) => Object.values(row))
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const periodMatch = coverText.join(" ").match(
    /second Thursday of the month:\s+([A-Za-z]+\s+\d{4})/i,
  );
  const period = periodMatch?.[1] ?? "November 2025";

  const rows = xlsx.utils.sheet_to_json<ConstituencyUnemploymentRow>(dataSheet, {
    defval: null,
    range: 4,
  });

  const records = rows
    .map((row) => ({
      code: String(row["Geography code"] ?? "").trim(),
      name: String(row.Geography ?? "").trim(),
      unemploymentCount: toInteger(row["Number of people1"]),
      unemploymentRate: toNumber(row["Proportion of people2"]),
    }))
    .filter((row) => row.code && row.name);

  return { period, records };
}

function readGeneralElectionRows(): GeneralElectionRow[] {
  const workbook = xlsx.readFile(electionCandidaciesPath, { raw: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error("Election candidacies CSV did not expose a worksheet.");
  }

  return xlsx.utils.sheet_to_json<GeneralElectionRow>(firstSheet, { defval: null });
}

function readByElectionRows(csvText: string): ByElectionCandidateRow[] {
  const workbook = xlsx.read(csvText, { type: "string", raw: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) {
    throw new Error("By-election candidate results CSV did not expose a worksheet.");
  }

  return xlsx.utils.sheet_to_json<ByElectionCandidateRow>(firstSheet, { defval: null });
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toInteger(value: unknown): number | null {
  const parsed = toNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

function toIsoDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const ukDateMatch = value.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (ukDateMatch) {
    const [, dayText, monthText, yearText] = ukDateMatch;
    const parsed = new Date(`${monthText} ${dayText}, ${yearText} 00:00:00 UTC`);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString();
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return parsed.toISOString();
}

function formatCandidateName(givenName: string, familyName: string): string | null {
  const parts = [givenName.trim(), familyName.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

function normalizeElectionPartyName(
  row: Pick<
    GeneralElectionRow | ByElectionCandidateRow,
    "Candidate is standing as independent" | "Main party name"
  >,
): string {
  if (String(row["Candidate is standing as independent"]).toLowerCase() === "true") {
    return "Independent";
  }

  return String(row["Main party name"] ?? "").trim() || "Independent";
}

function buildVoteResults(
  rows: Array<GeneralElectionRow | ByElectionCandidateRow>,
): ConstituencyElectionEvent["voteResults"] {
  return rows
    .map((row) => {
      const partyName = normalizeElectionPartyName(row);
      const votes = toInteger(row["Candidate vote count"]) ?? 0;
      const resultPosition = toInteger(row["Candidate result position"]);
      const candidate = formatCandidateName(
        String(row["Candidate given name"] ?? ""),
        String(row["Candidate family name"] ?? ""),
      );

      return {
        party: partyName,
        partySlug: normalizePartyName(partyName),
        candidate,
        votes,
        voteShare: toNumber(row["Candidate vote share"]),
        resultPosition,
        isWinner: resultPosition === 1,
      };
    })
    .sort((left, right) => {
      if (left.resultPosition && right.resultPosition) {
        return left.resultPosition - right.resultPosition;
      }

      return right.votes - left.votes;
    });
}

function buildGeneralElectionEvents(rows: GeneralElectionRow[]): BuiltElectionContext[] {
  const grouped = new Map<string, GeneralElectionRow[]>();

  for (const row of rows) {
    const code = String(row["Constituency geographic code"] ?? "").trim();
    const name = String(row["Constituency name"] ?? "").trim();
    const key = code || constituencyLookupKey(name);

    if (!key) {
      continue;
    }

    const current = grouped.get(key) ?? [];
    current.push(row);
    grouped.set(key, current);
  }

  const items: BuiltElectionContext[] = [];

  for (const records of grouped.values()) {
    const first = records[0];
    const code = String(first["Constituency geographic code"] ?? "").trim() || null;
    const name = String(first["Constituency name"] ?? "").trim();
    const pollingDate = toIsoDate(String(first["General election polling date"] ?? ""));
    const electorate = toInteger(first.Electorate);
    const validVotes = toInteger(first["Election valid vote count"]);
    const invalidVotes = toInteger(first["Election invalid vote count"]);
    const turnout =
      electorate && validVotes !== null
        ? (validVotes + (invalidVotes ?? 0)) / electorate
        : null;
    const voteResults = buildVoteResults(records);
    const winner = voteResults.find((item) => item.isWinner) ?? voteResults[0] ?? null;
    const majority =
      records.map((row) => toInteger(row.Majority)).find((value) => value !== null) ?? null;
    const majorityPercent =
      majority !== null && validVotes && validVotes > 0 ? majority / validVotes : null;

    items.push({
      code,
      name,
      country: String(first["Country name"] ?? "").trim() || null,
      region:
        String(first["English region name"] ?? "").trim() ||
        String(first["Country name"] ?? "").trim() ||
        null,
      classification: String(first["Constituency designation"] ?? "").trim() || null,
      event: {
        electionId: `general-${pollingDate ?? name}`,
        electionType: "general_election",
        electionLabel: buildElectionLabel("general_election", pollingDate),
        electionYear: pollingDate ? new Date(pollingDate).getUTCFullYear() : null,
        pollingDate,
        turnout,
        electorate,
        validVotes,
        invalidVotes,
        winnerName: winner?.candidate ?? null,
        winnerParty: winner?.party ?? null,
        winnerPartySlug: winner?.partySlug ?? null,
        majority,
        majorityPercent,
        resultSummary: String(first["Election result summary"] ?? "").trim() || null,
        voteResults,
      },
    });
  }

  return items;
}

function parseByElectionCounts(countSummaryText: string | null) {
  const match = countSummaryText?.match(
    /An electorate of ([\d,]+), having a valid vote count of ([\d,]+) and an invalid vote count of ([\d,]+)/i,
  );

  return {
    electorate: match ? toInteger(match[1]) : null,
    validVotes: match ? toInteger(match[2]) : null,
    invalidVotes: match ? toInteger(match[3]) : null,
  };
}

function parseTurnoutFromSummary(resultSummaryText: string | null): number | null {
  const match = resultSummaryText?.match(/turnout of ([\d.]+)%/i);
  const percent = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(percent) ? percent / 100 : null;
}

function buildByElectionEvents(source: RecentByElectionSourceFile): BuiltElectionContext[] {
  return source.items.map((item) => {
    const pollingDate = toIsoDate(item.pollingDateText);
    const rows = readByElectionRows(item.candidateResultsCsv);
    const voteResults = buildVoteResults(rows);
    const winner = voteResults.find((entry) => entry.isWinner) ?? voteResults[0] ?? null;
    const runnerUp = voteResults.find((entry) => !entry.isWinner) ?? voteResults[1] ?? null;
    const counts = parseByElectionCounts(item.countSummaryText);
    const majority =
      winner && runnerUp ? Math.max(0, winner.votes - runnerUp.votes) : null;
    const majorityPercent =
      majority !== null && counts.validVotes && counts.validVotes > 0
        ? majority / counts.validVotes
        : null;
    const turnout =
      counts.electorate && counts.validVotes !== null
        ? (counts.validVotes + (counts.invalidVotes ?? 0)) / counts.electorate
        : parseTurnoutFromSummary(item.resultSummaryText);

    return {
      code: item.constituencyCode,
      name: item.constituencyName,
      country: item.constituencyNation,
      region: item.constituencyRegion ?? item.constituencyNation,
      classification: item.constituencyClassification,
      event: {
        electionId: `by-${item.electionId}`,
        electionType: "by_election",
        electionLabel: buildElectionLabel("by_election", pollingDate),
        electionYear: pollingDate ? new Date(pollingDate).getUTCFullYear() : null,
        pollingDate,
        turnout,
        electorate: counts.electorate,
        validVotes: counts.validVotes,
        invalidVotes: counts.invalidVotes,
        winnerName: winner?.candidate ?? null,
        winnerParty: winner?.party ?? null,
        winnerPartySlug: winner?.partySlug ?? null,
        majority,
        majorityPercent,
        resultSummary: item.resultSummaryText,
        voteResults,
      },
    };
  });
}

function buildPopulationLookup(records: PopulationRecord[]) {
  return {
    byCode: new Map(records.map((record) => [record.code, record])),
    byName: new Map(records.map((record) => [constituencyLookupKey(record.name), record])),
  };
}

function buildConstituencyIncomeLookup({
  incomeRecords,
  householdRecords,
  lookupRecords,
  constituencies,
}: {
  incomeRecords: MsoaIncomeRecord[];
  householdRecords: MsoaHouseholdRecord[];
  lookupRecords: MsoaConstituencyLookupRecord[];
  constituencies: Array<{ id: string; name: string }>;
}) {
  const householdsByMsoaCode = new Map(householdRecords.map((record) => [record.code, record]));
  const lookupByMsoaCode = new Map(lookupRecords.map((record) => [record.msoaCode, record]));
  const aggregatedByConstituency = new Map<
    string,
    { code: string; name: string; samples: Array<{ income: number; households: number }> }
  >();
  const missingLookupRows: string[] = [];
  const missingHouseholdRows: string[] = [];

  for (const incomeRecord of incomeRecords) {
    const lookupRecord = lookupByMsoaCode.get(incomeRecord.code);

    if (!lookupRecord) {
      missingLookupRows.push(incomeRecord.code);
      continue;
    }

    const householdRecord = householdsByMsoaCode.get(incomeRecord.code);

    if (!householdRecord) {
      missingHouseholdRows.push(incomeRecord.code);
      continue;
    }

    const current = aggregatedByConstituency.get(lookupRecord.constituencyCode) ?? {
      code: lookupRecord.constituencyCode,
      name: lookupRecord.constituencyName,
      samples: [],
    };

    current.samples.push({
      income: incomeRecord.disposableAnnualIncome,
      households: householdRecord.householdCount,
    });
    aggregatedByConstituency.set(lookupRecord.constituencyCode, current);
  }

  const aggregates: ConstituencyIncomeAggregate[] = [];

  for (const aggregate of aggregatedByConstituency.values()) {
    const householdIncomeValue = aggregateWeightedMeanHouseholdIncome(
      aggregate.samples.map((sample) => ({
        householdIncome: sample.income,
        householdCount: sample.households,
      })),
    );

    if (householdIncomeValue === null) {
      continue;
    }

    aggregates.push({
      code: aggregate.code,
      name: aggregate.name,
      householdIncomeValue,
    });
  }

  const incomeByConstituencyId = new Map<string, ReturnType<typeof buildConstituencyHouseholdIncomeProfile>>();
  const unmatchedAggregates: Array<{ code: string | null; name: string; strategy: string }> = [];
  const ambiguousAggregates: Array<{ code: string | null; name: string }> = [];
  const matchStrategyCounts = {
    code: 0,
    exact_name: 0,
    normalized_name: 0,
  };

  for (const aggregate of aggregates) {
    const matchResult = resolveConstituencyMatch({
      code: aggregate.code,
      name: aggregate.name,
      targets: constituencies,
    });

    if (!matchResult.matched) {
      if (matchResult.strategy === "ambiguous_normalized_name") {
        ambiguousAggregates.push({ code: aggregate.code, name: aggregate.name });
      } else {
        unmatchedAggregates.push({
          code: aggregate.code,
          name: aggregate.name,
          strategy: matchResult.strategy,
        });
      }
      continue;
    }

    matchStrategyCounts[matchResult.strategy] += 1;
    incomeByConstituencyId.set(
      matchResult.matched.id,
      buildConstituencyHouseholdIncomeProfile(aggregate.householdIncomeValue),
    );
  }

  return {
    incomeByConstituencyId,
    sourceCounts: {
      incomeRows: incomeRecords.length,
      householdRows: householdRecords.length,
      lookupRows: lookupRecords.length,
      aggregatedConstituencies: aggregates.length,
    },
    missingLookupRows,
    missingHouseholdRows,
    unmatchedAggregates,
    ambiguousAggregates,
    matchStrategyCounts,
  };
}

function deriveAreaFromGeometry(feature: ConstituencyGeoFeature): number | null {
  try {
    const steradians = geoArea(feature as never);
    const areaKm2 = steradians * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
    return areaKm2 > 0 ? areaKm2 : null;
  } catch {
    return null;
  }
}

function calculateCompletenessScore(record: ConstituencyProfileRecord): number {
  const checks = [
    record.classification !== null,
    record.areaKm2 !== null,
    record.electorate !== null,
    record.population !== null,
    record.populationDensity !== null,
    record.income !== null,
    record.election !== null,
    Boolean(record.election?.winnerName),
    record.election?.majorityPercent !== null,
    record.geography?.mapAvailable ?? false,
  ];

  const passed = checks.filter(Boolean).length;
  return Number((passed / checks.length).toFixed(3));
}

async function getSourceUpdatedAt(): Promise<string | null> {
  const stats = await Promise.all([
    stat(electionCandidaciesPath).catch(() => null),
    stat(recentByElectionsPath).catch(() => null),
    stat(populationWorkbookPath).catch(() => null),
    stat(ageWorkbookPath).catch(() => null),
    stat(incomeWorkbookPath).catch(() => null),
    stat(msoaToConstituencyLookupPath).catch(() => null),
    stat(msoaHouseholdsPath).catch(() => null),
    stat(unemploymentWorkbookPath).catch(() => null),
    stat(geoPath).catch(() => null),
  ]);

  const latestMs = stats
    .map((entry) => entry?.mtimeMs ?? 0)
    .reduce((current, next) => Math.max(current, next), 0);

  return latestMs > 0 ? new Date(latestMs).toISOString() : null;
}

function buildElectionEventsLookup({
  constituencies,
  generalElectionEvents,
  byElectionEvents,
}: {
  constituencies: Array<{ id: string; name: string }>;
  generalElectionEvents: BuiltElectionContext[];
  byElectionEvents: BuiltElectionContext[];
}) {
  const eventsByConstituencyId = new Map<string, ConstituencyElectionEvent[]>();
  const unmatchedEvents: Array<{ eventId: string; name: string; code: string | null; strategy: string }> = [];
  const ambiguousEvents: Array<{ eventId: string; name: string; code: string | null }> = [];
  const matchStrategyCounts = {
    code: 0,
    exact_name: 0,
    normalized_name: 0,
  };

  for (const sourceEvent of [...generalElectionEvents, ...byElectionEvents]) {
    const matchResult = resolveConstituencyMatch({
      code: sourceEvent.code,
      name: sourceEvent.name,
      targets: constituencies,
    });

    if (!matchResult.matched) {
      if (matchResult.strategy === "ambiguous_normalized_name") {
        ambiguousEvents.push({
          eventId: sourceEvent.event.electionId,
          name: sourceEvent.name,
          code: sourceEvent.code,
        });
      } else {
        unmatchedEvents.push({
          eventId: sourceEvent.event.electionId,
          name: sourceEvent.name,
          code: sourceEvent.code,
          strategy: matchResult.strategy,
        });
      }
      continue;
    }

    matchStrategyCounts[matchResult.strategy] += 1;
    const current = eventsByConstituencyId.get(matchResult.matched.id) ?? [];
    current.push(sourceEvent.event);
    eventsByConstituencyId.set(matchResult.matched.id, current);
  }

  return {
    eventsByConstituencyId,
    unmatchedEvents,
    ambiguousEvents,
    matchStrategyCounts,
  };
}

export async function main() {
  const importedAt = new Date().toISOString();
  const populationRows = readPopulationRecords();
  const populationLookup = buildPopulationLookup(populationRows);
  const ageLookup = new Map(readConstituencyAgeRecords().map((record) => [record.code, record]));
  const geo = await readJsonFile<{ features: RealGeoFeature[] }>(geoPath);
  const unemploymentSource = readConstituencyUnemploymentRecords();
  const unemploymentLookup = new Map(
    unemploymentSource.records.map((record) => [
      record.code,
      buildConstituencyUnemploymentProfile({
        unemploymentRate: record.unemploymentRate,
        unemploymentCount: record.unemploymentCount,
        unemploymentPeriod: unemploymentSource.period,
      }),
    ]),
  );
  const incomeLookup = buildConstituencyIncomeLookup({
    incomeRecords: readMsoaIncomeRecordsSafe(),
    householdRecords: readMsoaHouseholdRecords(),
    lookupRecords: readMsoaToConstituencyLookupRecords(),
    constituencies: geo.features.map((feature) => ({
      id: feature.properties.id,
      name: feature.properties.name,
    })),
  });
  const generalElectionEvents = buildGeneralElectionEvents(readGeneralElectionRows());
  const recentByElections = await readJsonFile<RecentByElectionSourceFile>(recentByElectionsPath);
  const byElectionEvents = buildByElectionEvents(recentByElections);
  const sourceUpdatedAt = await getSourceUpdatedAt();
  const constituencyTargets = geo.features.map((feature) => ({
    id: feature.properties.id,
    name: feature.properties.name,
  }));
  const electionLookup = buildElectionEventsLookup({
    constituencies: constituencyTargets,
    generalElectionEvents,
    byElectionEvents,
  });
  let missingPopulationCount = 0;
  let missingIncomeCount = 0;
  let missingUnemploymentCount = 0;
  let missingElectionCount = 0;
  let multiEventSeatCount = 0;

  const items = geo.features
    .map((feature) => {
      const code = feature.properties.id;
      const name = feature.properties.name;
      const nameKey = constituencyLookupKey(name);
      const populationRecord =
        populationLookup.byCode.get(code) ?? populationLookup.byName.get(nameKey) ?? null;
      const electionEvents = sortElectionEventsByDateDesc(
        electionLookup.eventsByConstituencyId.get(code) ?? [],
      );
      const latestElection = selectLatestElectionEvent(electionEvents);
      const previousGeneralElection = selectPreviousGeneralElectionEvent(electionEvents);

      if (!populationRecord) {
        missingPopulationCount += 1;
      }

      if (!latestElection) {
        missingElectionCount += 1;
      }

      if (electionEvents.length > 1) {
        multiEventSeatCount += 1;
      }

      const areaFromGeometry = deriveAreaFromGeometry(feature as unknown as ConstituencyGeoFeature);
      const areaKm2Candidate = populationRecord?.areaKm2 ?? areaFromGeometry;
      const areaKm2 = areaKm2Candidate && areaKm2Candidate > 0 ? areaKm2Candidate : null;
      const population = populationRecord?.population ?? null;
      const ageRecord = ageLookup.get(code) ?? null;
      const incomeRecord = incomeLookup.incomeByConstituencyId.get(code) ?? null;
      const unemploymentRecord = unemploymentLookup.get(code) ?? null;
      const populationDensity =
        populationRecord?.density ??
        (population !== null && areaKm2 !== null && areaKm2 > 0 ? population / areaKm2 : null);
      const metadataNotes: string[] = [];

      if (!populationRecord && (code.startsWith("S") || code.startsWith("N"))) {
        metadataNotes.push(
          "Population and density are currently unavailable here because the initial ONS workbook only covers England and Wales constituencies.",
        );
      }

      if (!ageRecord && (code.startsWith("S") || code.startsWith("N"))) {
        metadataNotes.push(
          "Age breakdown is currently unavailable here because the integrated Census 2021 age workbook only covers England and Wales constituencies.",
        );
      }

      if (!incomeRecord) {
        missingIncomeCount += 1;
      }

      if (!unemploymentRecord) {
        missingUnemploymentCount += 1;
      }

      if (!incomeRecord && (code.startsWith("S") || code.startsWith("N"))) {
        metadataNotes.push(
          "Household income is currently unavailable here because the integrated official income model covers England and Wales MSOAs only.",
        );
      }

      if (!latestElection) {
        metadataNotes.push("Latest election data was not matched for this constituency.");
      }

      if (latestElection?.electionType === "by_election" && previousGeneralElection) {
        metadataNotes.push(
          "The latest displayed result is a by-election; the previous general election is retained separately in the generated data.",
        );
      }

      const fallbackGeneralElection = generalElectionEvents.find((event) => event.code === code);

      const record: ConstituencyProfileRecord = {
        id: code,
        slug: feature.properties.slug,
        name,
        region:
          latestElection?.electionType === "by_election"
            ? byElectionEvents.find((event) => event.code === code)?.region ??
              fallbackGeneralElection?.region ??
              feature.properties.region
            : fallbackGeneralElection?.region ?? feature.properties.region,
        nation:
          latestElection?.electionType === "by_election"
            ? byElectionEvents.find((event) => event.code === code)?.country ??
              fallbackGeneralElection?.country ??
              feature.properties.nation
            : fallbackGeneralElection?.country ?? feature.properties.nation,
        classification:
          byElectionEvents.find((event) => event.code === code)?.classification ??
          fallbackGeneralElection?.classification ??
          null,
        areaKm2,
        electorate: latestElection?.electorate ?? null,
        population,
        populationDensity,
        income: incomeRecord,
        unemployment: unemploymentRecord,
        demographics: ageRecord
          ? {
              ageBreakdown: ageRecord.ageBreakdown,
              ethnicityBreakdown: null,
              employmentStats: null,
              housingStats: null,
              educationStats: null,
            }
          : null,
        election: latestElection,
        electionEvents,
        previousGeneralElection,
        geography: {
          boundaryCode: code,
          boundaryGeoJsonPath: "data/maps/constituencies.geo.json",
          areaKm2,
          mapAvailable: true,
        },
        metadata: {
          sourceNames: [
            "UK Parliament 2024 general election candidacies CSV",
            "UK Parliament recent by-election pages and candidate-results CSVs",
            "ONS Westminster constituency population workbook",
            "Census 2021 age by single year workbook for post-2019 Westminster constituencies",
            HOUSEHOLD_INCOME_SOURCE,
            UNEMPLOYMENT_SOURCE,
            "ONS MSOA (2021) to Westminster constituency best-fit lookup for England and Wales",
            "Nomis Census 2021 TS041 number of households by MSOA",
            "ONS July 2024 constituency GeoJSON",
          ],
          sourceUpdatedAt,
          importedAt,
          completenessScore: 0,
          notes: metadataNotes,
        },
      };

      record.metadata.completenessScore = calculateCompletenessScore(record);
      return record;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "en-GB"));

  const output: ConstituencyProfilesFile = {
    generatedAt: importedAt,
    items,
  };

  await writeJsonFile(outputPath, output);
  logStep(`Generated ${items.length} constituency profile records at ${outputPath}`);
  logStep(
    `Election events imported: ${generalElectionEvents.length} general-election events, ${byElectionEvents.length} by-election events.`,
  );
  logStep(
    `Election match strategies: ${electionLookup.matchStrategyCounts.code} by code, ${electionLookup.matchStrategyCounts.exact_name} by exact name, ${electionLookup.matchStrategyCounts.normalized_name} by normalized name.`,
  );
  logStep(
    `Election import warnings: ${electionLookup.unmatchedEvents.length} unmatched events, ${electionLookup.ambiguousEvents.length} ambiguous events, ${multiEventSeatCount} constituencies with multiple election events.`,
  );
  logStep(
    `Household income source rows imported: ${incomeLookup.sourceCounts.incomeRows} income rows, ${incomeLookup.sourceCounts.householdRows} household rows, ${incomeLookup.sourceCounts.lookupRows} lookup rows, ${incomeLookup.sourceCounts.aggregatedConstituencies} aggregated constituency income values.`,
  );
  logStep(
    `Unemployment source rows imported: ${unemploymentSource.records.length} constituency claimant-count rows for ${unemploymentSource.period}.`,
  );
  logStep(
    `Income match strategies: ${incomeLookup.matchStrategyCounts.code} by code, ${incomeLookup.matchStrategyCounts.exact_name} by exact name, ${incomeLookup.matchStrategyCounts.normalized_name} by normalized name.`,
  );
  logStep(
    `Income import warnings: ${incomeLookup.missingLookupRows.length} MSOA income rows without a constituency lookup, ${incomeLookup.missingHouseholdRows.length} income rows without household weights, ${incomeLookup.unmatchedAggregates.length} unmatched constituency aggregates, ${incomeLookup.ambiguousAggregates.length} ambiguous constituency aggregates.`,
  );
  logStep(
    `Constituency profile import warnings: ${missingPopulationCount} without population data, ${missingElectionCount} without election data.`,
  );
  logStep(`Constituency profile income coverage: ${missingIncomeCount} without household income data.`);
  logStep(`Constituency profile unemployment coverage: ${missingUnemploymentCount} without unemployment data.`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
