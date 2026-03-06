import { GameUrl } from "@/utils/GameUrl"
import { GAME_BASE_URL } from "@/config"

describe("GameUrl", () => {
  const baseParams = {
    tableId: "table-123",
    userName: "user-name",
    userId: "user-id",
    ruleType: "eightball",
  }

  it("should create a basic game URL", () => {
    const url = GameUrl.create(baseParams)

    expect(url.origin).toBe(new URL(GAME_BASE_URL).origin)
    expect(url.pathname).toBe(new URL(GAME_BASE_URL).pathname)
    expect(url.searchParams.get("tableId")).toBe("table-123")
    expect(url.searchParams.get("name")).toBe("user-name")
    expect(url.searchParams.get("clientId")).toBe("user-id")
    expect(url.searchParams.get("ruletype")).toBe("eightball")
    expect(url.searchParams.has("spectator")).toBe(false)
    expect(url.searchParams.has("first")).toBe(false)
  })

  it("should add spectator flag", () => {
    const url = GameUrl.create({ ...baseParams, isSpectator: true })
    expect(url.searchParams.get("spectator")).toBe("true")
  })

  it("should add creator flag", () => {
    const url = GameUrl.create({ ...baseParams, isCreator: true })
    expect(url.searchParams.get("first")).toBe("true")
  })

  it("should handle encoded characters in names", () => {
    const url = GameUrl.create({ ...baseParams, userName: "User Name" })
    expect(url.searchParams.get("name")).toBe("User Name")
    // URL uses + or %20, standard verification
    expect(url.toString()).toContain("User+Name")
  })
})
