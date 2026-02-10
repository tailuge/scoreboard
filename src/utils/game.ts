export function getGameIcon(ruleType: string): string {
  if (!ruleType) return "/assets/eightball.png"
  switch (ruleType.toLowerCase()) {
    case "eightball":
      return "/assets/eightball.png"
    case "nineball":
      return "/assets/nineball.png"
    case "snooker":
      return "/assets/snooker.png"
    case "threecushion":
      return "/assets/threecushion.png"
    default:
      return "/assets/eightball.png"
  }
}

export function countryCodeToFlagEmoji(countryCode?: string | null): string {
  if (!countryCode || countryCode?.length !== 2) return ""

  return countryCode
    .toUpperCase()
    .replaceAll(/./g, (char) =>
      String.fromCodePoint(0x1f1e6 + (char.codePointAt(0) || 0) - 65)
    )
}
