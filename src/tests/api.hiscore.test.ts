import handler from "@/pages/api/hiscore"
import { ScoreTable } from "@/services/scoretable"
import { NextRequest } from "next/server"
import JSONCrush from "jsoncrush"
import { ReplayCodec } from "@/utils/replay-codec"

// Mock dependencies
jest.mock("@/services/scoretable")

const mockScoreTable = ScoreTable as jest.MockedClass<typeof ScoreTable>

describe("/api/hiscore handler", () => {
  const leaderboardUrl = "https://localhost/leaderboard.html"
  let req: NextRequest

  // Mirrors hiscore.html: the state query param is URL-encoded in the body
  const stateBody = (state: string) => `state=${encodeURIComponent(state)}`

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Response as a constructor and a static redirect method
    const mockResponseConstructor = jest.fn((body, init) => ({
      status: init?.status || 200,
      text: () => Promise.resolve(body),
    })) as any

    mockResponseConstructor.redirect = jest.fn((url, status) => ({
      status: status || 307,
      headers: new Map([["Location", url]]),
    }))

    globalThis.Response = mockResponseConstructor
  })

  it("should return a 400 error if the client version is outdated", async () => {
    const invalidData = { v: 0, score: 100 }
    const body = stateBody(ReplayCodec.encode(invalidData))

    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL("https://localhost/api/hiscore"),
    } as unknown as NextRequest

    await handler(req)

    expect(Response).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ status: 400 })
    )
    expect(Response.redirect).not.toHaveBeenCalled()
  })

  it("should add a new hiscore for an fflate-encoded state and redirect to the leaderboard", async () => {
    const validData = { v: 1, score: 150 }
    const body = stateBody(ReplayCodec.encode(validData))
    const ruletype = "eightball"
    const playerId = "player-1"

    const topTenSpy = jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockResolvedValue([])
    const addSpy = jest
      .spyOn(mockScoreTable.prototype, "add")
      .mockResolvedValue(1)

    const url = `https://localhost/api/hiscore?ruletype=${ruletype}&id=${playerId}`
    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL(url),
    } as unknown as NextRequest

    await handler(req)

    expect(Response.redirect).toHaveBeenCalledWith(leaderboardUrl)
    expect(topTenSpy).toHaveBeenCalledWith(ruletype)
    expect(addSpy).toHaveBeenCalled()
  })

  it("should add a new hiscore for a legacy JSONCrush state", async () => {
    const validData = { v: 1, score: 150 }
    const body = stateBody(JSONCrush.crush(JSON.stringify(validData)))
    const ruletype = "nineball"
    const playerId = "player-2"

    const topTenSpy = jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockResolvedValue([])
    const addSpy = jest
      .spyOn(mockScoreTable.prototype, "add")
      .mockResolvedValue(1)

    const url = `https://localhost/api/hiscore?ruletype=${ruletype}&id=${playerId}`
    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL(url),
    } as unknown as NextRequest

    await handler(req)

    expect(Response.redirect).toHaveBeenCalledWith(leaderboardUrl)
    expect(topTenSpy).toHaveBeenCalledWith(ruletype)
    expect(addSpy).toHaveBeenCalled()
  })

  it("should not add a duplicate hiscore", async () => {
    const validData = { v: 1, score: 150 }
    const body = stateBody(ReplayCodec.encode(validData))
    const ruletype = "eightball"
    const playerId = "player-1"

    const existingScore = { data: body }
    const topTenSpy = jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockResolvedValue([existingScore as any])
    const addSpy = jest
      .spyOn(mockScoreTable.prototype, "add")
      .mockResolvedValue(1)

    const url = `https://localhost/api/hiscore?ruletype=${ruletype}&id=${playerId}`
    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL(url),
    } as unknown as NextRequest

    await handler(req)

    expect(Response.redirect).toHaveBeenCalledWith(leaderboardUrl)
    expect(topTenSpy).toHaveBeenCalledWith(ruletype)
    expect(addSpy).not.toHaveBeenCalled()
  })

  it("should handle errors in urlState gracefully", async () => {
    const validData = { v: 1, score: 200 }
    const body = stateBody(ReplayCodec.encode(validData))
    const ruletype = "nineball"

    const malformedScore = { data: "this-is-not-url-encoded" }
    const topTenSpy = jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockResolvedValue([malformedScore as any])
    const addSpy = jest
      .spyOn(mockScoreTable.prototype, "add")
      .mockResolvedValue(1)

    const url = `https://localhost/api/hiscore?ruletype=${ruletype}`
    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL(url),
    } as unknown as NextRequest

    await handler(req)

    expect(Response.redirect).toHaveBeenCalledWith(leaderboardUrl)
    expect(topTenSpy).toHaveBeenCalledWith(ruletype)
    expect(addSpy).toHaveBeenCalled()
  })

  it("should return 400 if the state cannot be decoded", async () => {
    const body = stateBody("not-a-valid-replay-state")

    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL("https://localhost/api/hiscore"),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(400)
    expect(Response.redirect).not.toHaveBeenCalled()
  })

  it("should return 400 if ruletype is invalid", async () => {
    const validData = { v: 1, score: 150 }
    const body = stateBody(ReplayCodec.encode(validData))

    const topTenSpy = jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockImplementationOnce(() => {
        throw new Error("Invalid ruletype")
      })

    const url = `https://localhost/api/hiscore?ruletype=invalid`
    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(400)
    expect(topTenSpy).toHaveBeenCalledWith("invalid")
  })
})
