import {
  parseNchanMessage,
  isLobbyMessage,
  isPresenceMessage,
  type LobbyMessage,
  type PresenceMessage,
} from "../../nchan/types"

describe("Nchan Message Types", () => {
  describe("parseNchanMessage", () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {})
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {})

    beforeEach(() => {
      consoleWarnSpy.mockClear()
      consoleErrorSpy.mockClear()
    })

    afterAll(() => {
      consoleWarnSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })

    it("should parse a valid lobby message", () => {
      const data = JSON.stringify({
        messageType: "lobby",
        type: "match_created",
        matchId: "123",
      })

      const result = parseNchanMessage(data)

      expect(result).not.toBeNull()
      expect(result?.messageType).toBe("lobby")
      expect(isLobbyMessage(result)).toBe(true)
    })

    it("should parse a valid presence message", () => {
      const data = JSON.stringify({
        messageType: "presence",
        type: "join",
        userId: "user123",
        userName: "TestUser",
      })

      const result = parseNchanMessage(data)

      expect(result).not.toBeNull()
      expect(result?.messageType).toBe("presence")
      expect(isPresenceMessage(result)).toBe(true)
    })

    it("should handle legacy messages without messageType (assume lobby)", () => {
      const data = JSON.stringify({
        type: "match_created",
        matchId: "123",
      })

      const result = parseNchanMessage(data)

      expect(result).not.toBeNull()
      expect(result?.messageType).toBe("lobby")
      expect(isLobbyMessage(result)).toBe(true)
    })

    it("should return null for invalid JSON", () => {
      const data = "not a json string"

      const result = parseNchanMessage(data)

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it("should return null for unknown message types", () => {
      const data = JSON.stringify({
        messageType: "unknown",
        data: "test",
      })

      const result = parseNchanMessage(data)

      expect(result).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe("Type guards", () => {
    it("isLobbyMessage should correctly identify lobby messages", () => {
      const lobbyMsg: LobbyMessage = {
        messageType: "lobby",
        type: "test",
      }

      expect(isLobbyMessage(lobbyMsg)).toBe(true)
      expect(isPresenceMessage(lobbyMsg)).toBe(false)
    })

    it("isPresenceMessage should correctly identify presence messages", () => {
      const presenceMsg: PresenceMessage = {
        messageType: "presence",
        type: "join",
        userId: "123",
        userName: "Test",
      }

      expect(isPresenceMessage(presenceMsg)).toBe(true)
      expect(isLobbyMessage(presenceMsg)).toBe(false)
    })

    it("should handle null/undefined gracefully", () => {
      expect(isLobbyMessage(null)).toBe(false)
      expect(isLobbyMessage(undefined)).toBe(false)
      expect(isPresenceMessage(null)).toBe(false)
      expect(isPresenceMessage(undefined)).toBe(false)
    })

    it("should handle objects without messageType", () => {
      const obj = { type: "test" }

      expect(isLobbyMessage(obj)).toBe(false)
      expect(isPresenceMessage(obj)).toBe(false)
    })
  })
})
