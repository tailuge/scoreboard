export function countryCodeToFlagEmoji(countryCode?: string | null): string {
  if (!countryCode || countryCode?.length !== 2) return ""

  return countryCode
    .toUpperCase()
    .replaceAll(/./g, (char) =>
      String.fromCodePoint(0x1f1e6 + (char.codePointAt(0) || 0) - 65)
    )
}
