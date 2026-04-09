import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = process.cwd();

export function resolveProjectPath(...segments: string[]): string {
  return path.join(PROJECT_ROOT, ...segments);
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export function logInfo(message: string): void {
  console.log(`[votewatch:data] ${message}`);
}

export function isDirectExecution(metaUrl: string): boolean {
  return path.resolve(fileURLToPath(metaUrl)) === path.resolve(process.argv[1] ?? "");
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 60_000, ...requestOptions } = options;
  const signal = AbortSignal.timeout(timeoutMs);
  const response = await fetch(url, {
    ...requestOptions,
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response;
}

export async function saveTextFile(filePath: string, contents: string): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await writeFile(filePath, contents, "utf8");
}

export async function saveBinaryFile(filePath: string, contents: ArrayBuffer): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await writeFile(filePath, Buffer.from(contents));
}

export async function saveJsonFile(filePath: string, data: unknown): Promise<void> {
  await saveTextFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export async function downloadToFile(
  url: string,
  filePath: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const response = await fetchWithTimeout(url, options);
  const body = await response.text();
  await saveTextFile(filePath, body);
  return response;
}

export async function downloadBinaryToFile(
  url: string,
  filePath: string,
  options: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const response = await fetchWithTimeout(url, options);
  const body = await response.arrayBuffer();
  await saveBinaryFile(filePath, body);
  return response;
}

export function validateContentType(
  response: Response,
  allowedTypes: string[],
  label: string,
): void {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (allowedTypes.some((allowed) => contentType.includes(allowed.toLowerCase()))) {
    return;
  }

  throw new Error(
    `${label} returned unexpected content-type "${contentType || "unknown"}". Expected one of ${allowedTypes.join(", ")}.`,
  );
}

export async function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readTextFile(filePath)) as T;
}

export async function ensureNonEmptyFile(filePath: string, label: string): Promise<void> {
  const fileStat = await stat(filePath).catch(() => {
    throw new Error(`${label} was not created at ${filePath}.`);
  });

  if (fileStat.size <= 0) {
    throw new Error(`${label} at ${filePath} is empty.`);
  }
}
