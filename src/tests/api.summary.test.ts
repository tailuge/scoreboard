import handler, {
  recentMatchesCache,
  sanitizeMatchResult,
} from "@/pages/api/summary"
import { ScoreTable } from "@/services/scoretable"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { MatchResultService } from "@/services/MatchResultService"
import type { NextApiRequest, NextApiResponse } from "next"

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
    recentMatchesCache.clear()
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

  it("should strip superfluous fields from typical 1-player and 2-player payloads", async () => {
    const twoPlayerMatch = {
      ruleType: "threecushion",
      winner: "Charly US",
      winnerId: "Char-dsi5",
      winnerScore: 10,
      bot: true,
      browser: "Edge",
      hasReplay: true,
      id: "acd477a7",
      locationCity: "Miami",
      locationCountry: "US",
      loser: "TheFarJaw",
      loserId: "bot-thefarjaw",
      loserScore: 3,
      os: "Windows",
      timestamp: 1794043485006,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0",
      version: "261106.18",
    }

    const onePlayerMatch = {
      ruleType: "snooker",
      winner: "Anonymous",
      winnerId: "G_d711_260806",
      winnerScore: 61,
      bot: false,
      browser: "Chrome",
      hasReplay: true,
      id: "d377519c",
      locationCity: "Wigan",
      locationCountry: "GB",
      os: "Windows",
      timestamp: 1794043455869,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36",
      version: "261106.18",
    }

    const sanitizedTwo = sanitizeMatchResult(twoPlayerMatch)
    expect(sanitizedTwo).toEqual({
      id: "acd477a7",
      winner: "Charly US",
      winnerScore: 10,
      loser: "TheFarJaw",
      loserScore: 3,
      ruleType: "threecushion",
      timestamp: 1794043485006,
      hasReplay: true,
      locationCountry: "US",
      locationCity: "Miami",
    })
    expect(sanitizedTwo).not.toHaveProperty("bot")
    expect(sanitizedTwo).not.toHaveProperty("winnerId")
    expect(sanitizedTwo).not.toHaveProperty("loserId")
    expect(sanitizedTwo).not.toHaveProperty("browser")
    expect(sanitizedTwo).not.toHaveProperty("os")
    expect(sanitizedTwo).not.toHaveProperty("userAgent")
    expect(sanitizedTwo).not.toHaveProperty("version")

    const sanitizedOne = sanitizeMatchResult(onePlayerMatch)
    expect(sanitizedOne).toEqual({
      id: "d377519c",
      winner: "Anonymous",
      winnerScore: 61,
      ruleType: "snooker",
      timestamp: 1794043455869,
      hasReplay: true,
      locationCountry: "GB",
      locationCity: "Wigan",
    })
    expect(sanitizedOne).not.toHaveProperty("loser")
    expect(sanitizedOne).not.toHaveProperty("loserScore")
    expect(sanitizedOne).not.toHaveProperty("bot")
    expect(sanitizedOne).not.toHaveProperty("winnerId")
    expect(sanitizedOne).not.toHaveProperty("browser")
    expect(sanitizedOne).not.toHaveProperty("os")
    expect(sanitizedOne).not.toHaveProperty("userAgent")
    expect(sanitizedOne).not.toHaveProperty("version")
  })

  it("should serve recentMatches from in-memory cache on subsequent requests", async () => {
    const mockHiscores = {
      snooker: [],
      nineball: [],
      threecushion: [],
      eightball: [],
      sagu: [],
    }
    const mockTopPlayers = {
      snooker: [],
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
        timestamp: 123456,
        ruleType: "nineball",
        userAgent: "SecretUA",
        isbot: true,
      },
    ]

    jest
      .spyOn(mockScoreTable.prototype, "topTenMulti")
      .mockResolvedValue(mockHiscores)
    jest
      .spyOn(mockPlayerRatingStore.prototype, "getTopNBatch")
      .mockResolvedValue(mockTopPlayers)
    const getMatchResultsSpy = jest
      .spyOn(mockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue(mockRecentMatches as any)

    const req = {
      query: { limitElo: "10", limitMatches: "32" },
    } as unknown as NextApiRequest

    // First request - populates cache
    const res1 = makeRes()
    await handler(req, res1)

    expect(getMatchResultsSpy).toHaveBeenCalledTimes(1)
    expect((res1.body as any).recentMatches).toEqual([
      {
        id: "m1",
        winner: "P1",
        winnerScore: 10,
        timestamp: 123456,
        ruleType: "nineball",
      },
    ])
    expect((res1.body as any).recentMatches[0]).not.toHaveProperty("userAgent")
    expect((res1.body as any).recentMatches[0]).not.toHaveProperty("isbot")

    // Second request - served from cache without calling getMatchResults again
    const res2 = makeRes()
    await handler(req, res2)

    expect(getMatchResultsSpy).toHaveBeenCalledTimes(1)
    expect((res2.body as any).recentMatches).toEqual([
      {
        id: "m1",
        winner: "P1",
        winnerScore: 10,
        timestamp: 123456,
        ruleType: "nineball",
      },
    ])
  })
})
