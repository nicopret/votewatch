import {
  downloadToFile,
  ensureNonEmptyFile,
  isDirectExecution,
  logInfo,
  readTextFile,
  resolveProjectPath,
  validateContentType,
} from "../utils/index.ts";

const SOURCE_URL = "https://electionresults.parliament.uk/general-elections.csv";
const TARGET_PATH = resolveProjectPath("sources", "constituencies", "general-elections.csv");

export async function main() {
  logInfo(`Downloading UK Parliament general election results CSV from ${SOURCE_URL}`);
  const response = await downloadToFile(SOURCE_URL, TARGET_PATH, {
    headers: {
      accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 90_000,
  });

  validateContentType(response, ["text/csv", "application/octet-stream", "text/plain"], "Election results CSV");
  await ensureNonEmptyFile(TARGET_PATH, "Election results CSV");

  const contents = await readTextFile(TARGET_PATH);
  if (!contents.includes(",") || !contents.includes("\n")) {
    throw new Error(`Election results CSV at ${TARGET_PATH} does not appear to be valid CSV data.`);
  }

  logInfo(`Saved election results CSV to ${TARGET_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
