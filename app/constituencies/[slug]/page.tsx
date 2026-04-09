import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConstituencyDataSections } from "@/components/constituency/ConstituencyDataSections";
import { ConstituencyMapSection } from "@/components/constituency/ConstituencyMapSection";
import { MpProfileCard } from "@/components/constituency/MpProfileCard";
import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { getAllConstituencySlugs, getConstituencyPageData } from "@/lib/data/constituencies";
import { getPartyLogo } from "@/lib/partyLogos";

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

export default async function ConstituencyPage({ params }: ConstituencyPageProps) {
  const { slug } = await params;
  const data = getConstituencyPageData(slug);

  if (!data) {
    notFound();
  }

  const { boundaryMap, constituency, profile, mp } = data;
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
            <div className="flex items-start justify-between gap-4 sm:gap-5">
              <div className="min-w-0">
                <h1 className="text-[1.625rem] font-semibold tracking-tight sm:text-4xl">
                  {constituency.name}
                </h1>
                <p className="mt-2 max-w-3xl text-[0.8125rem] leading-5 text-[color:var(--color-text-secondary)] sm:mt-3 sm:text-sm sm:leading-6">
                  {constituency.region}, {constituency.nation}
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

          <div className="space-y-6 px-6 py-6 sm:px-8">
            <MpProfileCard mp={mp} fallbackName={constituency.mpName} />

            <ConstituencyMapSection
              boundaryMap={boundaryMap}
              profile={profile}
              region={constituency.region}
            />

            <ConstituencyDataSections profile={profile} />
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
