import test from "node:test";
import assert from "node:assert/strict";
import type { ConstituencyElectionEvent } from "../../lib/data/models.ts";
import {
  resolveConstituencyMatch,
  selectLatestElectionEvent,
  selectPreviousGeneralElectionEvent,
} from "../../lib/data/elections.ts";

function makeEvent(overrides: Partial<ConstituencyElectionEvent>): ConstituencyElectionEvent {
  return {
    electionId: overrides.electionId ?? "event-1",
    electionType: overrides.electionType ?? "general_election",
    electionLabel: overrides.electionLabel ?? "2024 General Election",
    electionYear: overrides.electionYear ?? 2024,
    pollingDate: overrides.pollingDate ?? "2024-07-04T00:00:00.000Z",
    turnout: overrides.turnout ?? 0.6,
    electorate: overrides.electorate ?? 70000,
    validVotes: overrides.validVotes ?? 40000,
    invalidVotes: overrides.invalidVotes ?? 100,
    winnerName: overrides.winnerName ?? "Jane Example",
    winnerParty: overrides.winnerParty ?? "Labour",
    winnerPartySlug: overrides.winnerPartySlug ?? "labour",
    majority: overrides.majority ?? 2000,
    majorityPercent: overrides.majorityPercent ?? 0.05,
    resultSummary: overrides.resultSummary ?? "Lab hold",
    voteResults: overrides.voteResults ?? [
      {
        party: "Labour",
        partySlug: "labour",
        candidate: "Jane Example",
        votes: 21000,
        voteShare: 0.525,
        resultPosition: 1,
        isWinner: true,
      },
      {
        party: "Conservative",
        partySlug: "conservative",
        candidate: "John Example",
        votes: 19000,
        voteShare: 0.475,
        resultPosition: 2,
        isWinner: false,
      },
    ],
  };
}

test("selectLatestElectionEvent returns the only general election when no by-election exists", () => {
  const generalElection = makeEvent({});
  assert.equal(selectLatestElectionEvent([generalElection])?.electionId, generalElection.electionId);
});

test("selectLatestElectionEvent prefers a later by-election over an older general election", () => {
  const generalElection = makeEvent({
    electionId: "general-2024",
    pollingDate: "2024-07-04T00:00:00.000Z",
    electionType: "general_election",
  });
  const byElection = makeEvent({
    electionId: "by-2025",
    pollingDate: "2025-05-01T00:00:00.000Z",
    electionType: "by_election",
    electionLabel: "2025 By-election",
  });

  assert.equal(selectLatestElectionEvent([generalElection, byElection])?.electionId, "by-2025");
});

test("selectLatestElectionEvent prefers the latest by-election when multiple by-elections exist", () => {
  const byElectionOne = makeEvent({
    electionId: "by-2025",
    pollingDate: "2025-05-01T00:00:00.000Z",
    electionType: "by_election",
  });
  const byElectionTwo = makeEvent({
    electionId: "by-2026",
    pollingDate: "2026-02-26T00:00:00.000Z",
    electionType: "by_election",
  });

  assert.equal(selectLatestElectionEvent([byElectionOne, byElectionTwo])?.electionId, "by-2026");
});

test("selectPreviousGeneralElectionEvent returns the latest general election even when a newer by-election exists", () => {
  const generalElection = makeEvent({
    electionId: "general-2024",
    pollingDate: "2024-07-04T00:00:00.000Z",
    electionType: "general_election",
  });
  const byElection = makeEvent({
    electionId: "by-2025",
    pollingDate: "2025-05-01T00:00:00.000Z",
    electionType: "by_election",
  });

  assert.equal(
    selectPreviousGeneralElectionEvent([generalElection, byElection])?.electionId,
    "general-2024",
  );
});

test("resolveConstituencyMatch prefers official constituency code over name differences", () => {
  const match = resolveConstituencyMatch({
    code: "E14001455",
    name: "Runcorn & Helsby",
    targets: [{ id: "E14001455", name: "Runcorn and Helsby" }],
  });

  assert.equal(match.strategy, "code");
  assert.equal(match.matched?.id, "E14001455");
});

test("resolveConstituencyMatch fails safely on ambiguous normalized names", () => {
  const match = resolveConstituencyMatch({
    code: null,
    name: "St. Ives",
    targets: [
      { id: "1", name: "St Ives" },
      { id: "2", name: "St-Ives" },
    ],
  });

  assert.equal(match.strategy, "ambiguous_normalized_name");
  assert.equal(match.matched, null);
});
