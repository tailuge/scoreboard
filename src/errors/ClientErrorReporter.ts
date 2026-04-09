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
 * - Maximum queue size of maxQueueSize (default: 50) before forced flush
 * - Automatic flush every flushIntervalMs (default: 30000ms)
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

    globalThis.addEventListener?.("pagehide", this.boundFlush)
  }

  stop() {
    this.flush(true)

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    globalThis.removeEventListener?.("pagehide", this.boundFlush)

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

  private patchFetch() {
    this.originalFetch = globalThis.fetch
    if (!this.originalFetch) return

    globalThis.fetch = (...args: Parameters<typeof fetch>) => {
      const arg0 = args[0]
      let url: string
      if (typeof arg0 === "string") {
        url = arg0
      } else if (arg0 instanceof URL) {
        url = arg0.href
      } else {
        url = arg0.url
      }

      const isInternal = url.includes(this.endpoint)
      const promise = this.originalFetch!.apply(globalThis, args)

      if (isInternal) {
        return promise
      }

      return promise.catch((error) => {
        this.capture("fetch", [
          `Fetch error for ${url}: ${error}`,
          JSON.stringify({
            method: (args[1] as RequestInit)?.method || "GET",
            args,
            error: error instanceof Error ? {} : error,
          }),
        ])
        throw error
      })
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

  private capture(type: string, args: unknown[]) {
    try {
      const result = this.serializeArgs(args)
      const message = result.message
      const stack = result.stack

      if (message.includes("autoconsent")) return

      let enhancedMessage = message
      if (
        message.includes("Load failed") ||
        message.includes("Failed to fetch")
      ) {
        enhancedMessage += " (Note: Possible network error or CSP violation)"
      }

      const key = type + ":" + enhancedMessage
      const count = (this.seen.get(key) ?? 0) + 1
      this.seen.set(key, count)

      if (count > this.maxPerKey) return

      this.queue.push({
        type,
        message: enhancedMessage,
        stack,
        url: globalThis.location?.href ?? "",
        ts: Date.now(),
        sid: this.sid,
        version: pkg.version,
        origin: globalThis.location?.origin,
        online: globalThis.navigator?.onLine,
        viewport:
          typeof globalThis.innerWidth === "number"
            ? `${globalThis.innerWidth}x${globalThis.innerHeight}`
            : undefined,
      })

      if (this.queue.length > this.maxQueueSize) this.flush()
    } catch {
      // do nothing
    }
  }

  private serializeArgs(args: unknown[]) {
    let stack: string | undefined
    const message = args
      .map((a) => {
        if (a === null) return "null"
        if (a === undefined) return "undefined"
        if (a instanceof Error) {
          const result = this.serializeError(a)
          stack = stack || result.stack
          return result.message
        }
        if (typeof a === "object") {
          const result = this.serializeObject(a as Record<string, unknown>)
          stack = stack || result.stack
          return result.message
        }
        return String(a)
      })
      .join(" ")
    return { message, stack }
  }

  private serializeError(err: Error) {
    let stack = err.stack
    let message = String(err)
    if (err.cause) {
      message += ` (Cause: ${
        err.cause instanceof Error ? err.cause.message : String(err.cause)
      })`
      if (err.cause instanceof Error && err.cause.stack) {
        stack = (stack || "") + "\nCause stack: " + err.cause.stack
      }
    }
    return { message, stack }
  }

  private serializeObject(obj: Record<string, unknown>) {
    let stack: string | undefined
    if (typeof obj.stack === "string") {
      stack = obj.stack
    }
    if (typeof obj.message === "string" && typeof obj.name === "string") {
      return { message: `${obj.name}: ${obj.message}`, stack }
    }
    try {
      return { message: JSON.stringify(obj), stack }
    } catch {
      const constructorName = obj.constructor?.name ?? "Object"
      return { message: `[Object ${constructorName}]`, stack }
    }
  }

  private flush(useBeacon = true) {
    try {
      if (!this.queue.length) return

      const payload = JSON.stringify(this.queue)
      this.queue = []

      if (useBeacon && globalThis.navigator?.sendBeacon) {
        globalThis.navigator.sendBeacon(this.endpoint, payload)
        return
      }

      globalThis.fetch(this.endpoint, {
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
