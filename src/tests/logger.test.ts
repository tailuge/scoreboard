import { logger } from "../utils/logger"

describe("logger", () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleInfoSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {})
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {})
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    logger.enabled = false
  })

  it("should not log when disabled", () => {
    logger.enabled = false
    logger.log("test log")
    logger.info("test info")
    logger.warn("test warn")

    expect(consoleLogSpy).not.toHaveBeenCalled()
    expect(consoleInfoSpy).not.toHaveBeenCalled()
    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it("should log when enabled", () => {
    logger.enabled = true
    logger.log("test log")
    logger.info("test info")
    logger.warn("test warn")

    expect(consoleLogSpy).toHaveBeenCalledWith("test log")
    expect(consoleInfoSpy).toHaveBeenCalledWith("test info")
    expect(consoleWarnSpy).toHaveBeenCalledWith("test warn")
  })

  it("should always log errors regardless of enabled status", () => {
    logger.enabled = false
    logger.error("test error")
    expect(consoleErrorSpy).toHaveBeenCalledWith("test error")

    logger.enabled = true
    logger.error("another error")
    expect(consoleErrorSpy).toHaveBeenCalledWith("another error")
  })

  describe("error with context", () => {
    it("should output rich context when given Error + context object", () => {
      const error = new Error("NetworkError")
      error.stack = "Error: NetworkError\n    at fetch (/app/hooks.ts:10:5)"

      logger.error("Failed to fetch leaderboard data", error, {
        operation: "fetchLeaderboard",
        file: "src/components/hooks/useLeaderboard.ts",
        url: "/api/rank?ruletype=8ball",
        method: "GET",
        status: 500,
      })

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain("Failed to fetch leaderboard data")
      expect(output).toContain("Error: NetworkError")
      expect(output).toContain("Operation: fetchLeaderboard")
      expect(output).toContain("File: src/components/hooks/useLeaderboard.ts")
      expect(output).toContain("URL: /api/rank?ruletype=8ball")
      expect(output).toContain("Method: GET")
      expect(output).toContain("Status: 500")
      expect(output).toContain("at fetch (/app/hooks.ts:10:5)")
    })

    it("should include details object entries", () => {
      const error = new Error("Timeout")

      logger.error("Request failed", error, {
        operation: "fetchMatchHistory",
        file: "src/components/hooks/useMatchHistory.ts",
        details: { retryCount: 3, timeout: 5000 },
      })

      const output = consoleErrorSpy.mock.calls[0][0] as string
      expect(output).toContain("retryCount: 3")
      expect(output).toContain("timeout: 5000")
    })

    it("should fall back to original behavior without context", () => {
      logger.error("Simple error", "string reason")
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Simple error",
        "string reason"
      )
    })

    it("should fall back to message-only without error", () => {
      logger.error("Just a message")
      expect(consoleErrorSpy).toHaveBeenCalledWith("Just a message")
    })
  })
})
