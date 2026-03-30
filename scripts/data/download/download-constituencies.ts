import { access } from "node:fs/promises";
import {
  copyFileWithDirectories,
  fetchToFile,
  isDirectExecution,
  logStep,
  resolveProjectPath,
} from "../utils.ts";

const samplePath = resolveProjectPath("sources", "constituencies", "sample-constituencies.json");
const targetPath = resolveProjectPath("sources", "constituencies", "current.json");
const remoteUrl = process.env.VOTEWATCH_CONSTITUENCIES_URL;

export async function main() {
  if (remoteUrl) {
    logStep(`Downloading constituency source data from ${remoteUrl}`);
    await fetchToFile(remoteUrl, targetPath);
    logStep(`Saved constituency source data to ${targetPath}`);
    return;
  }

  await access(samplePath).catch(() => {
    throw new Error(
      `No constituency source URL configured and no sample file found at ${samplePath}.`,
    );
  });

  logStep("No remote constituency URL configured. Staging bundled sample source data.");
  await copyFileWithDirectories(samplePath, targetPath);
  logStep(`Staged constituency source data at ${targetPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
