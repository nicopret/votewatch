"use client";

import { useMemo, useState } from "react";
import { MapSvg } from "@/components/map/MapSvg";
import { MapTooltip } from "@/components/map/MapTooltip";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

export function ConstituencyMap({
  features,
  selectedId,
  highlightedIds,
  onSelect,
}: {
  features: JoinedConstituencyMapFeature[];
  selectedId: string | null;
  highlightedIds?: string[];
  onSelect: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const featureLookup = useMemo(
    () => new Map(features.map((feature) => [feature.id, feature])),
    [features],
  );

  const hoveredFeature = hoveredId ? featureLookup.get(hoveredId) ?? null : null;

  return (
    <div className="relative p-3">
      <div className="w-full overflow-hidden bg-white">
        <MapSvg
          features={features}
          hoveredId={hoveredId}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onHover={setHoveredId}
          onLeave={() => setHoveredId(null)}
          onSelect={onSelect}
          onPointerMove={setTooltipPosition}
        />
      </div>

      {hoveredFeature ? (
        <MapTooltip
          feature={hoveredFeature}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        />
      ) : null}
    </div>
  );
}
