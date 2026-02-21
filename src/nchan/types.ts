/**
 * Message types for multiplexing over the lobby WebSocket connection
 */

export type MessageType = "lobby" | "presence"

/**
 * Base message interface with type discriminator
 */
interface BaseMessage {
  messageType: MessageType
}

/**
 * Lobby-related messages (match events, table updates, etc.)
 */
export interface LobbyMessage extends BaseMessage {
  messageType: "lobby"
  // Existing lobby message fields
  type?: string
  matchId?: string
  tableId?: string
  player1?: string
  player2?: string
  status?: string
  timestamp?: number
  [key: string]: any // Allow additional fields for flexibility
}

/**
 * Presence-related messages (user join/leave/heartbeat)
 */
export interface PresenceMessage extends BaseMessage {
  messageType: "presence"
  type: "join" | "heartbeat" | "leave"
  userId: string
  userName: string
  locale?: string
  timestamp?: number
}

/**
 * Union type of all message types
 */
export type NchanMessage = LobbyMessage | PresenceMessage

/**
 * Type guard to check if a message is a LobbyMessage
 */
export function isLobbyMessage(msg: any): msg is LobbyMessage {
  return msg?.messageType === "lobby"
}

/**
 * Type guard to check if a message is a PresenceMessage
 */
export function isPresenceMessage(msg: any): msg is PresenceMessage {
  return msg?.messageType === "presence"
}

/**
 * Parse and validate an incoming message
 */
export function parseNchanMessage(data: string): NchanMessage | null {
  try {
    const parsed = JSON.parse(data)

    // If no messageType, assume it's a legacy lobby message
    if (!parsed.messageType) {
      return {
        ...parsed,
        messageType: "lobby",
      } as LobbyMessage
    }

    // Validate messageType
    if (parsed.messageType !== "lobby" && parsed.messageType !== "presence") {
      console.warn("Unknown message type:", parsed.messageType)
      return null
    }

    return parsed as NchanMessage
  } catch (error) {
    console.error("Failed to parse nchan message:", error)
    return null
  }
}
