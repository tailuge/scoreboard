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

    expect(Response.redirect).toHaveBeenCalledWith(
      "https://localhost/leaderboard.html"
    )
    expect(topTenSpy).toHaveBeenCalledWith(ruletype)
    expect(addSpy).toHaveBeenCalled()
  })
})
