import type { PartyKey } from "@/lib/types";

export const partyColors: Record<PartyKey, string> = {
  conservative: "#2A6FD6",
  labour: "#D83A34",
  libdem: "#F08A24",
  snp: "#F3D347",
  green: "#3F8C4A",
  reform: "#2D8C8C",
  plaidcymru: "#0F6B3A",
  dup: "#7A263A",
  sinnfein: "#69B34C",
  alliance: "#F6B21A",
  other: "#8E949E",
  independent: "#7B4BC4",
  noc: "#F2E8D5",
};

const extendedPartyColors = {
  ...partyColors,
  speaker: "#5E6A7D",
  uup: "#4C68B0",
  sdlp: "#2F8F63",
  unknown: "#8E949E",
} as const;

export const fallbackPartyColor = extendedPartyColors.unknown;

function canonicalizePartyName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;

  const parsed = Number.parseInt(expanded, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

export function normalizePartyColorKey(
  party: PartyKey | string | null | undefined,
): keyof typeof extendedPartyColors {
  if (!party) {
    return "unknown";
  }

  const normalized = canonicalizePartyName(party);

  if (normalized in extendedPartyColors) {
    return normalized as keyof typeof extendedPartyColors;
  }

  if (normalized.includes("conservative")) return "conservative";
  if (normalized.includes("labour")) return "labour";
  if (
    normalized.includes("liberal democrat") ||
    normalized === "lib dem" ||
    normalized === "libdem" ||
    normalized === "ld"
  ) {
    return "libdem";
  }
  if (normalized.includes("scottish national") || normalized === "snp") return "snp";
  if (normalized.includes("green")) return "green";
  if (
    normalized.includes("reform uk") ||
    normalized.includes("reform") ||
    normalized === "ruk"
  ) {
    return "reform";
  }
  if (normalized.includes("plaid cymru")) return "plaidcymru";
  if (normalized === "dup" || normalized.includes("democratic unionist")) return "dup";
  if (normalized === "uup" || normalized.includes("ulster unionist")) return "uup";
  if (normalized === "sdlp" || normalized.includes("social democratic and labour")) return "sdlp";
  if (normalized.includes("sinn fein") || normalized === "sf") return "sinnfein";
  if (normalized === "alliance" || normalized.includes("alliance party")) return "alliance";
  if (normalized.includes("speaker")) return "speaker";
  if (normalized.includes("independent")) return "independent";
  if (normalized.includes("no overall control")) return "noc";
  if (normalized.includes("other")) return "other";

  return "unknown";
}

export function getPartyColor(party: PartyKey | string | null | undefined): string {
  return extendedPartyColors[normalizePartyColorKey(party)] ?? fallbackPartyColor;
}

export function getPartyColorWithOpacity(
  party: PartyKey | string | null | undefined,
  opacity: number,
): string {
  const { r, g, b } = hexToRgb(getPartyColor(party));
  const safeOpacity = Math.max(0, Math.min(opacity, 1));
  return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
}

export function debugPartyColorResolution(party: PartyKey | string | null | undefined) {
  const normalizedKey = normalizePartyColorKey(party);
  return {
    input: party ?? null,
    normalizedKey,
    color: extendedPartyColors[normalizedKey] ?? fallbackPartyColor,
  };
}
