import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateWeightedMeanHouseholdIncome,
  buildConstituencyHouseholdIncomeProfile,
} from "../../lib/data/household-income.ts";

test("aggregateWeightedMeanHouseholdIncome uses household counts as weights", () => {
  const value = aggregateWeightedMeanHouseholdIncome([
    { householdIncome: 30000, householdCount: 100 },
    { householdIncome: 45000, householdCount: 300 },
  ]);

  assert.equal(value, 41250);
});

test("aggregateWeightedMeanHouseholdIncome returns null when no valid weights exist", () => {
  const value = aggregateWeightedMeanHouseholdIncome([
    { householdIncome: 30000, householdCount: 0 },
    { householdIncome: 45000, householdCount: -5 },
  ]);

  assert.equal(value, null);
});

test("buildConstituencyHouseholdIncomeProfile rounds to whole pounds and keeps metadata", () => {
  const profile = buildConstituencyHouseholdIncomeProfile(36442.4);

  assert.equal(profile.householdIncomeValue, 36442);
  assert.equal(profile.householdIncomeCurrency, "GBP");
  assert.match(profile.householdIncomeMeasure, /disposable/i);
  assert.match(profile.aggregationMethod, /household-weighted mean/i);
});
