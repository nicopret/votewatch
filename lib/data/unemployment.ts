import type { ConstituencyUnemploymentProfile } from "./models.ts";

export const UNEMPLOYMENT_LABEL = "Unemployment";
export const UNEMPLOYMENT_MEASURE = "Claimant rate";
export const UNEMPLOYMENT_SOURCE =
  "ONS CC02 claimant count by Westminster parliamentary constituency";

function formatNumber(value: number | null, digits = 0): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatPercentValue(value: number | null, digits = 1): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function buildConstituencyUnemploymentProfile({
  unemploymentRate,
  unemploymentCount,
  unemploymentPeriod,
}: {
  unemploymentRate: number | null;
  unemploymentCount: number | null;
  unemploymentPeriod: string;
}): ConstituencyUnemploymentProfile | null {
  if (unemploymentRate === null && unemploymentCount === null) {
    return null;
  }

  return {
    unemploymentRate,
    unemploymentCount,
    unemploymentLabel: UNEMPLOYMENT_MEASURE,
    unemploymentPeriod,
    unemploymentSource: UNEMPLOYMENT_SOURCE,
  };
}

export function formatUnemploymentValue({
  rate,
  count,
}: {
  rate: number | null;
  count: number | null;
}): string {
  const formattedRate = formatPercentValue(rate);
  const formattedCount = formatNumber(count);

  if (formattedRate && formattedCount) {
    return `${formattedRate}% (${formattedCount} people)`;
  }

  if (formattedRate) {
    return `${formattedRate}%`;
  }

  if (formattedCount) {
    return `${formattedCount} people`;
  }

  return "Unavailable";
}
