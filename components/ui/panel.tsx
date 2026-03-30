import type { ReactNode } from "react";
import { cn } from "@/lib/utils/classnames";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
