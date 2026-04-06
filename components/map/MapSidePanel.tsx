"use client";

import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { partyColors } from "@/lib/party-colors";
import { designTokens } from "@/lib/design-tokens";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

export function MapSidePanel({
  feature,
}: {
  feature: JoinedConstituencyMapFeature | null;
}) {
  if (!feature) {
    return null;
  }

  return (
    <Panel className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
        Constituency detail
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 rounded-full border border-[color:var(--color-border)]"
          style={{
            backgroundColor:
              feature.party === "unknown"
                ? designTokens.colors.surfaceMuted
                : partyColors[feature.party],
          }}
        />
        <h2 className="text-xl font-semibold">{feature.name}</h2>
      </div>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        {feature.region}, {feature.nation}
      </p>

      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex items-center justify-between gap-4 border-b border-dashed border-[color:var(--color-border)] pb-3">
          <dt className="text-[color:var(--color-text-secondary)]">MP</dt>
          <dd className="font-medium">{feature.mpName}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[color:var(--color-text-secondary)]">Party</dt>
          <dd className="font-medium">{feature.partyLabel}</dd>
        </div>
      </dl>

      <Link
        href={feature.detailHref}
        className="mt-6 inline-flex rounded-full border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-medium"
      >
        View constituency page
      </Link>
    </Panel>
  );
}
