import { logger } from "@/utils/logger"

export class NchanSub {
  private socket: WebSocket | null = null
  private readonly subscribeUrl: string
  private readonly notify: (event: string) => void = () => {}
  private shouldReconnect: boolean = false
  private reconnectTimeout: NodeJS.Timeout | null = null
  private readonly base =
    process.env.NEXT_PUBLIC_WEBSOCKET_HOST || "billiards-network.onrender.com"
  private readonly channel: string
  private isPageHidden: boolean = false

  constructor(
    channel: string,
    notify: (event: string) => void = () => {},
    channelType: string = "lobby"
  ) {
    this.channel = channel
    this.subscribeUrl = `wss://${this.base}/subscribe/${channelType}/${this.channel}`
    this.notify = notify
  }

  private readonly handlePageHide = () => {
    this.isPageHidden = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.socket) {
      this.socket.close()
      logger.log(`Closed connection for bfcache: ${this.subscribeUrl}`)
    }
  }

  private readonly handlePageShow = (event: PageTransitionEvent) => {
    this.isPageHidden = false
    if (event.persisted && this.shouldReconnect) {
      logger.log(`Restoring connection from bfcache: ${this.subscribeUrl}`)
      this.connect()
    }
  }

  start() {
    this.shouldReconnect = true
    this.connect()
    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener("pagehide", this.handlePageHide)
      globalThis.window.addEventListener("pageshow", this.handlePageShow)
    }
  }

  private connect() {
    this.socket = new WebSocket(this.subscribeUrl)

    this.socket.onopen = () => {
      logger.log(`Connected to ${this.subscribeUrl}`)
    }

    this.socket.onmessage = (event: MessageEvent) => {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      const data = event.data

      if (typeof data === "string" && data.trim() === "") {
        return
      } else {
        try {
          const parsed = JSON.parse(data)
          if (parsed.type !== "heartbeat") {
            logger.log(`${time} <-`, parsed)
          }
        } catch {
          logger.log(`${time} <- ${data}`)
        }
      }

      this.notify(data)
    }

    this.socket.onerror = (error: Event) => {
      console.error(`WebSocket error:`, error)
    }

    const currentSocket = this.socket
    this.socket.onclose = (event: CloseEvent) => {
      logger.log("Disconnected from %s:", this.subscribeUrl, event.reason)
      if (this.socket === currentSocket) {
        this.socket = null
        if (this.shouldReconnect && !this.isPageHidden) {
          this.reconnectTimeout = setTimeout(() => this.connect(), 30000)
        }
      }
    }
  }

  private getReadyStateLabel(readyState?: number): string {
    switch (readyState) {
      case 0:
        return "CONNECTING"
      case 1:
        return "OPEN"
      case 2:
        return "CLOSING"
      case 3:
        return "CLOSED"
      default:
        return "UNKNOWN"
    }
  }

  stop() {
    this.shouldReconnect = false
    if (globalThis.window !== undefined) {
      globalThis.window.removeEventListener("pagehide", this.handlePageHide)
      globalThis.window.removeEventListener("pageshow", this.handlePageShow)
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    if (this.socket) {
      this.socket.close()
      this.socket = null
      logger.log(`Closed connection to ${this.subscribeUrl}`)
    }
  }
}
