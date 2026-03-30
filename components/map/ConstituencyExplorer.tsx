"use client";

import { ConstituencyMap } from "@/components/map/ConstituencyMap";
import { MapSidePanel } from "@/components/map/MapSidePanel";
import { PartyPalette } from "@/components/ui/party-palette";
import { Panel } from "@/components/ui/panel";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";
import { useMemo, useState } from "react";
import type { PartyKey } from "@/lib/types";

export function ConstituencyExplorer({
  features,
}: {
  features: JoinedConstituencyMapFeature[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(features[0]?.id ?? null);
  const selectedFeature = useMemo(
    () => features.find((feature) => feature.id === selectedId) ?? null,
    [features, selectedId],
  );
  const activeParties = useMemo(
    () =>
      Array.from(
        new Set(
          features
            .map((feature) => feature.party)
            .filter((party): party is PartyKey => party !== "unknown"),
        ),
      ),
    [features],
  );

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_340px]">
      <div className="space-y-6">
        <Panel className="min-h-[760px] overflow-hidden">
          <ConstituencyMap
            features={features}
            selectedId={selectedId}
            highlightedIds={selectedFeature ? [selectedFeature.id] : []}
            onSelect={setSelectedId}
          />
        </Panel>
      </div>

      <div className="space-y-6">
        <MapSidePanel feature={selectedFeature} />

        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
            Party palette
          </p>
          <div className="mt-4">
            <PartyPalette parties={activeParties} />
          </div>
        </Panel>
      </div>
    </section>
  );
}
