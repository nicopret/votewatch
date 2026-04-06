"use client";

import { partyColors } from "@/lib/party-colors";
import { designTokens } from "@/lib/design-tokens";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

export function MapTooltip({
  feature,
  x,
  y,
}: {
  feature: JoinedConstituencyMapFeature;
  x: number;
  y: number;
}) {
  return (
    <div
      className="pointer-events-none absolute z-20 min-w-[200px] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm shadow-[var(--shadow-panel)]"
      style={{
        left: x,
        top: y,
        transform: "translate(14px, 14px)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full border border-[color:var(--color-border)]"
          style={{
            backgroundColor:
              feature.party === "unknown"
                ? designTokens.colors.surfaceMuted
                : partyColors[feature.party],
          }}
        />
        <p className="font-semibold">{feature.name}</p>
      </div>
      <p className="mt-2 text-[color:var(--color-text-secondary)]">{feature.mpName}</p>
      <p className="text-[color:var(--color-text-secondary)]">{feature.partyLabel}</p>
    </div>
  );
}
