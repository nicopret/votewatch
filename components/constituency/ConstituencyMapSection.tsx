import type {
  ConstituencyBoundaryMapRecord,
  ConstituencyProfileRecord,
} from "@/lib/data/models";
import { HOUSEHOLD_INCOME_PERIOD_SHORT } from "@/lib/data/household-income";
import { formatUnemploymentValue, UNEMPLOYMENT_LABEL } from "@/lib/data/unemployment";
import { ConstituencyBoundaryMap } from "@/components/constituency/ConstituencyBoundaryMap";
import { PopulationAgeChart } from "@/components/constituency/PopulationAgeChart";
import { InfoRow } from "@/components/ui/info-row";

function formatNumber(value: number | null, digits = 0): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatCurrency(value: number | null): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ConstituencyMapSection({
  boundaryMap,
  profile,
  region,
}: {
  boundaryMap: ConstituencyBoundaryMapRecord | null;
  profile: ConstituencyProfileRecord | null;
  region: string;
}) {
  const constituencyName = profile?.name ?? boundaryMap?.name ?? "Constituency";
  const constituencyCode = profile?.geography?.boundaryCode ?? boundaryMap?.boundaryCode ?? "Unavailable";
  const householdIncome = profile?.income ?? null;
  const unemployment = profile?.unemployment ?? null;
  const stats = [
    { label: "Region", value: profile?.region ?? region },
    {
      label: "Population",
      value:
        profile?.population !== null && profile?.population !== undefined
          ? formatNumber(profile.population) ?? String(profile.population)
          : "Unavailable",
    },
    {
      label: "Electorate",
      value:
        profile?.electorate !== null && profile?.electorate !== undefined
          ? formatNumber(profile.electorate) ?? String(profile.electorate)
          : "Unavailable",
    },
    {
      label: "Area",
      value:
        profile?.areaKm2 !== null && profile?.areaKm2 !== undefined
          ? `${formatNumber(profile.areaKm2, 1)} sq km`
          : "Unavailable",
    },
    {
      label: "Population density",
      value:
        profile?.populationDensity !== null && profile?.populationDensity !== undefined
          ? `${formatNumber(profile.populationDensity, 0)} / sq km`
          : "Unavailable",
    },
    {
      label: "Household income",
      value:
        householdIncome?.householdIncomeValue !== null &&
        householdIncome?.householdIncomeValue !== undefined
          ? formatCurrency(householdIncome.householdIncomeValue) ?? "Unavailable"
          : "Unavailable",
    },
    {
      label: UNEMPLOYMENT_LABEL,
      value: formatUnemploymentValue({
        rate: unemployment?.unemploymentRate ?? null,
        count: unemployment?.unemploymentCount ?? null,
      }),
    },
  ];
  const incomeNote = householdIncome
    ? `${householdIncome.householdIncomeMeasure}, ${HOUSEHOLD_INCOME_PERIOD_SHORT}.`
    : constituencyCode.startsWith("S") || constituencyCode.startsWith("N")
      ? "Household income is currently unavailable here because the integrated official source covers England and Wales only."
      : null;
  const unemploymentNote =
    !unemployment && constituencyCode.startsWith("N")
      ? "Claimant-count unemployment data is currently unavailable here because the integrated ONS constituency workbook does not cover Northern Ireland."
      : unemployment
        ? `${unemployment.unemploymentLabel}, ${unemployment.unemploymentPeriod}.`
        : null;
  const supportingNotes = [incomeNote, unemploymentNote].filter(
    (note): note is string => Boolean(note),
  );

  return (
    <section className="border-t border-[color:var(--color-border)] pt-6 sm:pt-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Constituency map</h2>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] lg:items-start">
        <ConstituencyBoundaryMap
          boundaryMap={boundaryMap}
          constituencyName={constituencyName}
          constituencyCode={constituencyCode}
        />

        <div className="min-w-0 lg:pt-1">
          <dl>
            {stats.map((stat) => (
              <InfoRow key={stat.label} {...stat} />
            ))}
          </dl>
          {supportingNotes.map((note, index) => (
            <p
              key={note}
              className={`${index === 0 ? "mt-4" : "mt-2"} text-xs leading-5 text-[color:var(--color-text-secondary)]`}
            >
              {note}
            </p>
          ))}
          <PopulationAgeChart
            items={profile?.demographics?.ageBreakdown ?? null}
            constituencyName={constituencyName}
          />
        </div>
      </div>
    </section>
  );
}
