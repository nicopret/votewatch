import { partyColors } from "@/lib/party-colors";
import { partyLabels } from "@/lib/party-labels";
import type { JoinedConstituencyMapFeature } from "@/lib/map/mapTypes";
import type { PartyKey } from "@/lib/types";

export interface PartyLegendItem {
  party: PartyKey;
  label: string;
  color: string;
  count: number;
}

export function getPartyLegendItems(
  features: JoinedConstituencyMapFeature[],
): PartyLegendItem[] {
  const counts = new Map<PartyKey, number>();

  for (const feature of features) {
    const party = feature.party === "unknown" ? "other" : feature.party;
    counts.set(party, (counts.get(party) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([party, count]) => ({
      party,
      label: partyLabels[party],
      color: partyColors[party],
      count,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label, "en-GB");
    });
}
