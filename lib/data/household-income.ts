import type { ConstituencyHouseholdIncomeProfile } from "./models.ts";

export const HOUSEHOLD_INCOME_LABEL = "Household income";
export const HOUSEHOLD_INCOME_MEASURE = "Mean disposable (net) annual household income";
export const HOUSEHOLD_INCOME_PERIOD = "Financial year ending March 2023";
export const HOUSEHOLD_INCOME_PERIOD_SHORT = "FYE March 2023";
export const HOUSEHOLD_INCOME_SOURCE =
  "ONS Income estimates for small areas, England and Wales: financial year ending 2023";
export const HOUSEHOLD_INCOME_CURRENCY = "GBP";
export const HOUSEHOLD_INCOME_AGGREGATION_METHOD =
  "Household-weighted mean of MSOA disposable (net) annual household income using Census 2021 MSOA household counts and the ONS MSOA-to-Westminster constituency best-fit lookup for England and Wales.";

export type WeightedHouseholdIncomeSample = {
  householdIncome: number;
  householdCount: number;
};

export function aggregateWeightedMeanHouseholdIncome(
  samples: WeightedHouseholdIncomeSample[],
): number | null {
  let weightedIncomeSum = 0;
  let householdCountSum = 0;

  for (const sample of samples) {
    if (sample.householdIncome < 0 || sample.householdCount <= 0) {
      continue;
    }

    weightedIncomeSum += sample.householdIncome * sample.householdCount;
    householdCountSum += sample.householdCount;
  }

  if (householdCountSum <= 0) {
    return null;
  }

  return weightedIncomeSum / householdCountSum;
}

export function buildConstituencyHouseholdIncomeProfile(
  householdIncomeValue: number,
): ConstituencyHouseholdIncomeProfile {
  return {
    householdIncomeValue: Math.round(householdIncomeValue),
    householdIncomeLabel: HOUSEHOLD_INCOME_LABEL,
    householdIncomeMeasure: HOUSEHOLD_INCOME_MEASURE,
    householdIncomePeriod: HOUSEHOLD_INCOME_PERIOD,
    householdIncomeSource: HOUSEHOLD_INCOME_SOURCE,
    householdIncomeCurrency: HOUSEHOLD_INCOME_CURRENCY,
    aggregationMethod: HOUSEHOLD_INCOME_AGGREGATION_METHOD,
  };
}
