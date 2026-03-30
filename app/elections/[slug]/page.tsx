import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PageShell>
      <Panel className="p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
          Election placeholder
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{slug}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
          Election event pages are scaffolded to support future result timelines,
          candidate listings, and authority or constituency rollups.
        </p>
      </Panel>
    </PageShell>
  );
}
