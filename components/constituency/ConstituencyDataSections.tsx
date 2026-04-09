import type {
  ConstituencyBreakdownStat,
  ConstituencyProfileRecord,
} from "@/lib/data/models";
import { summarizeElectionTiming } from "@/lib/data/elections";
import { Panel } from "@/components/ui/panel";

type ConstituencyDataSectionsProps = {
  profile: ConstituencyProfileRecord | null;
};

function formatNumber(value: number | null, digits = 0): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value: number | null, digits = 1): string | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-GB", {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(parsed);
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-text-secondary)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-1 border-b border-dashed border-[color:var(--color-border)] py-3 last:border-b-0 last:pb-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
      <dt className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-secondary)]">
        {label}
      </dt>
      <dd className="text-sm font-medium leading-6 text-[color:var(--color-text)]">{value}</dd>
    </div>
  );
}

function BreakdownList({
  title,
  items,
}: {
  title: string;
  items: ConstituencyBreakdownStat[] | null;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => {
          const percentValue =
            item.unit === "percent" ? Math.max(0, Math.min(item.value, 100)) : null;

          return (
            <li key={item.label}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[color:var(--color-text-secondary)]">{item.label}</span>
                <span className="font-medium text-[color:var(--color-text)]">
                  {item.unit === "percent"
                    ? `${formatNumber(item.value, 1)}%`
                    : formatNumber(item.value) ?? item.value}
                </span>
              </div>
              {percentValue !== null ? (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--color-text)]"
                    style={{ width: `${percentValue}%` }}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ConstituencyDataSections({
  profile,
}: ConstituencyDataSectionsProps) {
  if (!profile) {
    return null;
  }

  const demographicsBlocks = [
    {
      title: "Ethnicity breakdown",
      items: profile.demographics?.ethnicityBreakdown ?? null,
    },
    {
      title: "Employment",
      items: profile.demographics?.employmentStats ?? null,
    },
  ].filter((block) => block.items && block.items.length > 0);

  return (
    <div className="space-y-6">
      {demographicsBlocks.length > 0 ? (
        <Panel className="p-5 sm:p-6">
          <SectionHeading
            eyebrow="Demographics"
            title="Demographic profile"
            description="Initial demographic slots are populated only when authoritative constituency-level data is available in the importer."
          />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {demographicsBlocks.map((block) => (
              <BreakdownList key={block.title} title={block.title} items={block.items} />
            ))}
          </div>
        </Panel>
      ) : null}

      {profile.election ? (
        <section className="border-t border-[color:var(--color-border)] pt-6 sm:pt-8">
          <SectionHeading title="Latest election result" description={profile.election.resultSummary} />

          <dl className="mt-5">
            <DetailRow label="Election" value={profile.election.electionLabel} />
            <DetailRow label="Type and date" value={summarizeElectionTiming(profile.election)} />
            {profile.election.winnerName ? (
              <DetailRow label="Winner" value={profile.election.winnerName} />
            ) : null}
            {profile.election.winnerParty ? (
              <DetailRow label="Winning party" value={profile.election.winnerParty} />
            ) : null}
            {profile.election.turnout !== null ? (
              <DetailRow
                label="Turnout"
                value={formatPercent(profile.election.turnout) ?? String(profile.election.turnout)}
              />
            ) : null}
            {profile.election.majority !== null ? (
              <DetailRow
                label="Majority"
                value={`${formatNumber(profile.election.majority) ?? profile.election.majority}${
                  profile.election.majorityPercent !== null
                    ? ` (${formatPercent(profile.election.majorityPercent)})`
                    : ""
                }`}
              />
            ) : null}
            {profile.election.pollingDate ? (
              <DetailRow
                label="Polling date"
                value={formatDate(profile.election.pollingDate) ?? profile.election.pollingDate}
              />
            ) : null}
          </dl>

          {profile.election.electionType === "by_election" && profile.previousGeneralElection ? (
            <div className="mt-5 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-4">
              <p className="text-sm font-medium">Latest result is a by-election</p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                The previous general election for this seat was {profile.previousGeneralElection.electionLabel}
                {profile.previousGeneralElection.pollingDate
                  ? ` on ${formatDate(profile.previousGeneralElection.pollingDate)}`
                  : ""}.
              </p>
            </div>
          ) : null}

          {profile.election.voteResults.length > 0 ? (
            <div className="mt-6 overflow-hidden">
              <table className="w-full table-fixed border-separate border-spacing-0 text-[0.78rem] sm:min-w-full sm:table-auto sm:text-sm">
                <caption className="sr-only">Latest election vote results</caption>
                <colgroup>
                  <col className="w-[34%] sm:w-auto" />
                  <col className="w-[30%] sm:w-auto" />
                  <col className="w-[20%] sm:w-auto" />
                  <col className="w-[16%] sm:w-auto" />
                </colgroup>
                <thead>
                  <tr className="text-left text-[0.64rem] uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)] sm:text-[0.72rem] sm:tracking-[0.14em]">
                    <th scope="col" className="border-b border-[color:var(--color-border)] pb-2 pr-2 sm:pb-3 sm:pr-4">
                      Party
                    </th>
                    <th scope="col" className="border-b border-[color:var(--color-border)] pb-2 pr-2 sm:pb-3 sm:pr-4">
                      Candidate
                    </th>
                    <th scope="col" className="border-b border-[color:var(--color-border)] pb-2 pr-2 text-right sm:pb-3 sm:pr-4">
                      Votes
                    </th>
                    <th scope="col" className="border-b border-[color:var(--color-border)] pb-2 text-right sm:pb-3">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profile.election.voteResults.map((result) => (
                    <tr
                      key={`${result.party}-${result.candidate ?? "unknown"}`}
                      className={result.isWinner ? "bg-[var(--color-surface-muted)]" : undefined}
                    >
                      <td className="border-b border-dashed border-[color:var(--color-border)] py-2 pr-2 align-top font-medium leading-4 [overflow-wrap:anywhere] sm:py-3 sm:pr-4 sm:leading-5">
                        {result.party}
                      </td>
                      <td className="border-b border-dashed border-[color:var(--color-border)] py-2 pr-2 align-top leading-4 text-[color:var(--color-text-secondary)] [overflow-wrap:anywhere] sm:py-3 sm:pr-4 sm:leading-6">
                        {result.candidate ?? "Unavailable"}
                      </td>
                      <td className="border-b border-dashed border-[color:var(--color-border)] py-2 pr-2 text-right align-top font-medium leading-4 tabular-nums sm:py-3 sm:pr-4 sm:leading-5">
                        {formatNumber(result.votes) ?? result.votes}
                      </td>
                      <td className="border-b border-dashed border-[color:var(--color-border)] py-2 text-right align-top font-medium leading-4 tabular-nums sm:py-3 sm:leading-5">
                        {formatPercent(result.voteShare) ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <Panel className="p-5 sm:p-6">
        <SectionHeading
          eyebrow="Data Sources"
          title="Source coverage"
          description="This constituency profile is generated from public datasets and can be refreshed through the existing data pipeline."
        />
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <ul className="space-y-2 text-sm leading-6 text-[color:var(--color-text)]">
              {profile.metadata.sourceNames.map((sourceName) => (
                <li key={sourceName} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-text-secondary)]"
                  />
                  <span>{sourceName}</span>
                </li>
              ))}
            </ul>
            {profile.metadata.notes.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm font-medium">Coverage notes</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
                  {profile.metadata.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <dl>
            {profile.metadata.sourceUpdatedAt ? (
              <DetailRow
                label="Source refreshed"
                value={formatDate(profile.metadata.sourceUpdatedAt) ?? profile.metadata.sourceUpdatedAt}
              />
            ) : null}
            <DetailRow
              label="Imported"
              value={formatDate(profile.metadata.importedAt) ?? profile.metadata.importedAt}
            />
            <DetailRow
              label="Completeness"
              value={
                formatPercent(profile.metadata.completenessScore, 0) ??
                String(profile.metadata.completenessScore)
              }
            />
          </dl>
        </div>
      </Panel>
    </div>
  );
}
