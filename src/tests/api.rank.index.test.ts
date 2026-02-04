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
})
