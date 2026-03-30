import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-secondary)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
