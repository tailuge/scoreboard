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

    originalError = console.error
    originalWarn = console.warn
    console.error = jest.fn()
    console.warn = jest.fn()

    reporter = new ClientErrorReporter("/api/client-error")
  })

  afterEach(() => {
    jest.useRealTimers()
    console.error = originalError
    console.warn = originalWarn
    delete (globalThis as any).fetch
    delete (globalThis as any).navigator
    jest.restoreAllMocks()
  })

  describe("start", () => {
    it("should set up error handlers", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener")

      reporter.start()

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      )
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "unhandledrejection",
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

    it("should capture console.warn calls", () => {
      reporter.start()

      console.warn("Test warning")

      jest.advanceTimersByTime(5001)

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        "/api/client-error",
        expect.stringContaining("warn")
      )
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
      window.dispatchEvent(event)

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
  })
})
