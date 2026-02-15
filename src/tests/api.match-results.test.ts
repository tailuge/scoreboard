import handler from "../pages/api/match-results"
import { NextRequest } from "next/server"
import { MatchResultService } from "../services/MatchResultService"
import type { MatchResult } from "../types/match"

jest.mock("../services/MatchResultService")
const MockMatchResultService = MatchResultService as jest.MockedClass<
  typeof MatchResultService
>

describe("/api/match-results handler", () => {
  let req: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()

    const mockResponseConstructor = jest.fn((body, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(JSON.parse(body)),
      text: () => Promise.resolve(body),
    })) as any

    mockResponseConstructor.json = jest.fn((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
    }))

    globalThis.Response = mockResponseConstructor
  })

  it("should return match results on GET request", async () => {
    const mockResults: MatchResult[] = [
      {
        id: "1",
        winner: "A",
        loser: "B",
        winnerScore: 10,
        loserScore: 5,
        ruleType: "snooker",
        timestamp: 123,
      },
    ]

    const getSpy = jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue(mockResults)

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-results"),
    } as unknown as NextRequest

    const response = await handler(req)
    const data = await response.json()

    expect(data).toEqual(mockResults)
    expect(getSpy).toHaveBeenCalled()
  })

  it("should support ruleType filtering on GET request", async () => {
    const getSpy = jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue([])

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-results?ruleType=snooker"),
    } as unknown as NextRequest

    await handler(req)
    expect(getSpy).toHaveBeenCalledWith(50, "snooker")
  })

  it("should add a match result on POST request", async () => {
    const newResult = {
      winner: "A",
      loser: "B",
      winnerScore: 10,
      loserScore: 5,
      ruleType: "snooker",
      timestamp: 123,
    }

    const addSpy = jest
      .spyOn(MockMatchResultService.prototype, "addMatchResult")
      .mockResolvedValue(undefined)

    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-results"),
      json: jest.fn().mockResolvedValue(newResult),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(201)
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        winner: "A",
        loser: "B",
        winnerScore: 10,
        loserScore: 5,
        ruleType: "snooker",
        id: expect.any(String),
        timestamp: expect.any(Number),
      }),
      undefined
    )
  })

  it("should pass replayData to service on POST request", async () => {
    const dataWithReplay = {
      winner: "A",
      winnerScore: 10,
      replayData: "my-replay-blob",
    }

    const addSpy = jest
      .spyOn(MockMatchResultService.prototype, "addMatchResult")
      .mockResolvedValue(undefined)

    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-results"),
      json: jest.fn().mockResolvedValue(dataWithReplay),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(201)
    expect(addSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({ replayData: "my-replay-blob" }),
      "my-replay-blob"
    )
  })

  it("should support solo match result on POST request", async () => {
    const soloResult = {
      winner: "A",
      winnerScore: 10,
      ruleType: "snooker",
      timestamp: 123,
    }

    const addSpy = jest
      .spyOn(MockMatchResultService.prototype, "addMatchResult")
      .mockResolvedValue(undefined)

    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-results"),
      json: jest.fn().mockResolvedValue(soloResult),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(201)
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        winner: "A",
        winnerScore: 10,
        ruleType: "snooker",
        id: expect.any(String),
        timestamp: expect.any(Number),
      }),
      undefined
    )
  })

  it("should default ruleType to nineball on POST request if missing", async () => {
    const resultNoRuleType = {
      winner: "A",
      winnerScore: 10,
    }

    const addSpy = jest
      .spyOn(MockMatchResultService.prototype, "addMatchResult")
      .mockResolvedValue(undefined)

    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-results"),
      json: jest.fn().mockResolvedValue(resultNoRuleType),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(201)
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        winner: "A",
        winnerScore: 10,
        ruleType: "nineball",
        id: expect.any(String),
        timestamp: expect.any(Number),
      }),
      undefined
    )
  })

  it("should capture geolocation headers on POST request", async () => {
    const result = {
      winner: "A",
      winnerScore: 10,
    }

    const addSpy = jest
      .spyOn(MockMatchResultService.prototype, "addMatchResult")
      .mockResolvedValue(undefined)

    const headers = new Map([
      ["x-vercel-ip-country", "US"],
      ["x-vercel-ip-region", "CA"],
      ["x-vercel-ip-city", "San Francisco"],
    ])

    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-results"),
      json: jest.fn().mockResolvedValue(result),
      headers: {
        get: (name: string) => headers.get(name) || null,
      },
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(201)
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        locationCountry: "US",
        locationRegion: "CA",
        locationCity: "San Francisco",
      }),
      undefined
    )
  })

  it("should return 400 if required fields are missing in POST request", async () => {
    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-results"),
      json: jest.fn().mockResolvedValue({ winner: "A" }),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(400)
  })

  it("should return 500 if service fails on GET request", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockRejectedValue(new Error("KV error"))

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-results"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(500)
  })

  it("should return 500 if service fails on POST request", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "addMatchResult")
      .mockRejectedValue(new Error("KV error"))

    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-results"),
      json: jest.fn().mockResolvedValue({
        winner: "A",
        loser: "B",
        winnerScore: 10,
        loserScore: 5,
      }),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(500)
  })

  it("should return 200 for OPTIONS request", async () => {
    req = {
      method: "OPTIONS",
      nextUrl: new URL("https://localhost/api/match-results"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(200)
  })

  it("should return 405 for unsupported methods", async () => {
    req = {
      method: "PUT",
      nextUrl: new URL("https://localhost/api/match-results"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(405)
  })
})
