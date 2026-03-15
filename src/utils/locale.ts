/**
 * Converts a BCP 47 locale string to a regional flag emoji.
 * Falls back to a globe emoji if no region is found.
 */
export const anonByLang: Record<string, string> = {
  // English
  en: "Anonymous",
  // Western Europe
  fr: "Anonyme",
  de: "Anonym",
  es: "Anónimo",
  it: "Anonimo",
  pt: "Anônimo",
  nl: "Anoniem",
  da: "Anonym",
  no: "Anonym",
  sv: "Anonym",
  fi: "Anonyymi",
  is: "Nafnlaus",
  // Central / Eastern Europe
  pl: "Anonimowy",
  cs: "Anonymní",
  sk: "Anonymný",
  hu: "Névtelen",
  ro: "Anonim",
  bg: "Анонимен",
  hr: "Anoniman",
  sr: "Анониман",
  sl: "Anonimen",
  uk: "Анонімний",
  ru: "Аноним",
  lt: "Anoniminis",
  lv: "Anonīms",
  et: "Anonüümne",
  // Southern Europe
  el: "Ανώνυμος",
  tr: "Anonim",
  // Middle East
  ar: "مجهول",
  he: "אנונימי",
  fa: "ناشناس",
  // South Asia
  hi: "गुमनाम",
  bn: "नामहीन",
  ur: "گمنام",
  // Southeast Asia
  th: "นิรนาม",
  vi: "Ẩn danh",
  id: "Anonim",
  ms: "Tanpa Nama",
  tl: "Hindi Kilala",
  // East Asia
  zh: "匿名",
  ja: "匿名",
  ko: "익명",
  // Fallback generic
  la: "Anonymus", // Latin for fun
}

/**
 * Returns a localized "Anonymous" string based on the provided locale.
 */
export function getAnonymousName(locale?: string): string {
  if (!locale) return anonByLang.en
  const baseLocale = locale.split("-")[0].toLowerCase()
  return anonByLang[baseLocale] || anonByLang.la
}
const languageToRegion: Record<string, string> = {
  en: "GB",
  zh: "CN",
  pt: "BR",
  es: "ES",
  fr: "FR",
  de: "DE",
  ja: "JP",
  ko: "KR",
  it: "IT",
  nl: "NL",
  sv: "SE",
  pl: "PL",
  ru: "RU",
}

export function localeToFlag(locale?: string): string {
  if (!locale) return "🌐"

  const trimmed = locale.trim()
  if (!trimmed.includes("-") && trimmed.length === 2) {
    return trimmed
      .toUpperCase()
      .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
  }

  const [lang, regionPart] = trimmed.split("-")

  const region =
    regionPart?.length === 2
      ? regionPart
      : languageToRegion[lang?.toLowerCase()]

  if (!region) return "🌐"

  return region
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}
