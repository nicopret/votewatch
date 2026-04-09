import type { ConstituencyBreakdownStat } from "@/lib/data/models";
import {
  getPopulationAgeBarMetrics,
  getPopulationAgeBarWidthPercent,
} from "@/lib/charts/population-age-bars";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
}

export function PopulationAgeChart({
  items,
  constituencyName,
}: {
  items: ConstituencyBreakdownStat[] | null;
  constituencyName: string;
}) {
  const validItems = items?.filter((item) => item.unit === "count") ?? [];
  const { maxValue, total } = getPopulationAgeBarMetrics(validItems);

  return (
    <section
      aria-labelledby="population-by-age-title"
      className="mt-6 border-t border-[color:var(--color-border)] pt-5"
    >
      <div>
        <h3 id="population-by-age-title" className="text-base font-semibold tracking-tight">
          Population by age
        </h3>
        <p className="mt-1 text-[0.8125rem] leading-5 text-[color:var(--color-text-secondary)]">
          Census 2021, 10-year age bands
        </p>
      </div>

      {validItems.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-[color:var(--color-text-secondary)]">
          Age breakdown unavailable.
        </p>
      ) : (
        (() => {
          return (
            <div className="mt-4">
              <p className="sr-only">
                Horizontal bar chart showing the age distribution for {constituencyName}. The
                longest bar marks the largest age group.
              </p>
              <ul className="space-y-3" role="list" aria-label={`Population by age for ${constituencyName}`}>
                {validItems.map((item) => {
                  const share = total > 0 ? item.value / total : 0;
                  const isLargest = item.value === maxValue && item.value > 0;
                  const widthPercent = getPopulationAgeBarWidthPercent(item.value, maxValue);

                  return (
                    <li key={item.label} className="grid grid-cols-[54px_minmax(0,1fr)] gap-3">
                      <span className="pt-1 text-[0.78rem] font-medium text-[color:var(--color-text-secondary)]">
                        {item.label}
                      </span>
                      <div className="min-w-0" aria-label={`${item.label}: ${formatNumber(item.value)} residents, ${formatPercent(share)}`}>
                        <div className="relative isolate h-6 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                          <div
                            className={
                              isLargest
                                ? "absolute inset-y-0 left-0 z-10 rounded-full bg-[color:var(--color-text)]"
                                : "absolute inset-y-0 left-0 z-10 rounded-full bg-[color:var(--color-text-secondary)] opacity-50"
                            }
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-3 text-[0.78rem] leading-5">
                          <span className="font-medium text-[color:var(--color-text)]">
                            {formatNumber(item.value)}
                          </span>
                          <span className="text-[color:var(--color-text-secondary)]">
                            {formatPercent(share)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()
      )}
    </section>
  );
}
