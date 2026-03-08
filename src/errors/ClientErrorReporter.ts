export class ClientErrorReporter {
  private endpoint: string
  private sid = crypto.randomUUID()
  private queue: any[] = []
  private seen = new Map<string, number>()
  private maxPerKey = 3
  private flushInterval = 5000

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  start() {
    this.patchConsole()
    this.patchGlobalErrors()

    setInterval(() => this.flush(), this.flushInterval)

    window.addEventListener("pagehide", () => this.flush(true))
  }

  private patchConsole() {
    const origError = console.error
    const origWarn = console.warn

    console.error = (...args: unknown[]) => {
      this.capture("error", args)
      origError.apply(console, args)
    }

    console.warn = (...args: unknown[]) => {
      this.capture("warn", args)
      origWarn.apply(console, args)
    }
  }

  private patchGlobalErrors() {
    window.addEventListener("error", (e) => {
      this.capture("uncaught", [e.error || e.message])
    })

    window.addEventListener("unhandledrejection", (e) => {
      this.capture("promise", [e.reason])
    })
  }

  private capture(type: string, args: unknown[]) {
    try {
      let message = args.map((a) => String(a)).join(" ")
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
        url: location.href,
        ts: Date.now(),
        sid: this.sid,
      })

      if (this.queue.length > 20) this.flush()
    } catch {
      // do nothing
    }
  }

  private flush(useBeacon = false) {
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
      }).catch(() => {})
    } catch {
      // do nothing
    }
  }
}
