import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = process.cwd();

export function resolveProjectPath(...segments: string[]): string {
  return path.join(PROJECT_ROOT, ...segments);
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as T;
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function copyFileWithDirectories(
  fromPath: string,
  toPath: string,
): Promise<void> {
  await ensureDirectory(path.dirname(toPath));
  await cp(fromPath, toPath, { force: true });
}

export async function fetchToFile(url: string, filePath: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  const body = await response.text();
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, body, "utf8");
}

export function logStep(message: string): void {
  console.log(`[votewatch:data] ${message}`);
}

export function isDirectExecution(metaUrl: string): boolean {
  return path.resolve(fileURLToPath(metaUrl)) === path.resolve(process.argv[1] ?? "");
}
