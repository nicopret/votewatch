import type { PartyKey } from "@/lib/types";

export const PARTY_LOGOS: Partial<Record<PartyKey, string>> = {
  conservative: "/assets/parties/conservative.svg",
  labour: "/assets/parties/labour.svg",
  libdem: "/assets/parties/libdem.svg",
  snp: "/assets/parties/snp.svg",
  green: "/assets/parties/green.png",
  reform: "/assets/parties/reform.svg",
  plaidcymru: "/assets/parties/plaid-cymru.svg",
  dup: "/assets/parties/dup.svg",
  sinnfein: "/assets/parties/sinn-fein.svg",
  alliance: "/assets/parties/alliance.svg",
};

export function getPartyLogo(partyKey: PartyKey | null | undefined): string | null {
  if (!partyKey) {
    return null;
  }

  return PARTY_LOGOS[partyKey] ?? null;
}
