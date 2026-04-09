import {
  downloadBinaryToFile,
  ensureNonEmptyFile,
  isDirectExecution,
  logInfo,
  resolveProjectPath,
  validateContentType,
} from "../utils/index.ts";

const SOURCE_URL =
  "https://www.ons.gov.uk/file?uri=%2Faboutus%2Ftransparencyandgovernance%2Ffreedomofinformationfoi%2Fpopulationdensityby2024westminsterparliamentaryconstituencies%2Ffoi20263363westminsterparliamentaryconstituenciesmid2021tomid2024.xlsx";
const TARGET_PATH = resolveProjectPath(
  "sources",
  "constituencies",
  "ons-population-density-2024-constituencies.xlsx",
);

export async function main() {
  logInfo(`Downloading ONS constituency population workbook from ${SOURCE_URL}`);
  const response = await downloadBinaryToFile(SOURCE_URL, TARGET_PATH, {
    headers: {
      accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 120_000,
  });

  validateContentType(
    response,
    [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
      "application/zip",
    ],
    "ONS constituency population workbook",
  );
  await ensureNonEmptyFile(TARGET_PATH, "ONS constituency population workbook");

  logInfo(`Saved ONS constituency population workbook to ${TARGET_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
