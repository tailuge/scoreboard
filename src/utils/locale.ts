/**
 * Converts a BCP 47 locale string to a regional flag emoji.
 * Falls back to a globe emoji if no region is found.
 */
export function localeToFlag(locale?: string): string {
  if (!locale) return "🌐"
  const region = locale.split("-")[1]
  if (!region || region.length !== 2) return "🌐"
  return region
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}
