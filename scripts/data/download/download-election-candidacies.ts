import {
  downloadToFile,
  ensureNonEmptyFile,
  isDirectExecution,
  logInfo,
  readTextFile,
  resolveProjectPath,
  validateContentType,
} from "../utils/index.ts";

const SOURCE_URL = "https://electionresults.parliament.uk/general-elections/6/candidacies.csv";
const TARGET_PATH = resolveProjectPath("sources", "constituencies", "general-election-2024-candidacies.csv");

export async function main() {
  logInfo(`Downloading UK Parliament 2024 general election candidacies CSV from ${SOURCE_URL}`);
  const response = await downloadToFile(SOURCE_URL, TARGET_PATH, {
    headers: {
      accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
    timeoutMs: 90_000,
  });

  validateContentType(
    response,
    ["text/csv", "application/octet-stream", "text/plain"],
    "Election candidacies CSV",
  );
  await ensureNonEmptyFile(TARGET_PATH, "Election candidacies CSV");

  const contents = await readTextFile(TARGET_PATH);
  if (!contents.includes("Constituency geographic code") || !contents.includes("Candidate vote count")) {
    throw new Error(
      `Election candidacies CSV at ${TARGET_PATH} is missing expected constituency result headers.`,
    );
  }

  logInfo(`Saved election candidacies CSV to ${TARGET_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
