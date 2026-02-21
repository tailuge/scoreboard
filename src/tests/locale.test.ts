import { localeToFlag } from "../utils/locale"

describe("localeToFlag", () => {
  it("should return a flag emoji for a valid locale with region", () => {
    expect(localeToFlag("en-US")).toBe("🇺🇸")
    expect(localeToFlag("en-GB")).toBe("🇬🇧")
    expect(localeToFlag("fr-FR")).toBe("🇫🇷")
    expect(localeToFlag("zh-CN")).toBe("🇨🇳")
  })

  it("should return a globe emoji for a locale without region", () => {
    expect(localeToFlag("en")).toBe("🌐")
    expect(localeToFlag("fr")).toBe("🌐")
  })

  it("should return a globe emoji for undefined or null locale", () => {
    expect(localeToFlag(undefined)).toBe("🌐")
    expect(localeToFlag()).toBe("🌐")
  })

  it("should return a globe emoji for invalid region formats", () => {
    expect(localeToFlag("en-USA")).toBe("🌐")
    expect(localeToFlag("en-1")).toBe("🌐")
  })
})
