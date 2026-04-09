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
  version?: string
  origin?: string
  online?: boolean
  viewport?: string
}

import { getUID } from "@/utils/uid"
import pkg from "../../package.json"

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
  private originalFetch?: typeof fetch

  constructor(
    endpoint: string,
    options?: {
      maxPerKey?: number
      flushIntervalMs?: number
      maxQueueSize?: number
    }
  ) {
    this.endpoint = endpoint
    this.sid = getUID()
    this.maxPerKey = options?.maxPerKey ?? 3
    this.flushIntervalMs = options?.flushIntervalMs ?? 30000
    this.maxQueueSize = options?.maxQueueSize ?? 50

    this.boundFlush = this.flush.bind(this)
  }

  start() {
    this.patchConsole()
    this.patchFetch()
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
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch
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

  private getUrlFromInput(input: RequestInfo | URL): string {
    if (typeof input === "string") return input
    if (input instanceof URL) return input.toString()
    return input.url
  }

  private patchFetch() {
    this.originalFetch = globalThis.fetch

    globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
      const [input, init] = args
      const url = this.getUrlFromInput(input)

      try {
        const response = await this.originalFetch!(...args)
        if (!response.ok && !url.includes(this.endpoint)) {
          this.capture("fetch", [
            `Fetch failed: ${response.status} ${response.statusText} for ${url}`,
            { method: init?.method || "GET", args },
          ])
        }
        return response
      } catch (error) {
        if (!url.includes(this.endpoint)) {
          this.capture("fetch", [
            `Fetch error for ${url}: ${error}`,
            { method: init?.method || "GET", args, error },
          ])
        }
        throw error
      }
    }
  }

  private patchGlobalErrors() {
    globalThis.addEventListener?.("error", (e) => {
      this.capture("uncaught", [e.error || e.message])
    })

    globalThis.addEventListener?.("unhandledrejection", (e) => {
      this.capture("promise", [e.reason])
    })

    globalThis.addEventListener?.("securitypolicyviolation", (e) => {
      this.capture("csp", [
        `CSP Violation: ${e.violatedDirective} on ${e.blockedURI}`,
      ])
    })
  }

  private serializeError(
    e: Error,
    context: { stack?: string; cause?: string }
  ): string {
    context.stack = context.stack || e.stack
    if (e.cause) {
      try {
        context.cause =
          context.cause ||
          (typeof e.cause === "string" ? e.cause : JSON.stringify(e.cause))
      } catch {
        context.cause = String(e.cause)
      }
    }
    return `${e.name}: ${e.message}`
  }

  private serializeObject(
    obj: Record<string, unknown>,
    context: { stack?: string }
  ): string {
    if (typeof obj.stack === "string") {
      context.stack = context.stack || obj.stack
    }
    if (typeof obj.message === "string" && typeof obj.name === "string") {
      return `${obj.name}: ${obj.message}`
    }
    try {
      return JSON.stringify(obj)
    } catch {
      const constructorName =
        (obj as { constructor?: { name?: string } }).constructor?.name ??
        "Object"
      return `[Object ${constructorName}]`
    }
  }

  private serializeArgument(
    a: unknown,
    context: { stack?: string; cause?: string }
  ): string {
    if (a === null) return "null"
    if (a === undefined) return "undefined"
    if (a instanceof Error) {
      return this.serializeError(a, context)
    }
    if (typeof a === "object") {
      return this.serializeObject(a as Record<string, unknown>, context)
    }
    return String(a)
  }

  private capture(type: string, args: unknown[]) {
    try {
      const context: { stack?: string; cause?: string } = {}
      const message = args.map((a) => this.serializeArgument(a, context)).join(" ")

      if (message.includes("autoconsent")) return

      let enhancedMessage = message
      if (context.cause) {
        enhancedMessage += ` (Cause: ${context.cause})`
      }
      if (message.includes("Load failed") || message.includes("Failed to fetch")) {
        enhancedMessage += " (Note: Possible network error or CSP violation)"
      }

      const key = type + ":" + enhancedMessage
      const count = (this.seen.get(key) ?? 0) + 1
      this.seen.set(key, count)

      if (count > this.maxPerKey) return

      this.queue.push({
        type,
        message: enhancedMessage,
        stack: context.stack,
        url: globalThis.location?.href ?? "",
        ts: Date.now(),
        sid: this.sid,
        version: pkg.version,
        origin: globalThis.location?.origin,
        online: globalThis.navigator?.onLine,
        viewport: globalThis.window
          ? `${globalThis.window.innerWidth}x${globalThis.window.innerHeight}`
          : undefined,
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
