import handler from "@/pages/api/rank/index"
import { ScoreTable } from "@/services/scoretable"
import { NextRequest } from "next/server"

jest.mock("@/services/scoretable")

const mockScoreTable = ScoreTable as jest.MockedClass<typeof ScoreTable>

describe("/api/rank handler", () => {
  let req: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()

    const mockResponseConstructor = jest.fn((body, init) => ({
      status: init?.status || 200,
      headers: {
        get: (name: string) => init?.headers?.[name] || null,
      },
      text: () => Promise.resolve(body),
    })) as any
    globalThis.Response = mockResponseConstructor
  })

  it("should return top ten scores", async () => {
    const topTenData = [
      { name: "Player1", likes: 10, id: "abc", score: 100 },
      { name: "Player2", likes: 5, id: "def", score: 90 },
    ]
    const topTenSpy = jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockResolvedValue(topTenData)

    const ruletype = "eightball"
    const url = `https://localhost/api/rank?ruletype=${ruletype}`
    req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)
    const responseText = await response.text()

    expect(topTenSpy).toHaveBeenCalledWith(ruletype)
    expect(response.status).toBe(200)
    expect(responseText).toBe(JSON.stringify(topTenData))
  })

  it("should return 400 for invalid ruletype", async () => {
    jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockImplementationOnce(() => {
        throw new Error("Invalid ruletype")
      })

    const url = "https://localhost/api/rank?ruletype=invalid"
    req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(response.status).toBe(400)
  })

  it("should return all game types when ruletype=all", async () => {
    const topTenData = [{ name: "Player1", likes: 10, id: "abc", score: 100 }]
    const topTenSpy = jest
      .spyOn(mockScoreTable.prototype, "topTen")
      .mockResolvedValue(topTenData)

    const url = "https://localhost/api/rank?ruletype=all"
    req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)
    const responseText = await response.text()
    const jsonData = JSON.parse(responseText)

    expect(topTenSpy).toHaveBeenCalledTimes(4) // VALID_RULE_TYPES has 4 types
    expect(response.status).toBe(200)
    expect(jsonData.snooker).toEqual(topTenData)
    expect(jsonData.nineball).toEqual(topTenData)
    expect(jsonData.threecushion).toEqual(topTenData)
    expect(jsonData.eightball).toEqual(topTenData)
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=15, stale-while-revalidate=8"
    )
  })
})
