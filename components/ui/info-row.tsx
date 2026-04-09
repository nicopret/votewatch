import type { ReactNode } from "react";

export type InfoRowData = {
  label: string;
  value: ReactNode;
};

export function InfoRow({ label, value }: InfoRowData) {
  return (
    <div className="grid gap-1 border-b border-dashed border-[color:var(--color-border)] py-3 last:border-b-0 last:pb-0 sm:grid-cols-[128px_minmax(0,1fr)] sm:gap-5">
      <dt className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">
        {label}
      </dt>
      <dd className="min-w-0 text-sm font-medium leading-6 text-[color:var(--color-text)]">
        {value}
      </dd>
    </div>
  );
}
