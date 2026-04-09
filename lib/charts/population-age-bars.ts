import type { ConstituencyBreakdownStat } from "@/lib/data/models";

const MIN_VISIBLE_PERCENT = 4;

export type PopulationAgeBarMetrics = {
  maxValue: number;
  total: number;
};

export function getPopulationAgeBarMetrics(
  items: ConstituencyBreakdownStat[] | null | undefined,
): PopulationAgeBarMetrics {
  const validItems = items?.filter((item) => item.unit === "count") ?? [];

  return {
    maxValue: validItems.reduce((currentMax, item) => Math.max(currentMax, item.value), 0),
    total: validItems.reduce((sum, item) => sum + item.value, 0),
  };
}

export function getPopulationAgeBarWidthPercent(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }

  const scaledWidth = (value / maxValue) * 100;

  if (scaledWidth >= 100) {
    return 100;
  }

  return Math.min(100, Math.max(scaledWidth, MIN_VISIBLE_PERCENT));
}
