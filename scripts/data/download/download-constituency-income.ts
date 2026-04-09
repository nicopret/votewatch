import { cp, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  downloadBinaryToFile,
  ensureNonEmptyFile,
  ensureDirectoryExists,
  isDirectExecution,
  logInfo,
  resolveProjectPath,
  validateContentType,
} from "../utils/index.ts";

const INCOME_WORKBOOK_URL =
  "https://www.ons.gov.uk/file?uri=/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/smallareaincomeestimatesformiddlelayersuperoutputareasenglandandwales/financialyearending2023/datasetfinal.xlsx";
const MSOA_TO_CONSTITUENCY_LOOKUP_URL =
  "https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/098360c460dd41beacbdfad83bc4fea2/csv?layers=0";
const HOUSEHOLD_COUNTS_ZIP_URL =
  "https://www.nomisweb.co.uk/output/census/2021/census2021-ts041.zip";

const incomeWorkbookPath = resolveProjectPath(
  "sources",
  "constituencies",
  "ons-small-area-income-fye-2023.xlsx",
);
const msoaLookupPath = resolveProjectPath(
  "sources",
  "constituencies",
  "msoa21-to-pcon-best-fit-ew.csv",
);
const msoaHouseholdsPath = resolveProjectPath(
  "sources",
  "constituencies",
  "census2021-ts041-msoa-households.csv",
);

const execFileAsync = promisify(execFile);

async function downloadHouseholdCountsCsv(): Promise<void> {
  const tempDir = await mkdtemp(path.join(tmpdir(), "votewatch-ts041-"));
  const zipPath = path.join(tempDir, "census2021-ts041.zip");
  const extractedCsvPath = path.join(tempDir, "census2021-ts041-msoa.csv");

  try {
    const householdsResponse = await downloadBinaryToFile(HOUSEHOLD_COUNTS_ZIP_URL, zipPath, {
      headers: {
        accept: "application/zip,application/octet-stream;q=0.9,*/*;q=0.8",
      },
      timeoutMs: 120_000,
    });

    validateContentType(
      householdsResponse,
      ["application/zip", "application/octet-stream"],
      "Census 2021 MSOA household counts ZIP",
    );
    await ensureNonEmptyFile(zipPath, "Census 2021 MSOA household counts ZIP");
    await execFileAsync("tar", ["-xf", zipPath, "-C", tempDir]);
    await ensureNonEmptyFile(extractedCsvPath, "Extracted Census 2021 MSOA household counts CSV");
    await ensureDirectoryExists(path.dirname(msoaHouseholdsPath));
    await cp(extractedCsvPath, msoaHouseholdsPath, { force: true });
    await ensureNonEmptyFile(msoaHouseholdsPath, "Census 2021 MSOA household counts");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function main() {
  logInfo(`Downloading ONS small-area income workbook from ${INCOME_WORKBOOK_URL}`);
  const workbookResponse = await downloadBinaryToFile(INCOME_WORKBOOK_URL, incomeWorkbookPath, {
    headers: {
      accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 120_000,
  });

  validateContentType(
    workbookResponse,
    [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
      "application/zip",
    ],
    "ONS small-area income workbook",
  );
  await ensureNonEmptyFile(incomeWorkbookPath, "ONS small-area income workbook");

  logInfo(`Downloading ONS MSOA-to-constituency lookup from ${MSOA_TO_CONSTITUENCY_LOOKUP_URL}`);
  const lookupResponse = await downloadBinaryToFile(MSOA_TO_CONSTITUENCY_LOOKUP_URL, msoaLookupPath, {
    headers: {
      accept: "text/csv,application/octet-stream;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 120_000,
  });

  validateContentType(
    lookupResponse,
    ["text/csv", "application/octet-stream", "application/vnd.ms-excel"],
    "ONS MSOA-to-constituency lookup",
  );
  await ensureNonEmptyFile(msoaLookupPath, "ONS MSOA-to-constituency lookup");

  logInfo(`Downloading Census 2021 MSOA household counts from ${HOUSEHOLD_COUNTS_ZIP_URL}`);
  await downloadHouseholdCountsCsv();

  logInfo(`Saved constituency household income source files to ${resolveProjectPath("sources", "constituencies")}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
