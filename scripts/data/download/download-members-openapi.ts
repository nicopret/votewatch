import {
  fetchWithTimeout,
  isDirectExecution,
  logInfo,
  saveJsonFile,
  validateContentType,
  resolveProjectPath,
} from "../utils/index.ts";

const SOURCE_URL = "https://members-api.parliament.uk/swagger/v1/swagger.json";
const TARGET_PATH = resolveProjectPath("sources", "mps", "members-api.openapi.json");

export async function main() {
  logInfo(`Downloading Members API OpenAPI spec from ${SOURCE_URL}`);
  const response = await fetchWithTimeout(SOURCE_URL, {
    headers: {
      accept: "application/json",
    },
    timeoutMs: 90_000,
  });

  validateContentType(response, ["application/json", "text/json"], "Members API OpenAPI spec");

  const spec = await response.json();
  if (!spec || typeof spec !== "object" || !("paths" in spec)) {
    throw new Error("Members API OpenAPI response parsed, but does not look like an OpenAPI document.");
  }

  await saveJsonFile(TARGET_PATH, spec);
  logInfo(`Saved Members API OpenAPI spec to ${TARGET_PATH}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
