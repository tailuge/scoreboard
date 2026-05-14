import handler from "@/pages/api/summary"
import { ScoreTable } from "@/services/scoretable"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { MatchResultService } from "@/services/MatchResultService"
import { NextRequest } from "next/server"

jest.mock("@/services/scoretable")
jest.mock("@/services/PlayerRatingStore")
jest.mock("@/services/MatchResultService")

const mockScoreTable = ScoreTable as jest.MockedClass<typeof ScoreTable>
const mockPlayerRatingStore = PlayerRatingStore as jest.MockedClass<
  typeof PlayerRatingStore
>
const mockMatchResultService = MatchResultService as jest.MockedClass<
  typeof MatchResultService
>

describe("/api/summary handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return consolidated summary data", async () => {
    const mockHiscores = {
      snooker: [{ name: "S1", score: 100, likes: 0, id: "1" }],
      nineball: [],
      threecushion: [],
      eightball: [],
    }
    const mockTopPlayers = {
      snooker: [
        {
          name: "P1",
          rating: 1500,
          rd: 50,
          conservativeRating: 1400,
          gamesPlayed: 10,
          wins: 8,
          losses: 2,
        },
      ],
      nineball: [],
      threecushion: [],
      eightball: [],
    }
    const mockRecentMatches = [
      {
        id: "m1",
        winner: "P1",
        winnerScore: 10,
        loser: "P2",
        loserScore: 5,
        timestamp: Date.now(),
        ruleType: "snooker",
      },
    ]

    jest
      .spyOn(mockScoreTable.prototype, "topTenMulti")
      .mockResolvedValue(mockHiscores)
    jest
      .spyOn(mockPlayerRatingStore.prototype, "getTopNBatch")
      .mockResolvedValue(mockTopPlayers)
    jest
      .spyOn(mockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue(mockRecentMatches as any)

    const url = "https://localhost/api/summary?limitElo=5&limitMatches=10"
    const req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)
    const jsonData = await response.json()

    expect(mockScoreTable.prototype.topTenMulti).toHaveBeenCalled()
    expect(mockPlayerRatingStore.prototype.getTopNBatch).toHaveBeenCalledWith(
      expect.any(Array),
      5
    )
    expect(
      mockMatchResultService.prototype.getMatchResults
    ).toHaveBeenCalledWith(10)

    expect(response.status).toBe(200)
    expect(jsonData).toEqual({
      hiscores: mockHiscores,
      topPlayers: mockTopPlayers,
      recentMatches: mockRecentMatches,
    })
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=120, stale-while-revalidate=60"
    )
  })

  it("should return 500 on error", async () => {
    jest
      .spyOn(mockScoreTable.prototype, "topTenMulti")
      .mockRejectedValue(new Error("KV error"))

    const url = "https://localhost/api/summary"
    const req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)
    const jsonData = await response.json()

    expect(response.status).toBe(500)
    expect(jsonData).toEqual({ error: "Internal Server Error" })
  })
})
