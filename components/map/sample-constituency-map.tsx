import { designTokens } from "@/lib/design-tokens";
import { partyColors } from "@/lib/party-colors";
import { partyLabels } from "@/lib/party-labels";
import type { ConstituencySummary, SimpleFeatureCollection } from "@/lib/types";

function toSvgPath(coordinates: number[][]): string {
  return coordinates
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ")
    .concat(" Z");
}

export function SampleConstituencyMap({
  map,
  constituencies,
}: {
  map: SimpleFeatureCollection;
  constituencies: ConstituencySummary[];
}) {
  const activeParties = Array.from(
    new Set(constituencies.map((item) => item.incumbentParty)),
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-border)] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
            Sample geography
          </p>
          <h3 className="mt-2 text-lg font-semibold">Static SVG map placeholder</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
            This is a lightweight stand-in for future real constituency geometry. It is
            wired to shared party tokens and mock generated data so the rendering path is
            already established.
          </p>
        </div>
        <div className="rounded-full border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[color:var(--color-text-secondary)]">
          {map.features.length} regions
        </div>
      </div>

      <div className="grid flex-1 gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-[calc(var(--radius-xl)-0.25rem)] border border-[color:var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f4f1e8_100%)] p-4">
          <svg viewBox="0 0 320 220" role="img" aria-label="Sample constituency map">
            <title>Sample constituency map</title>
            <rect
              x="0"
              y="0"
              width="320"
              height="220"
              rx="16"
              fill={designTokens.colors.background}
            />
            {map.features.map((feature) => {
              const path = toSvgPath(feature.geometry.coordinates[0]);
              const party = feature.properties.party;

              return (
                <g key={feature.properties.code}>
                  <path
                    d={path}
                    fill={partyColors[party]}
                    fillOpacity={party === "no-overall-control" ? 0.8 : 0.95}
                    stroke={designTokens.colors.border}
                    strokeWidth="2"
                  />
                  <text
                    x={feature.properties.labelX}
                    y={feature.properties.labelY}
                    textAnchor="middle"
                    className="fill-[var(--color-text-primary)] text-[10px] font-semibold"
                  >
                    {feature.properties.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="rounded-[calc(var(--radius-xl)-0.25rem)] border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
            Party palette
          </p>
          <div className="mt-4 space-y-3">
            {activeParties.map((party) => (
              <div key={party} className="flex items-center gap-3 text-sm">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-[color:var(--color-border)]"
                  style={{ backgroundColor: partyColors[party] }}
                />
                <span>{partyLabels[party]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
