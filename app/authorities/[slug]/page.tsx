import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";

export default async function AuthorityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PageShell>
      <Panel className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
          Local authority placeholder
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{slug}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
          Authority profiles will live here once local election datasets, leadership
          control, and ward-level context are introduced in Phase 1.
        </p>
      </Panel>
    </PageShell>
  );
}
