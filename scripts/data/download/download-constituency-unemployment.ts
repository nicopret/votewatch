import {
  downloadBinaryToFile,
  ensureNonEmptyFile,
  isDirectExecution,
  logInfo,
  resolveProjectPath,
  validateContentType,
} from "../utils/index.ts";

const SOURCE_URL =
  "https://www.ons.gov.uk/file?uri=/employmentandlabourmarket/peoplenotinwork/unemployment/datasets/claimantcountbyparliamentaryconstituencyexperimental/current/lmregtabcc02december2025.xls";
const TARGET_PATH = resolveProjectPath(
  "sources",
  "constituencies",
  "ons-claimant-count-constituencies-dec-2025.xls",
);

export async function main() {
  logInfo(`Downloading ONS claimant-count constituency workbook from ${SOURCE_URL}`);
  const response = await downloadBinaryToFile(SOURCE_URL, TARGET_PATH, {
    headers: {
      accept:
        "application/vnd.ms-excel,application/octet-stream;q=0.9,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;q=0.8,*/*;q=0.7",
    },
    timeoutMs: 120_000,
  });

  validateContentType(
    response,
    [
      "application/vnd.ms-excel",
      "application/octet-stream",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    "ONS claimant-count constituency workbook",
  );
  await ensureNonEmptyFile(TARGET_PATH, "ONS claimant-count constituency workbook");
  logInfo(`Saved ONS claimant-count constituency workbook to ${TARGET_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
