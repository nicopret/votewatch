import type { PartyLegendItem } from "@/lib/map/getPartyLegendItems";

export function PartyPalette({ items }: { items: PartyLegendItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.party} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span
              className="h-3.5 w-3.5 rounded-full border border-[color:var(--color-border)]"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
          <span className="min-w-8 text-right font-medium text-[color:var(--color-text-secondary)]">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
