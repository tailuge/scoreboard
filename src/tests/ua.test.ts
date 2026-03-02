import { detectOS, detectBrowser, browserIcon, osIcon } from "@/utils/ua"

describe("UA Utils", () => {
  const originalNavigator = globalThis.navigator

  const setNavigator = (nav: any) => {
    Object.defineProperty(globalThis, "navigator", {
      value: nav,
      configurable: true,
    })
  }

  afterEach(() => {
    setNavigator(originalNavigator)
  })

  describe("detectOS", () => {
    it("should return Unknown if navigator is not defined", () => {
      setNavigator(undefined)
      expect(detectOS()).toBe("Unknown")
    })

    it("should use userAgentData.platform if available", () => {
      setNavigator({
        userAgentData: { platform: "macOS" },
        userAgent: "something else",
      })
      expect(detectOS()).toBe("macOS")
    })

    const osTests = [
      ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Windows"],
      ["Mozilla/5.0 (Android 12; Mobile; rv:109.0)", "Android"],
      ["Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)", "iOS"],
      ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "macOS"],
      ["Mozilla/5.0 (X11; Linux x86_64)", "Linux"],
      ["Unknown Browser", "Unknown"],
    ]

    it.each(osTests)("should detect %s as %s", (userAgent, expectedOS) => {
      setNavigator({ userAgent })
      expect(detectOS()).toBe(expectedOS)
    })
  })

  describe("detectBrowser", () => {
    it("should return Unknown if navigator is not defined", () => {
      setNavigator(undefined)
      expect(detectBrowser()).toBe("Unknown")
    })

    const browserTests = [
      ["Mozilla/5.0 ... Edg/110.0.1587.41", "Edge"],
      ["Mozilla/5.0 ... OPR/94.0.4606.81", "Opera"],
      ["Mozilla/5.0 ... Chrome/110.0.0.0 Safari/537.36", "Chrome"],
      ["Mozilla/5.0 ... Firefox/109.0", "Firefox"],
      ["Mozilla/5.0 ... Version/16.1 Safari/605.1.15", "Safari"],
      ["Unknown Browser", "Unknown"],
    ]

    it.each(browserTests)(
      "should detect browser from %s as %s",
      (userAgent, expectedBrowser) => {
        setNavigator({ userAgent })
        expect(detectBrowser()).toBe(expectedBrowser)
      }
    )
  })

  describe("browserIcon", () => {
    it.each([
      ["Chrome", "🌐"],
      ["Firefox", "🦊"],
      ["Safari", "🧭"],
      ["Edge", "🔵"],
      ["Opera", "🅾️"],
      ["Unknown", "🌍"],
      [undefined, "🌍"],
    ])("should return icon for %s as %s", (browser, expectedIcon) => {
      expect(browserIcon(browser)).toBe(expectedIcon)
    })
  })

  describe("osIcon", () => {
    it.each([
      ["Windows", "🪟"],
      ["macOS", "🍎"],
      ["Linux", "🐧"],
      ["Android", "📱"],
      ["iOS", "📱"],
      ["Unknown", "💻"],
      [undefined, "💻"],
    ])("should return icon for %s as %s", (os, expectedIcon) => {
      expect(osIcon(os)).toBe(expectedIcon)
    })
  })
})
