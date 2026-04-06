"use client";

import { useMemo, useState } from "react";
import { ConstituencyMap } from "@/components/map/ConstituencyMap";
import { MapSidePanel } from "@/components/map/MapSidePanel";
import { PartyPalette } from "@/components/ui/party-palette";
import { Panel } from "@/components/ui/panel";
import { getPartyLegendItems } from "@/lib/map/getPartyLegendItems";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

export function ConstituencyExplorer({
  features,
}: {
  features: JoinedConstituencyMapFeature[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedFeature = useMemo(
    () => features.find((feature) => feature.id === selectedId) ?? null,
    [features, selectedId],
  );
  const legendItems = useMemo(() => getPartyLegendItems(features), [features]);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_340px]">
      <div className="space-y-6">
        <Panel className="overflow-hidden md:min-h-[760px]">
          <ConstituencyMap
            features={features}
            selectedId={selectedId}
            highlightedIds={selectedFeature ? [selectedFeature.id] : []}
            onSelect={setSelectedId}
          />
        </Panel>
      </div>

      <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
        {selectedFeature ? <MapSidePanel feature={selectedFeature} /> : null}

        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
            Party palette
          </p>
          <div className="mt-4">
            <PartyPalette items={legendItems} />
          </div>
        </Panel>
      </div>
    </section>
  );
}
