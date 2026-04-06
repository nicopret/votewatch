"use client";

import dynamic from "next/dynamic";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";

const LeafletConstituencyMap = dynamic(
  () =>
    import("@/components/map/LeafletConstituencyMap").then(
      (module) => module.LeafletConstituencyMap,
    ),
  {
    ssr: false,
    loading: () => <div className="min-h-[820px] w-full rounded-[18px] bg-white" />,
  },
);

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
  return (
    <div className="p-3">
      <LeafletConstituencyMap
        features={features}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onSelect={onSelect}
        />
    </div>
  );
}
