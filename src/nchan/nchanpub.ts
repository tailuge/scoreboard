import { logger } from "@/utils/logger"
import type { LobbyMessage, PresenceMessage } from "./types"

export class NchanPub {
  private readonly publishUrl: string
  private readonly base = "billiards-network.onrender.com"
  private readonly channel: string
  private readonly statusUrl = `https://${this.base}/basic_status`

  constructor(channel: string) {
    this.channel = channel
    this.publishUrl = `https://${this.base}/publish/lobby/${this.channel}`
  }

  /**
   * Publish a raw event (legacy method)
   */
  async post(event: any) {
    const response = await fetch(this.publishUrl, {
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
    return this.post(message)
  }

  async get() {
    const response = await fetch(this.statusUrl, {
      method: "GET",
      mode: "cors",
    })

    const textData = await response.text()
    logger.log(textData)

    // Parse the active connections from the response
    const activeConnectionsRegex = /Active connections:\s+(\d+)/
    const activeConnectionsMatch = activeConnectionsRegex.exec(textData)
    const activeConnections = activeConnectionsMatch
      ? Number.parseInt(activeConnectionsMatch[1], 10) - 1
      : 0

    logger.log("Active Connections:", activeConnections)
    return activeConnections
  }
}

