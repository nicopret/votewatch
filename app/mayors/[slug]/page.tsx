import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";

export default async function MayorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PageShell>
      <Panel className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
          Mayor placeholder
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{slug}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
          Regional and local mayoral detail views will be added here once the broader
          election and officeholder model is in place.
        </p>
      </Panel>
    </PageShell>
  );
}
