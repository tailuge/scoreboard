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

  constructor(
    channel: string,
    notify: (event: string) => void = () => {},
    channelType: string = "lobby"
  ) {
    this.channel = channel
    this.subscribeUrl = `wss://${this.base}/subscribe/${channelType}/${this.channel}`
    this.notify = notify
  }

  start() {
    this.shouldReconnect = true
    this.connect()
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

    this.socket.onclose = (event: CloseEvent) => {
      logger.log("Disconnected from %s:", this.subscribeUrl, event.reason)
      if (this.shouldReconnect) {
        this.reconnectTimeout = setTimeout(() => this.connect(), 30000)
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
