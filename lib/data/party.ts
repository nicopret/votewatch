export const PARTY_VALUES = [
  "conservative",
  "labour",
  "libdem",
  "snp",
  "green",
  "reform",
  "plaidcymru",
  "dup",
  "sinnfein",
  "alliance",
  "other",
  "independent",
  "noc",
] as const;

export type PartyValue = (typeof PARTY_VALUES)[number];

export const PARTY_LABELS: Record<PartyValue, string> = {
  conservative: "Conservative",
  labour: "Labour",
  libdem: "Liberal Democrat",
  snp: "SNP",
  green: "Green",
  reform: "Reform",
  plaidcymru: "Plaid Cymru",
  dup: "DUP",
  sinnfein: "Sinn Féin",
  alliance: "Alliance",
  other: "Other",
  independent: "Independent",
  noc: "No Overall Control",
};
