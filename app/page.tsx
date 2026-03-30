import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { SampleConstituencyMap } from "@/components/map/sample-constituency-map";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { getConstituencyCollection, getConstituencyMap } from "@/lib/data/site-data";
import { designTokens } from "@/lib/design-tokens";
import { partyLabels } from "@/lib/party-labels";

const tabs = [
  "Constituencies",
  "Local Authorities",
  "Upcoming & Recent",
  "Current Polling",
];

export default function HomePage() {
  const constituencies = getConstituencyCollection();
  const map = getConstituencyMap();
  const lead = constituencies.items[0];

  return (
    <PageShell wide>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,238,232,0.92))] p-8 shadow-[var(--shadow-panel)]">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--color-text-secondary)]">
              Phase 0 foundation
            </p>
            <h1
              className="mt-3 max-w-3xl font-semibold tracking-tight"
              style={{ fontSize: designTokens.typography.h1 }}
            >
              VoteWatch
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--color-text-secondary)]">
              VoteWatch is being set up as a map-first UK political transparency
              platform, with generated JSON data feeding a fast public site and room
              for richer election, authority, and representative views in the next phase.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {tabs.map((tab, index) => (
                <span
                  key={tab}
                  className="rounded-full border px-4 py-2 text-sm font-medium"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor:
                      index === 0 ? "var(--color-text-primary)" : "var(--color-surface)",
                    color:
                      index === 0 ? "var(--color-surface)" : "var(--color-text-secondary)",
                  }}
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <Panel className="min-h-[560px] overflow-hidden">
            <div className="p-5 pb-0">
              <SectionHeading
                eyebrow="Map view"
                title="Constituency overview shell"
                description="The homepage already loads mock generated JSON and mock map geometry, giving Phase 1 a clean insertion point for real spatial data and interactions."
                action={
                  <Link
                    href={`/constituencies/${lead.slug}`}
                    className="rounded-full border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2 text-sm font-medium"
                  >
                    View sample profile
                  </Link>
                }
              />
            </div>
            <div className="mt-5">
              <SampleConstituencyMap
                map={map}
                constituencies={constituencies.items}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
              Context panel
            </p>
            <h2 className="mt-3 text-xl font-semibold">Future detail sidebar</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
              This panel is reserved for contextual election summaries, MP data,
              authority breakdowns, and explanatory annotations tied to the selected map
              region.
            </p>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-dashed border-[color:var(--color-border)] pb-3">
                <dt className="text-[color:var(--color-text-secondary)]">Sample region</dt>
                <dd className="font-medium">{lead.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-dashed border-[color:var(--color-border)] pb-3">
                <dt className="text-[color:var(--color-text-secondary)]">Incumbent</dt>
                <dd className="font-medium">{partyLabels[lead.incumbentParty]}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--color-text-secondary)]">Data source</dt>
                <dd className="font-medium">Generated JSON</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
              Data loading
            </p>
            <h2 className="mt-3 text-xl font-semibold">Phase 0 sample dataset</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
              {constituencies.items.length} mock constituencies are loaded from
              `data/generated/constituencies.json`, demonstrating the JSON-first runtime
              shape without any database dependency.
            </p>
          </Panel>
        </div>
      </section>
    </PageShell>
  );
}
