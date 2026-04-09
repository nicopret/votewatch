export function getMpImage(memberId: number): string {
  return `https://members-api.parliament.uk/api/Members/${memberId}/Portrait?cropType=ThreeFour`;
}

export function parseParliamentMemberId(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/(\d+)$/);

  if (!match) {
    return null;
  }

  const memberId = Number.parseInt(match[1], 10);

  return Number.isInteger(memberId) && memberId > 0 ? memberId : null;
}
