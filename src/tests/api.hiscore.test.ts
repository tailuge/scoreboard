import handler from "@/pages/api/hiscore"
import { ScoreTable } from "@/services/scoretable"
import { NextRequest } from "next/server"
import JSONCrush from "jsoncrush"

// Mock dependencies
jest.mock("@/services/scoretable")
jest.mock("jsoncrush", () => ({
  __esModule: true,
  default: {
    crush: jest.fn((str) => `crushed-${str}`),
    uncrush: jest.fn((str) => `uncrushed-${str}`),
  },
}))

const mockScoreTable = ScoreTable as jest.MockedClass<typeof ScoreTable>
const mockJsonCrush = JSONCrush as jest.Mocked<typeof JSONCrush>

describe("/api/hiscore handler", () => {
  const leaderboardUrl = "https://localhost/leaderboard.html"
  let req: NextRequest

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
    const body = `state=some-crushed-string`
    mockJsonCrush.uncrush.mockReturnValue(JSON.stringify(invalidData))

    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL("https://localhost/api/hiscore"),
    } as unknown as NextRequest

    await handler(req)

    expect(Response).toHaveBeenCalledWith(expect.any(String), { status: 400 })
    expect(Response.redirect).not.toHaveBeenCalled()
  })

  it("should add a new hiscore and redirect to the leaderboard", async () => {
    const validData = { v: 1, score: 150 }
    const body = `state=some-crushed-string`
    const ruletype = "eightball"
    const playerId = "player-1"
    mockJsonCrush.uncrush.mockReturnValue(JSON.stringify(validData))

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
    const crushedString = "some-crushed-string"
    const body = `state=${crushedString}`
    const ruletype = "eightball"
    const playerId = "player-1"
    mockJsonCrush.uncrush.mockReturnValue(JSON.stringify(validData))

    const existingScore = { data: `state=${crushedString}` }
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
    const crushedString = "another-crushed-string"
    const body = `state=${crushedString}`
    const ruletype = "nineball"
    mockJsonCrush.uncrush.mockReturnValue(JSON.stringify(validData))

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

  it("should return 400 if state is missing", async () => {
    req = {
      text: jest.fn().mockResolvedValue(""),
      nextUrl: new URL("https://localhost/api/hiscore"),
    } as unknown as NextRequest

    await handler(req)
    expect(Response).toHaveBeenCalledWith("Missing state", { status: 400 })
  })

  it("should return 400 if state is invalid", async () => {
    mockJsonCrush.uncrush.mockReturnValue("invalid-json")
    req = {
      text: jest.fn().mockResolvedValue("state=abc"),
      nextUrl: new URL("https://localhost/api/hiscore"),
    } as unknown as NextRequest

    await handler(req)
    expect(Response).toHaveBeenCalledWith("Invalid state format", { status: 400 })
  })

  it("should return 400 if ruletype is invalid", async () => {
    const validData = { v: 1, score: 150 }
    mockJsonCrush.uncrush.mockReturnValue(JSON.stringify(validData))
    req = {
      text: jest.fn().mockResolvedValue("state=abc"),
      nextUrl: new URL("https://localhost/api/hiscore?ruletype=invalid"),
    } as unknown as NextRequest

    await handler(req)
    expect(Response).toHaveBeenCalledWith("Invalid ruletype", { status: 400 })
  })

  it("should handle error in urlState when URLSearchParams throws", async () => {
    const validData = { v: 1, score: 250 }
    const crushedString = "crushed-for-error-test"
    const body = `state=${crushedString}`
    const ruletype = "nineball"
    mockJsonCrush.uncrush.mockReturnValue(JSON.stringify(validData))

    // URLSearchParams might throw if input is not a string (though TypeScript prevents it, runtime might differ)
    // Or we can mock URLSearchParams to throw
    const originalURLSearchParams = global.URLSearchParams
    global.URLSearchParams = jest.fn().mockImplementation((input) => {
      if (input === "trigger-error") {
        throw new Error("Mocked error")
      }
      return new originalURLSearchParams(input)
    }) as any

    const errorScore = { data: "trigger-error" }
    jest.spyOn(mockScoreTable.prototype, "topTen").mockResolvedValue([errorScore as any])

    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL(`https://localhost/api/hiscore?ruletype=${ruletype}`),
    } as unknown as NextRequest

    await handler(req)
    expect(Response.redirect).toHaveBeenCalledWith(leaderboardUrl)

    global.URLSearchParams = originalURLSearchParams
  })

  it("should default score to 0 if json.score is missing", async () => {
    const validData = { v: 1 } // missing score
    const body = `state=some-crushed-string`
    const ruletype = "nineball"
    mockJsonCrush.uncrush.mockReturnValue(JSON.stringify(validData))

    jest.spyOn(mockScoreTable.prototype, "topTen").mockResolvedValue([])
    const addSpy = jest.spyOn(mockScoreTable.prototype, "add").mockResolvedValue(1)

    req = {
      text: jest.fn().mockResolvedValue(body),
      nextUrl: new URL(`https://localhost/api/hiscore?ruletype=${ruletype}`),
    } as unknown as NextRequest

    await handler(req)
    expect(addSpy).toHaveBeenCalledWith(ruletype, expect.any(Number), expect.any(String), body)
    const calledScore = addSpy.mock.calls[0][1]
    expect(calledScore).toBeGreaterThan(0) // base offset + small fractional part
    expect(calledScore).toBeLessThan(1) // Since (Date.now() - base) / base should be small if base is 2024
  })

  it("should return 400 if json is null", async () => {
    mockJsonCrush.uncrush.mockReturnValue("null")
    req = {
      text: jest.fn().mockResolvedValue("state=abc"),
      nextUrl: new URL("https://localhost/api/hiscore"),
    } as unknown as NextRequest

    await handler(req)
    expect(Response).toHaveBeenCalledWith(expect.any(String), { status: 400 })
  })
})
