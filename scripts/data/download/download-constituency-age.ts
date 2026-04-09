import {
  downloadBinaryToFile,
  ensureNonEmptyFile,
  isDirectExecution,
  logInfo,
  resolveProjectPath,
  validateContentType,
} from "../utils/index.ts";

const SOURCE_URL =
  "https://ukds-ckan.s3.eu-west-1.amazonaws.com/2021/ONS/sex/by-single-year-of-age-detailed/RM200-Sex-By-Single-Year-Of-Age-(Detailed)-2021-p19wpc-ONS.xlsx";
const TARGET_PATH = resolveProjectPath(
  "sources",
  "constituencies",
  "census2021-rm200-p19wpc.xlsx",
);

export async function main() {
  logInfo(`Downloading Census 2021 constituency age workbook from ${SOURCE_URL}`);
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
    "Census 2021 constituency age workbook",
  );
  await ensureNonEmptyFile(TARGET_PATH, "Census 2021 constituency age workbook");

  logInfo(`Saved Census 2021 constituency age workbook to ${TARGET_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
