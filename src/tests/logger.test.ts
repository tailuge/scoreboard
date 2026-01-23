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
    jest.restoreAllMocks()
    logger.enabled = process.env.NODE_ENV !== "test"
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
})
