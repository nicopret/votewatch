import test from "node:test";
import assert from "node:assert/strict";
import type { ConstituencyBreakdownStat } from "../../lib/data/models.ts";
import {
  getPopulationAgeBarMetrics,
  getPopulationAgeBarWidthPercent,
} from "../../lib/charts/population-age-bars.ts";

function makeItem(label: string, value: number): ConstituencyBreakdownStat {
  return {
    label,
    value,
    unit: "count",
  };
}

test("largest age group always maps to a full-width bar", () => {
  const items = [makeItem("30-39", 9800), makeItem("40-49", 11200), makeItem("50-59", 12450)];
  const { maxValue } = getPopulationAgeBarMetrics(items);

  assert.equal(getPopulationAgeBarWidthPercent(12450, maxValue), 100);
  assert.equal(getPopulationAgeBarWidthPercent(11200, maxValue), 89.95983935742971);
});

test("close values remain proportional and never exceed 100 percent", () => {
  const items = [makeItem("20-29", 1000), makeItem("30-39", 995), makeItem("40-49", 990)];
  const { maxValue } = getPopulationAgeBarMetrics(items);

  assert.equal(getPopulationAgeBarWidthPercent(1000, maxValue), 100);
  assert.equal(getPopulationAgeBarWidthPercent(995, maxValue), 99.5);
  assert.equal(getPopulationAgeBarWidthPercent(990, maxValue), 99);
});

test("evenly distributed datasets render all bars at full width", () => {
  const items = [makeItem("0-9", 500), makeItem("10-19", 500), makeItem("20-29", 500)];
  const { maxValue } = getPopulationAgeBarMetrics(items);

  assert.equal(getPopulationAgeBarWidthPercent(500, maxValue), 100);
});

test("zero values stay empty while very small non-zero values remain visible", () => {
  assert.equal(getPopulationAgeBarWidthPercent(0, 1200), 0);
  assert.equal(getPopulationAgeBarWidthPercent(1, 1200), 4);
});
