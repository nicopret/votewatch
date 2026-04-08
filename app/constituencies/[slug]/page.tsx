import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { getAllConstituencySlugs, getConstituencyPageData } from "@/lib/data/constituencies";
import { partyColors } from "@/lib/party-colors";
import { getPartyLogo } from "@/lib/partyLogos";
import { designTokens } from "@/lib/design-tokens";

type ConstituencyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllConstituencySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ConstituencyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getConstituencyPageData(slug);

  if (!data) {
    return {
      title: "Constituency Not Found | VoteWatch",
    };
  }

  return {
    title: `${data.constituency.name} | VoteWatch`,
    description: `Current constituency profile for ${data.constituency.name}.`,
  };
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-[color:var(--color-border)] py-3 last:border-b-0 last:pb-0">
      <dt className="text-sm text-[color:var(--color-text-secondary)]">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

export default async function ConstituencyPage({ params }: ConstituencyPageProps) {
  const { slug } = await params;
  const data = getConstituencyPageData(slug);

  if (!data) {
    notFound();
  }

  const { constituency, mp } = data;
  const partyColor =
    constituency.party in partyColors
      ? partyColors[constituency.party]
      : designTokens.colors.surfaceMuted;
  const partyLogo = getPartyLogo(constituency.party);

  return (
    <PageShell>
      <div className="space-y-6">
        <Link
          href="/"
          className="inline-flex rounded-full border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium"
        >
          Back to map
        </Link>

        <Panel className="overflow-hidden">
          <div className="border-b border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-[1.625rem] font-semibold tracking-tight sm:text-4xl">
                  {constituency.name}
                </h1>
                <p className="mt-2 max-w-3xl text-[0.8125rem] leading-5 text-[color:var(--color-text-secondary)] sm:mt-3 sm:text-sm sm:leading-6">
                  {constituency.region}, {constituency.nation}
                </p>
                <p className="mt-3 text-[0.875rem] font-medium sm:mt-4 sm:text-base">
                  Current MP: {mp?.name ?? constituency.mpName}
                </p>
              </div>

              {partyLogo ? (
                <div className="w-full max-w-[32%] shrink-0 self-start sm:w-auto sm:max-w-none">
                  <Image
                    src={partyLogo}
                    alt={`${constituency.partyLabel} logo`}
                    width={96}
                    height={56}
                    className="h-7 w-full object-contain object-right sm:h-12 sm:w-auto"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
            <div>
              <h2 className="text-lg font-semibold">Overview</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-text-secondary)]">
                VoteWatch is currently using generated public data for each constituency.
                This page shows the current representative and party control using the
                same JSON dataset that powers the homepage map.
              </p>

              <dl className="mt-6">
                <DetailRow label="Current MP" value={mp?.name ?? constituency.mpName} />
                <DetailRow label="Party" value={constituency.partyLabel} />
                <DetailRow label="Constituency ID" value={constituency.id} />
                <DetailRow label="Slug" value={constituency.slug} />
              </dl>
            </div>

            <Panel className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text-secondary)]">
                Current status
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-[color:var(--color-border)]"
                  style={{ backgroundColor: partyColor }}
                />
                <span className="text-sm font-medium">{constituency.partyLabel}</span>
              </div>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-[color:var(--color-text-secondary)]">Nation</p>
                  <p className="mt-1 font-medium">{constituency.nation}</p>
                </div>
                <div>
                  <p className="text-[color:var(--color-text-secondary)]">Region</p>
                  <p className="mt-1 font-medium">{constituency.region}</p>
                </div>
                {mp ? (
                  <div>
                    <p className="text-[color:var(--color-text-secondary)]">MP slug</p>
                    <p className="mt-1 font-medium">{mp.slug}</p>
                  </div>
                ) : null}
              </div>
            </Panel>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
