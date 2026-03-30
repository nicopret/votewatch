import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  return (
    <PageShell>
      <Panel className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
          Not found
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-[color:var(--color-text-secondary)]">
          The requested route is not part of the current Phase 0 dataset.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full border border-[color:var(--color-border)] px-4 py-2 text-sm font-medium"
        >
          Return home
        </Link>
      </Panel>
    </PageShell>
  );
}
