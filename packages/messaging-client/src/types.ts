/**
 * Server-enriched metadata added to all messages by Nchan.
 * This is the absolute source of truth for timing and origin.
 */
export interface _Meta {
  ts: string; // ISO timestamp of the request (Source of Truth for time)
  locale: string; // Accept-Language header
  ua: string; // User-Agent header
  ip: string; // Client remote address
  origin: string; // Origin header value
  host: string; // Host header value
  path: string; // Request URI path
  method: string; // HTTP method (always POST for publish)
}

/**
 * Seek object for table seeking in the lobby
 */
export interface Seek {
  tableId: string;
  ruleType?: string;
  // Note: Timing is handled by the wrapping message's _meta.ts
}

/**
 * Presence-related messages (user join/leave/heartbeat)
 */
export interface PresenceMessage {
  messageType: "presence";
  type: "join" | "heartbeat" | "leave";
  userId: string;
  userName: string;
  ruleType?: string;
  opponentId?: string | null;
  seek?: Seek;
  lastSeen?: number; // Managed internally (derived from _meta.ts)
  _meta?: _Meta; // Server-enriched metadata (received messages only)
  tableId?: string; // Current game/spectating table
}

/**
 * Peer-to-peer challenge request
 */
export interface ChallengeMessage {
  messageType: "challenge";
  type: "offer" | "accept" | "decline" | "cancel";
  challengerId: string;
  challengerName: string;
  recipientId: string;
  ruleType: string;
  tableId?: string; // Optional: table created by challenger
  _meta?: _Meta; // Server-enriched metadata (received messages only)
}

/**
 * Generic structure for table/game events
 */
export interface TableMessage<T = any> {
  type: string;
  senderId: string;
  data: T; // Application-specific payload
  _meta?: _Meta; // Server-enriched metadata (received messages only)
}

/**
 * Lobby-level information about an active game table
 */
export interface TableInfo {
  tableId: string;
  ruleType: string;
  players: { id: string; name: string }[];
  spectatorCount: number;
  status: "waiting" | "playing" | "finished";
  createdAt: number; // Derived from initial join _meta.ts
}

/**
 * Union type for messages received via the lobby channel
 */
export type LobbyIncomingMessage = PresenceMessage | ChallengeMessage;

/**
 * Type guards
 */
export function isPresenceMessage(msg: any): msg is PresenceMessage {
  return msg?.messageType === "presence";
}

export function isChallengeMessage(msg: any): msg is ChallengeMessage {
  return msg?.messageType === "challenge";
}

/**
 * Helper to parse incoming Nchan JSON strings
 */
export function parseMessage<T>(data: string): T | null {
  if (!data || data.trim() === "") return null;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.error("Failed to parse Nchan message:", e);
    return null;
  }
}
