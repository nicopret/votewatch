import type {
  ConstituencyElectionEvent,
  ConstituencyElectionType,
} from "./models.ts";
import { toDataSlug } from "./slug.ts";

export function buildElectionLabel(
  electionType: ConstituencyElectionType,
  pollingDate: string | null,
): string {
  const year = pollingDate ? new Date(pollingDate).getUTCFullYear() : null;
  const prefix = year ? `${year}` : "Latest";
  return electionType === "by_election" ? `${prefix} By-election` : `${prefix} General Election`;
}

export function sortElectionEventsByDateDesc(
  events: ConstituencyElectionEvent[],
): ConstituencyElectionEvent[] {
  return [...events].sort((left, right) => {
    const leftTime = left.pollingDate ? new Date(left.pollingDate).getTime() : 0;
    const rightTime = right.pollingDate ? new Date(right.pollingDate).getTime() : 0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    if (left.electionType !== right.electionType) {
      return left.electionType === "by_election" ? -1 : 1;
    }

    return left.electionId.localeCompare(right.electionId, "en-GB");
  });
}

export function selectLatestElectionEvent(
  events: ConstituencyElectionEvent[],
): ConstituencyElectionEvent | null {
  return sortElectionEventsByDateDesc(events)[0] ?? null;
}

export function selectPreviousGeneralElectionEvent(
  events: ConstituencyElectionEvent[],
): ConstituencyElectionEvent | null {
  return sortElectionEventsByDateDesc(events).find(
    (event) => event.electionType === "general_election",
  ) ?? null;
}

export function summarizeElectionTiming(election: ConstituencyElectionEvent): string {
  const typeLabel = election.electionType === "by_election" ? "By-election" : "General election";
  if (!election.pollingDate) {
    return typeLabel;
  }

  const formattedDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
    new Date(election.pollingDate),
  );
  return `${typeLabel}, ${formattedDate}`;
}

export type ConstituencyMatchTarget = {
  id: string;
  name: string;
};

export type ConstituencyMatchResult =
  | {
      matched: ConstituencyMatchTarget;
      strategy: "code" | "exact_name" | "normalized_name";
    }
  | {
      matched: null;
      strategy: "none" | "ambiguous_normalized_name";
    };

export function resolveConstituencyMatch({
  code,
  name,
  targets,
}: {
  code: string | null;
  name: string | null;
  targets: ConstituencyMatchTarget[];
}): ConstituencyMatchResult {
  if (code) {
    const byCode = targets.find((target) => target.id === code);
    if (byCode) {
      return { matched: byCode, strategy: "code" };
    }
  }

  if (name) {
    const exact = targets.find((target) => target.name === name);
    if (exact) {
      return { matched: exact, strategy: "exact_name" };
    }

    const normalizedName = toDataSlug(name);
    const normalizedMatches = targets.filter((target) => toDataSlug(target.name) === normalizedName);

    if (normalizedMatches.length === 1) {
      return { matched: normalizedMatches[0], strategy: "normalized_name" };
    }

    if (normalizedMatches.length > 1) {
      return { matched: null, strategy: "ambiguous_normalized_name" };
    }
  }

  return { matched: null, strategy: "none" };
}
