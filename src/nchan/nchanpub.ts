import type { LobbyMessage, PresenceMessage } from "./types"

export class NchanPub {
  private readonly publishUrl: string
  private readonly presencePublishUrl: string
  private readonly base = "billiards-network.onrender.com"
  private readonly channel: string

  constructor(channel: string) {
    this.channel = channel
    this.publishUrl = `https://${this.base}/publish/lobby/${this.channel}`
    this.presencePublishUrl = `https://${this.base}/publish/presence/${this.channel}`
  }

  /**
   * Publish a message to a URL endpoint
   */
  private async postTo(url: string, event: any) {
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
   * Publish a typed lobby message (match events, table updates)
   */
  async publishLobby(event: Omit<LobbyMessage, "messageType">) {
    const message: LobbyMessage = {
      ...event,
      messageType: "lobby",
    }
    return this.postTo(this.publishUrl, message)
  }

  /**
   * Publish a typed presence message (user join/leave/heartbeat)
   */
  async publishPresence(event: Omit<PresenceMessage, "messageType">) {
    const message: PresenceMessage = {
      ...event,
      messageType: "presence",
    }
    return this.postTo(this.presencePublishUrl, message)
  }
}
