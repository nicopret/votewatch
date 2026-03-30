import { partyColors } from "@/lib/party-colors";
import { partyLabels } from "@/lib/party-labels";
import type { PartyKey } from "@/lib/types";

export function PartyPalette({ parties }: { parties: PartyKey[] }) {
  return (
    <div className="space-y-3">
      {parties.map((party) => (
        <div key={party} className="flex items-center gap-3 text-sm">
          <span
            className="h-3.5 w-3.5 rounded-full border border-[color:var(--color-border)]"
            style={{ backgroundColor: partyColors[party] }}
          />
          <span>{partyLabels[party]}</span>
        </div>
      ))}
    </div>
  );
}
