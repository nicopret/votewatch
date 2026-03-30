import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { getConstituencyCollection } from "@/lib/data/site-data";
import { partyLabels } from "@/lib/party-labels";

export default async function ConstituencyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const constituency = getConstituencyCollection().items.find((item) => item.slug === slug);

  if (!constituency) {
    notFound();
  }

  return (
    <PageShell>
      <Panel className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
          Constituency placeholder
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{constituency.name}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
          This route scaffolds the future constituency detail page. Phase 1 can expand
          it with results, boundaries, polling context, and representative data.
        </p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-4">
            <dt className="text-sm text-[color:var(--color-text-secondary)]">Region</dt>
            <dd className="mt-2 text-lg font-semibold">{constituency.region}</dd>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-4">
            <dt className="text-sm text-[color:var(--color-text-secondary)]">Incumbent party</dt>
            <dd className="mt-2 text-lg font-semibold">
              {partyLabels[constituency.incumbentParty]}
            </dd>
          </div>
        </dl>
      </Panel>
    </PageShell>
  );
}
