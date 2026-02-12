import { logger } from "@/utils/logger"
import type { LobbyMessage, PresenceMessage } from "./types"

export class NchanPub {
  private readonly lobbyPublishUrl: string
  private readonly presencePublishUrl: string
  private readonly base = "billiards-network.onrender.com"
  private readonly channel: string
  private readonly statusUrl = `https://${this.base}/basic_status`

  constructor(channel: string) {
    this.channel = channel
    this.lobbyPublishUrl = `https://${this.base}/publish/lobby/${this.channel}`
    this.presencePublishUrl = `https://${this.base}/publish/presence/${this.channel}`
  }

  /**
   * Publish a raw event (legacy method)
   */
  async post(event: any, channelType: "lobby" | "presence" = "lobby") {
    const url =
      channelType === "presence"
        ? this.presencePublishUrl
        : this.lobbyPublishUrl
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(event),
    })
    return await response.json()
  }

  /**
   * Publish a typed lobby message
   */
  async publishLobby(event: Omit<LobbyMessage, "messageType">) {
    const message: LobbyMessage = {
      ...event,
      messageType: "lobby",
    }
    return this.post(message)
  }

  /**
   * Publish a typed presence message
   */
  async publishPresence(event: Omit<PresenceMessage, "messageType">) {
    const message: PresenceMessage = {
      ...event,
      messageType: "presence",
    }
    return this.post(message, "presence")
  }

  async getSubscriberCount(channelType: "lobby" | "presence" = "lobby") {
    const url =
      channelType === "presence"
        ? this.presencePublishUrl
        : this.lobbyPublishUrl

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get subscriber count: ${response.status}`)
      }

      const info = await response.json()
      return info.subscribers ?? 0
    } catch (error) {
      logger.log("Error fetching subscriber count:", error)
      return null
    }
  }

  /**
   * Legacy method for overall server status
   */
  async get() {
    try {
      const response = await fetch(this.statusUrl, {
        method: "GET",
        mode: "cors",
      })

      const textData = await response.text()
      const activeConnectionsRegex = /Active connections:\s+(\d+)/
      const activeConnectionsMatch = activeConnectionsRegex.exec(textData)
      const activeConnections = activeConnectionsMatch
        ? Number.parseInt(activeConnectionsMatch[1], 10) - 1
        : 0

      return activeConnections
    } catch {
      return 0
    }
  }
}
