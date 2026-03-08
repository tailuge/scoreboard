/**
 * ClientErrorReporter - Captures client-side errors and reports them to a server endpoint.
 *
 * USAGE:
 * 1. Import and instantiate with your error collection endpoint URL:
 *    const reporter = new ClientErrorReporter("https://your-server.com/api/errors")
 * 2. Call start() to begin capturing errors:
 *    reporter.start()
 * 3. Call stop() when done (e.g., on page unload or component unmount):
 *    reporter.stop()
 *
 * ENDPOINT:
 * The default endpoint for this project is hosted at:
 *   https://scoreboard-tailuge.vercel.app/api/client-error
 *
 * CORS:
 * The endpoint must include appropriate CORS headers (Access-Control-Allow-Origin)
 * to allow cross-origin requests from client applications.
 *
 * CAPTURED SOURCES:
 * - console.error and console.warn calls
 * - window.onerror (uncaught JavaScript errors)
 * - window.onunhandledrejection (unhandled Promise rejections)
 *
 * RATE LIMITING:
 * - Maximum of maxPerKey (default: 3) reports per unique error message
 * - Maximum queue size of maxQueueSize (default: 20) before forced flush
 * - Automatic flush every flushIntervalMs (default: 5000ms)
 *
 * @example
 * // Basic usage with default settings
 * const reporter = new ClientErrorReporter("https://example.com/api/errors")
 * reporter.start()
 *
 * @example
 * // Custom configuration
 * const reporter = new ClientErrorReporter("https://example.com/api/errors", {
 *   maxPerKey: 5,
 *   flushIntervalMs: 10000,
 *   maxQueueSize: 50
 * })
 * reporter.start()
 */

interface ErrorReport {
  type: string
  message: string
  stack?: string
  url: string
  ts: number
  sid: string
}

export class ClientErrorReporter {
  private readonly endpoint: string
  private readonly sid: string
  private queue: ErrorReport[] = []
  private readonly seen = new Map<string, number>()

  private readonly maxPerKey: number
  private readonly flushIntervalMs: number
  private readonly maxQueueSize: number

  private intervalId?: ReturnType<typeof setInterval>
  private readonly boundFlush: () => void
  private originalConsoleError?: typeof console.error
  private originalConsoleWarn?: typeof console.warn

  constructor(
    endpoint: string,
    options?: {
      maxPerKey?: number
      flushIntervalMs?: number
      maxQueueSize?: number
    }
  ) {
    this.endpoint = endpoint
    this.sid = this.generateSid()
    this.maxPerKey = options?.maxPerKey ?? 3
    this.flushIntervalMs = options?.flushIntervalMs ?? 5000
    this.maxQueueSize = options?.maxQueueSize ?? 20

    this.boundFlush = this.flush.bind(this)
  }

  private generateSid(): string {
    return Date.now().toString(36)
  }

  start() {
    this.patchConsole()
    this.patchGlobalErrors()

    this.intervalId = setInterval(this.boundFlush, this.flushIntervalMs)

    window.addEventListener("pagehide", this.boundFlush)
  }

  stop() {
    this.flush(true)

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    window.removeEventListener("pagehide", this.boundFlush)

    if (this.originalConsoleError) {
      console.error = this.originalConsoleError
    }
    if (this.originalConsoleWarn) {
      console.warn = this.originalConsoleWarn
    }
  }

  private patchConsole() {
    this.originalConsoleError = console.error
    this.originalConsoleWarn = console.warn

    console.error = (...args: unknown[]) => {
      this.capture("error", args)
      this.originalConsoleError?.apply(console, args)
    }

    console.warn = (...args: unknown[]) => {
      this.capture("warn", args)
      this.originalConsoleWarn?.apply(console, args)
    }
  }

  private patchGlobalErrors() {
    globalThis.addEventListener?.("error", (e) => {
      this.capture("uncaught", [e.error || e.message])
    })

    globalThis.addEventListener?.("unhandledrejection", (e) => {
      this.capture("promise", [e.reason])
    })
  }

  private capture(type: string, args: unknown[]) {
    try {
      let message = args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
        .join(" ")
      let stack: string | undefined

      if (args[0] instanceof Error) {
        message = args[0].message
        stack = args[0].stack
      }

      const key = type + ":" + message
      const count = (this.seen.get(key) ?? 0) + 1
      this.seen.set(key, count)

      if (count > this.maxPerKey) return

      this.queue.push({
        type,
        message,
        stack,
        url: globalThis.location?.href ?? "",
        ts: Date.now(),
        sid: this.sid,
      })

      if (this.queue.length > this.maxQueueSize) this.flush()
    } catch {
      // do nothing
    }
  }

  private flush(useBeacon = true) {
    try {
      if (!this.queue.length) return

      const payload = JSON.stringify(this.queue)
      this.queue = []

      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(this.endpoint, payload)
        return
      }

      fetch(this.endpoint, {
        method: "POST",
        body: payload,
        keepalive: true,
        headers: { "content-type": "application/json" },
      }).catch(() => {
        // do nothing
      })
    } catch {
      // do nothing
    }
  }
}
