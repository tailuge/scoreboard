import { GAME_BASE_URL } from "@/config"
import JSONCrush from "jsoncrush"

const WEBSOCKET_SERVER = "wss://billiards.onrender.com/ws"

export interface RematchParam {
  readonly opponentId: string
  readonly opponentName: string
  readonly ruleType: string
  readonly lastScores: { readonly userId: string; readonly score: number }[]
  readonly nextTurnId: string
}

export class GameUrl {
  private static addUserParams(
    target: URL,
    userName: string,
    userId: string
  ): void {
    target.searchParams.append("userName", userName)
    target.searchParams.append("userId", userId)
  }

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
    this.addUserParams(target, userName, userId)
    target.searchParams.append("ruletype", ruleType)
    if (isSpectator) {
      target.searchParams.append("spectator", "true")
    }
    if (isCreator) {
      target.searchParams.append("first", "true")
    }

    return target
  }

  static createSinglePlayer({
    userName,
    userId,
    ruleType,
    isBot = false,
    extras = {},
  }: {
    userName: string
    userId: string
    ruleType: string
    isBot?: boolean
    extras?: Record<string, string>
  }): URL {
    const target = new URL(GAME_BASE_URL)
    this.addUserParams(target, userName, userId)
    target.searchParams.append("ruletype", ruleType)
    if (isBot) {
      target.searchParams.append("bot", "true")
    }
    for (const [key, value] of Object.entries(extras)) {
      target.searchParams.append(key, value)
    }

    return target
  }

  static serializeRematch(param: RematchParam): string {
    const json = JSON.stringify(param)
    return encodeURIComponent(JSONCrush.crush(json))
  }

  static parseRematch(url: URL): RematchParam | null {
    const rematch = url.searchParams.get("rematch")
    if (!rematch) return null
    try {
      const decoded = JSONCrush.uncrush(rematch)
      const parsed = JSON.parse(decoded) as RematchParam
      if (
        parsed.opponentId &&
        parsed.opponentName &&
        parsed.ruleType &&
        Array.isArray(parsed.lastScores) &&
        parsed.nextTurnId
      ) {
        return parsed
      }
    } catch (e) {
      console.error("Failed to parse rematch param", e)
    }
    return null
  }
}
