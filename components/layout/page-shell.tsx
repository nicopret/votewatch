import type { ReactNode } from "react";

export function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main
      className={wide ? "mx-auto max-w-7xl px-6 py-8" : "mx-auto max-w-5xl px-6 py-8"}
    >
      {children}
    </main>
  );
}
