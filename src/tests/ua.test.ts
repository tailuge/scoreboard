import { detectOS, detectBrowser, browserIcon, osIcon } from "@/utils/ua"

describe("UA Utils", () => {
  const originalNavigator = globalThis.navigator

  afterEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    })
  })

  describe("detectOS", () => {
    it("should return Unknown if navigator is not defined", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        configurable: true,
      })
      expect(detectOS()).toBe("Unknown")
    })

    it("should use userAgentData.platform if available", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgentData: { platform: "macOS" },
          userAgent: "something else",
        },
        configurable: true,
      })
      expect(detectOS()).toBe("macOS")
    })

    it("should fallback to userAgent for Windows", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        configurable: true,
      })
      expect(detectOS()).toBe("Windows")
    })

    it("should fallback to userAgent for macOS", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        },
        configurable: true,
      })
      expect(detectOS()).toBe("macOS")
    })

    it("should fallback to userAgent for Linux", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
        },
        configurable: true,
      })
      expect(detectOS()).toBe("Linux")
    })

    it("should fallback to userAgent for Android", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Android 12; Mobile; rv:109.0)",
        },
        configurable: true,
      })
      expect(detectOS()).toBe("Android")
    })

    it("should fallback to userAgent for iOS (iPhone)", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
        },
        configurable: true,
      })
      expect(detectOS()).toBe("iOS")
    })

    it("should return Unknown for unrecognized userAgent", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Unknown Browser",
        },
        configurable: true,
      })
      expect(detectOS()).toBe("Unknown")
    })
  })

  describe("detectBrowser", () => {
    it("should return Unknown if navigator is not defined", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        configurable: true,
      })
      expect(detectBrowser()).toBe("Unknown")
    })

    it("should detect Edge", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41",
        },
        configurable: true,
      })
      expect(detectBrowser()).toBe("Edge")
    })

    it("should detect Opera", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 OPR/94.0.4606.81",
        },
        configurable: true,
      })
      expect(detectBrowser()).toBe("Opera")
    })

    it("should detect Chrome", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        },
        configurable: true,
      })
      expect(detectBrowser()).toBe("Chrome")
    })

    it("should detect Firefox", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
        },
        configurable: true,
      })
      expect(detectBrowser()).toBe("Firefox")
    })

    it("should detect Safari", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: {
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
        },
        configurable: true,
      })
      expect(detectBrowser()).toBe("Safari")
    })
  })

  describe("browserIcon", () => {
    it("should return correct icons", () => {
      expect(browserIcon("Chrome")).toBe("🌐")
      expect(browserIcon("Firefox")).toBe("🦊")
      expect(browserIcon("Safari")).toBe("🧭")
      expect(browserIcon("Edge")).toBe("🔵")
      expect(browserIcon("Opera")).toBe("🅾️")
      expect(browserIcon("Unknown")).toBe("🌍")
      expect(browserIcon()).toBe("🌍")
    })
  })

  describe("osIcon", () => {
    it("should return correct icons", () => {
      expect(osIcon("Windows")).toBe("🪟")
      expect(osIcon("macOS")).toBe("🍎")
      expect(osIcon("Linux")).toBe("🐧")
      expect(osIcon("Android")).toBe("🤖")
      expect(osIcon("iOS")).toBe("📱")
      expect(osIcon("Unknown")).toBe("💻")
      expect(osIcon()).toBe("💻")
    })
  })
})
