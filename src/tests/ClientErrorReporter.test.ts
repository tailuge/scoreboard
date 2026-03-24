import { ClientErrorReporter } from "../errors/ClientErrorReporter"

describe("ClientErrorReporter", () => {
  let reporter: ClientErrorReporter
  let fetchSpy: jest.SpyInstance
  let sendBeaconSpy: jest.SpyInstance
  let originalError: typeof console.error
  let originalWarn: typeof console.warn

  beforeEach(() => {
    jest.useFakeTimers()

    fetchSpy = jest.fn().mockResolvedValue({ ok: true })
    ;(globalThis as any).fetch = fetchSpy

    sendBeaconSpy = jest.fn().mockReturnValue(true)
    ;(globalThis as any).navigator = {
      sendBeacon: sendBeaconSpy,
    }

    jest.spyOn(globalThis, "addEventListener")

    originalError = console.error
    originalWarn = console.warn
    // Don't use spyOn here because it replaces the method and we want to test if
    // ClientErrorReporter restores the ORIGINAL method it found when start() was called.
    console.error = jest.fn()
    console.warn = jest.fn()
    // Re-capture what we just set as the "original" for the reporter
    originalError = console.error
    originalWarn = console.warn

    reporter = new ClientErrorReporter("/api/client-error")
  })

  afterEach(() => {
    jest.useRealTimers()
    delete (globalThis as any).fetch
    delete (globalThis as any).navigator
    jest.restoreAllMocks()
    // Restore console methods manually just in case
    console.error = originalError
    console.warn = originalWarn
  })

  describe("start", () => {
    it("should set up error handlers", () => {
      const addEventListenerSpy = jest.spyOn(globalThis, "addEventListener")

      reporter.start()

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function)
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "securitypolicyviolation",
        expect.any(Function)
      )
    })

    it("should schedule periodic flush", () => {
      reporter.start()

      // Log an error first
      console.error("Test error")

      // Advance time to trigger flush
      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalled()
    })
  })

  describe("error capture", () => {
    it("should capture console.error calls", () => {
      reporter.start()

      console.error("Test error message")

      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.stringContaining("Test error message")
      )
    })

    it("should handle objects and circular references", () => {
      reporter.start()

      const circular: any = { name: "circular" }
      circular.self = circular

      console.error("Data:", { a: 1 }, circular)

      jest.advanceTimersByTime(5001)

      const call = sendBeaconSpy.mock.calls[0]
      const body = JSON.parse(call[1] as string)
      const message = body[0].message

      // Improved behavior: plain objects are JSON stringified, circulars show constructor name
      expect(message).toContain('{"a":1}')
      expect(message).toContain("[Object Object]")
    })

    it("should handle null and undefined", () => {
      reporter.start()

      console.error("Values:", null, undefined)

      jest.advanceTimersByTime(5001)

      const call = sendBeaconSpy.mock.calls[0]
      const body = JSON.parse(call[1] as string)
      const message = body[0].message

      expect(message).toBe("Values: null undefined")
    })

    it("should capture Error objects with stack traces", () => {
      reporter.start()

      const error = new Error("Test error")
      console.error(error)

      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.stringContaining("Test error")
      )
    })

    it("should deduplicate similar errors", () => {
      reporter.start()

      console.error("Same error")
      console.error("Same error")
      console.error("Same error")
      console.error("Same error")

      jest.advanceTimersByTime(5001)

      const call = sendBeaconSpy.mock.calls[0]
      const body = JSON.parse(call[1] as string)
      expect(body.filter((l: any) => l.message === "Same error").length).toBe(3)
    })

    it("should include url and timestamp", () => {
      reporter.start()

      console.error("Error with context")

      jest.advanceTimersByTime(5001)

      const call = sendBeaconSpy.mock.calls[0]
      const body = JSON.parse(call[1] as string)
      expect(body[0].url).toBe("http://localhost/")
      expect(body[0].ts).toBeDefined()
    })

    it("should include session id", () => {
      reporter.start()

      console.error("Test")

      jest.advanceTimersByTime(5001)

      const call = sendBeaconSpy.mock.calls[0]
      const body = JSON.parse(call[1] as string)
      expect(body[0].sid).toBeDefined()
      expect(body[0].sid.length).toBeGreaterThan(0)
    })
  })

  describe("flush", () => {
    it("should not call fetch when queue is empty", () => {
      reporter.start()

      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).not.toHaveBeenCalled()
    })

    it("should flush on queue overflow", () => {
      reporter.start()

      for (let i = 0; i < 21; i++) {
        console.error(`Error ${i}`)
      }

      expect(sendBeaconSpy).toHaveBeenCalled()
    })

    it("should use sendBeacon on pagehide", () => {
      reporter.start()

      console.error("Error before unload")

      const event = new Event("pagehide")
      globalThis.dispatchEvent(event)

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.any(String)
      )
    })

    it("should clear queue after flush", () => {
      reporter.start()

      console.error("Error 1")

      jest.advanceTimersByTime(5001)
      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1)
    })

    it("should use fetch when sendBeacon is not available", () => {
      delete (globalThis as any).navigator.sendBeacon
      reporter.start()

      console.error("Test error")

      // Trigger flush through timer
      jest.advanceTimersByTime(5001)

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.objectContaining({
          method: "POST",
          keepalive: true,
        })
      )
    })
  })

  describe("stop", () => {
    it("should stop interval and remove event listeners", () => {
      const removeEventListenerSpy = jest.spyOn(
        globalThis,
        "removeEventListener"
      )
      const clearIntervalSpy = jest.spyOn(globalThis, "clearInterval")

      reporter.start()
      reporter.stop()

      expect(clearIntervalSpy).toHaveBeenCalled()
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "pagehide",
        expect.any(Function)
      )
    })

    it("should restore original console methods", () => {
      const initialError = console.error
      reporter.start()
      const patchedError = console.error
      expect(patchedError).not.toBe(initialError)

      reporter.stop()

      expect(console.error).toBe(initialError)
      expect(console.warn).toBe(originalWarn)
    })
  })

  describe("global error events", () => {
    it("should capture uncaught errors", () => {
      reporter.start()

      const errorEvent = new ErrorEvent("error", {
        message: "Uncaught error",
        error: new Error("Uncaught error"),
      })
      globalThis.dispatchEvent(errorEvent)

      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.stringContaining("Uncaught error")
      )
    })

    it("should capture unhandled promise rejections", () => {
      reporter.start()

      // Manually trigger the listener since PromiseRejectionEvent might not be in jsdom
      const listeners = (globalThis.addEventListener as jest.Mock).mock.calls
      const rejectionListener = listeners.find(
        (call) => call[0] === "unhandledrejection"
      )?.[1]

      if (rejectionListener) {
        rejectionListener({
          reason: "Promise rejected",
        })
      }

      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.stringContaining("Promise rejected")
      )
    })

    it("should capture security policy violations", () => {
      reporter.start()

      const listeners = (globalThis.addEventListener as jest.Mock).mock.calls
      const cspListener = listeners.find(
        (call) => call[0] === "securitypolicyviolation"
      )?.[1]

      if (cspListener) {
        cspListener({
          violatedDirective: "frame-ancestors",
          blockedURI: "https://evil.com",
        })
      }

      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.stringContaining(
          "CSP Violation: frame-ancestors on https://evil.com"
        )
      )
    })
  })
})
