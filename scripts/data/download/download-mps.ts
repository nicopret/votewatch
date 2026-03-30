import { access } from "node:fs/promises";
import {
  copyFileWithDirectories,
  fetchToFile,
  isDirectExecution,
  logStep,
  resolveProjectPath,
} from "../utils.ts";

const samplePath = resolveProjectPath("sources", "mps", "sample-mps.json");
const targetPath = resolveProjectPath("sources", "mps", "current.json");
const remoteUrl = process.env.VOTEWATCH_MPS_URL;

export async function main() {
  if (remoteUrl) {
    logStep(`Downloading MP source data from ${remoteUrl}`);
    await fetchToFile(remoteUrl, targetPath);
    logStep(`Saved MP source data to ${targetPath}`);
    return;
  }

  await access(samplePath).catch(() => {
    throw new Error(`No MP source URL configured and no sample file found at ${samplePath}.`);
  });

  logStep("No remote MP URL configured. Staging bundled sample source data.");
  await copyFileWithDirectories(samplePath, targetPath);
  logStep(`Staged MP source data at ${targetPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
