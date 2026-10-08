import handler from "../pages/api/match-replay"
import { MatchResultService } from "../services/MatchResultService"
import { GAME_BASE_URL } from "@/config"
import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("../services/MatchResultService")
const MockMatchResultService = MatchResultService as jest.MockedClass<
  typeof MatchResultService
>

function makeRes() {
  const headers: Record<string, string> = {}
  let statusCode = 200
  let redirectUrl: string | undefined
  let ended = false

  const res = {
    setHeader: (key: string, value: string) => {
      headers[key] = value
    },
    status: (code: number) => {
      statusCode = code
      return res
    },
    end: (_body?: string) => {
      ended = true
      return res
    },
    redirect: (code: number, url: string) => {
      statusCode = code
      redirectUrl = url
      return res
    },
    get _headers() {
      return headers
    },
    get statusCode() {
      return statusCode
    },
    get redirectUrl() {
      return redirectUrl
    },
    get ended() {
      return ended
    },
  } as unknown as NextApiResponse & {
    _headers: Record<string, string>
    statusCode: number
    redirectUrl: string | undefined
    ended: boolean
  }

  return res as typeof res
}

function makeReq(
  query: Record<string, string>,
  method = "GET"
): NextApiRequest {
  return { method, query } as unknown as NextApiRequest
}

describe("/api/match-replay handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

    const req = makeReq({ id: "match123" })
    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(307)
    expect(res.redirectUrl).toBe(
      `${GAME_BASE_URL}?ruletype=snooker&state=${encodeURIComponent(mockReplay)}`
    )
    expect(res._headers["Cache-Control"]).toBe(
      "public, s-maxage=172800, stale-while-revalidate=86400"
    )
    expect(getSpy).toHaveBeenCalledWith("match123")
  })

  it("should forward extra query params to viewer url", async () => {
    const mockReplay = "replay-blob-data"
    jest
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

    const req = makeReq({
      id: "match123",
      userName: "Alice",
      userId: "u1",
      lod: "2",
    })
    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(307)
    expect(res.redirectUrl).toContain("userName=Alice")
    expect(res.redirectUrl).toContain("userId=u1")
    expect(res.redirectUrl).toContain("lod=2")
    expect(res.redirectUrl).not.toContain("id=match123")
  })

  it("should default to nineball when ruleType is missing", async () => {
    const mockReplay = "replay-blob-data"
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockResolvedValue(mockReplay)
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue([
        {
          id: "match123",
          winner: "A",
          winnerScore: 10,
          timestamp: Date.now(),
        },
      ])

    const req = makeReq({ id: "match123" })
    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(307)
    expect(res.redirectUrl).toContain("ruletype=nineball")
  })

  it("should return 400 if id is missing", async () => {
    const req = makeReq({})
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(400)
  })

  it("should return 404 if replay is not found", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockResolvedValue(null)

    const req = makeReq({ id: "missing" })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(404)
  })

  it("should return 404 if match result is not found", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockResolvedValue("replay-blob-data")
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchResults")
      .mockResolvedValue([])

    const req = makeReq({ id: "missing" })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(404)
  })

  it("should return 500 if service fails", async () => {
    jest
      .spyOn(MockMatchResultService.prototype, "getMatchReplay")
      .mockRejectedValue(new Error("KV error"))

    const req = makeReq({ id: "match123" })
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(500)
  })

  it("should return 405 for unsupported methods", async () => {
    const req = makeReq({ id: "match123" }, "POST")
    const res = makeRes()
    await handler(req, res)
    expect(res.statusCode).toBe(405)
  })
})
