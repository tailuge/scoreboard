import { GAME_BASE_URL } from "@/config"

const WEBSOCKET_SERVER = "wss://billiards.onrender.com/ws"

export class GameUrl {
  static create({
    tableId,
    userName,
    userId,
    ruleType,
    isSpectator = false,
    isCreator = false,
  }: {
    tableId: string
    userName: string
    userId: string
    ruleType: string
    isSpectator?: boolean
    isCreator?: boolean
  }): URL {
    const target = new URL(GAME_BASE_URL)
    target.searchParams.append("websocketserver", WEBSOCKET_SERVER)
    target.searchParams.append("tableId", tableId)
    target.searchParams.append("name", userName)
    target.searchParams.append("clientId", userId)
    target.searchParams.append("ruletype", ruleType)
    if (isSpectator) {
      target.searchParams.append("spectator", "true")
    }
    if (isCreator) {
      target.searchParams.append("first", "true")
    }

    return target
  }
}
