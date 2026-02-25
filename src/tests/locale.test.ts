import { getAnonymousName, localeToFlag } from "../utils/locale"

describe("localeToFlag", () => {
  it("should return correct flag for locale", () => {
    expect(localeToFlag("en-US")).toBe("🇺🇸")
    expect(localeToFlag("fr-FR")).toBe("🇫🇷")
    expect(localeToFlag("de-DE")).toBe("🇩🇪")
  })

  it("should return globe for missing or invalid region", () => {
    expect(localeToFlag("bad")).toBe("🌐")
  })
})

describe("getAnonymousName", () => {
  it("should return 'Anonymous' for English locale", () => {
    expect(getAnonymousName("en-US")).toBe("Anonymous")
    expect(getAnonymousName("en")).toBe("Anonymous")
  })

  it("should return 'Anonyme' for French locale", () => {
    expect(getAnonymousName("fr-FR")).toBe("Anonyme")
    expect(getAnonymousName("fr")).toBe("Anonyme")
  })

  it("should return 'Anonym' for German locale", () => {
    expect(getAnonymousName("de-DE")).toBe("Anonym")
    expect(getAnonymousName("de")).toBe("Anonym")
  })

  it("should return 'Anonymus' (Latin) for unknown locales", () => {
    expect(getAnonymousName("xyz")).toBe("Anonymus")
  })

  it("should return 'Anonymous' for undefined or null locale", () => {
    expect(getAnonymousName()).toBe("Anonymous")
  })

  it("should handle mixed case locales", () => {
    expect(getAnonymousName("FR-fr")).toBe("Anonyme")
  })
})
