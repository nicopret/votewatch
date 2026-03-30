import { access } from "node:fs/promises";
import {
  copyFileWithDirectories,
  fetchToFile,
  isDirectExecution,
  logStep,
  resolveProjectPath,
} from "../utils.ts";

const samplePath = resolveProjectPath("sources", "maps", "sample-constituencies.geo.json");
const targetPath = resolveProjectPath("sources", "maps", "current-constituencies.geo.json");
const remoteUrl = process.env.VOTEWATCH_CONSTITUENCY_MAP_URL;

export async function main() {
  if (remoteUrl) {
    logStep(`Downloading constituency map data from ${remoteUrl}`);
    await fetchToFile(remoteUrl, targetPath);
    logStep(`Saved constituency map data to ${targetPath}`);
    return;
  }

  await access(samplePath).catch(() => {
    throw new Error(
      `No constituency map URL configured and no sample file found at ${samplePath}.`,
    );
  });

  logStep("No remote constituency map URL configured. Staging bundled sample map data.");
  await copyFileWithDirectories(samplePath, targetPath);
  logStep(`Staged constituency map data at ${targetPath}`);
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
