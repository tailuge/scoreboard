import handler from "../pages/api/match-replay"
import { NextRequest } from "next/server"
import { MatchResultService } from "../services/MatchResultService"

jest.mock("../services/MatchResultService")
const MockMatchResultService = MatchResultService as jest.MockedClass<
  typeof MatchResultService
>

describe("/api/match-replay handler", () => {
  let req: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock global Response
    const mockResponseConstructor = jest.fn((body, init) => ({
      status: init?.status || 200,
      text: () => Promise.resolve(body),
      headers: new Map(Object.entries(init?.headers || {})),
    })) as any

    mockResponseConstructor.redirect = (url: string, status = 307) => ({
      status,
      headers: new Map([["Location", url]]),
      text: () => Promise.resolve(""),
    })

    globalThis.Response = mockResponseConstructor
  })

  it("should redirect to viewer on GET request with gameType", async () => {
    const mockReplay = "replay-blob-data"
    const getSpy = jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockResolvedValue(mockReplay)
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue([
        {
          id: "match123",
          winner: "A",
          winnerScore: 10,
          gameType: "nineball",
          timestamp: Date.now(),
        },
      ])

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-replay?id=match123"),
    } as unknown as NextRequest

    const response = await handler(req)
    const location = response.headers.get("Location")

    expect(response.status).toBe(307)
    expect(location).toBe(
      `https://tailuge.github.io/billiards/dist/?ruletype=nineball&state=${encodeURIComponent(mockReplay)}`
    )
    expect(getSpy).toHaveBeenCalledWith("match123")
  })

  it("should redirect to viewer on GET request with ruleType", async () => {
    const mockReplay = "replay-blob-data"
    const getSpy = jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockResolvedValue(mockReplay)
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue([
        {
          id: "match123",
          winner: "A",
          winnerScore: 10,
          ruleType: "snooker",
          timestamp: Date.now(),
        },
      ])

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-replay?id=match123"),
    } as unknown as NextRequest

    const response = await handler(req)
    const location = response.headers.get("Location")

    expect(response.status).toBe(307)
    expect(location).toBe(
      `https://tailuge.github.io/billiards/dist/?ruletype=snooker&state=${encodeURIComponent(mockReplay)}`
    )
    expect(getSpy).toHaveBeenCalledWith("match123")
  })

  it("should return 400 if id is missing", async () => {
    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-replay"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(400)
  })

  it("should return 404 if replay is not found", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockResolvedValue(null)

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-replay?id=missing"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(404)
  })

  it("should return 404 if match result is not found", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockResolvedValue("replay-blob-data")
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue([])

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-replay?id=missing"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(404)
  })

  it("should return 500 if service fails", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockRejectedValue(new Error("KV error"))

    req = {
      method: "GET",
      nextUrl: new URL("https://localhost/api/match-replay?id=match123"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(500)
  })

  it("should return 405 for unsupported methods", async () => {
    req = {
      method: "POST",
      nextUrl: new URL("https://localhost/api/match-replay?id=match123"),
    } as unknown as NextRequest

    const response = await handler(req)
    expect(response.status).toBe(405)
  })
})
