import handler from "@/pages/api/summary"
import { ScoreTable } from "@/services/scoretable"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { MatchResultService } from "@/services/MatchResultService"
import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/services/scoretable")
jest.mock("@/services/PlayerRatingStore")
jest.mock("@/services/MatchResultService")

// The real unstable_cache pulls in web streams APIs that jsdom does not provide.
// Call through instead: these tests assert which reads happen, not cache behaviour.
jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}))

const mockScoreTable = ScoreTable as jest.MockedClass<typeof ScoreTable>
const mockPlayerRatingStore = PlayerRatingStore as jest.MockedClass<
  typeof PlayerRatingStore
>
const mockMatchResultService = MatchResultService as jest.MockedClass<
  typeof MatchResultService
>

function makeRes() {
  const headers: Record<string, string> = {}
  let statusCode = 200
  let body: unknown

  const res = {
    setHeader: (key: string, value: string) => {
      headers[key] = value
    },
    status: (code: number) => {
      statusCode = code
      return res
    },
    json: (data: unknown) => {
      body = data
      return res
    },
    _headers: headers,
    get statusCode() {
      return statusCode
    },
    get body() {
      return body
    },
  } as unknown as NextApiResponse & {
    _headers: Record<string, string>
    statusCode: number
    body: unknown
  }

  return res as typeof res
}

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
      sagu: [],
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
      sagu: [],
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

    const req = {
      query: { limitElo: "5", limitMatches: "10" },
    } as unknown as NextApiRequest

    const res = makeRes()
    await handler(req, res)

    expect(mockScoreTable.prototype.topTenMulti).toHaveBeenCalled()
    expect(mockPlayerRatingStore.prototype.getTopNBatch).toHaveBeenCalledWith(
      expect.any(Array),
      5
    )
    expect(
      mockMatchResultService.prototype.getMatchResults
    ).toHaveBeenCalledWith(10)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      hiscores: mockHiscores,
      topPlayers: mockTopPlayers,
      recentMatches: mockRecentMatches,
    })
    expect(res._headers["Cache-Control"]).toBe(
      "public, s-maxage=120, stale-while-revalidate=60"
    )
  })

  it("should return 500 on error", async () => {
    jest
      .spyOn(mockScoreTable.prototype, "topTenMulti")
      .mockRejectedValue(new Error("KV error"))

    const req = {
      query: {},
    } as unknown as NextApiRequest

    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: "Internal Server Error" })
  })
})
