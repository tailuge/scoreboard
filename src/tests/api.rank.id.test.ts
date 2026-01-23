import handler from "@/pages/api/rank/[id]"
import { ScoreTable } from "@/services/scoretable"
import { NextRequest } from "next/server"

jest.mock("@/services/scoretable")

const mockScoreTable = ScoreTable as jest.MockedClass<typeof ScoreTable>

describe("/api/rank/[id] handler", () => {
  let req: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()

    const mockResponseConstructor = jest.fn((body, init) => ({
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
    })) as any
    globalThis.Response = mockResponseConstructor
  })

  it("should redirect on GET request", async () => {
    const getSpy = jest
      .spyOn(mockScoreTable.prototype, "get")
      .mockResolvedValue("https://some-url.com")

    const ruletype = "eightball"
    const id = "123"
    const url = `https://localhost/api/rank/${id}?ruletype=${ruletype}&id=${id}`
    req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(getSpy).toHaveBeenCalledWith(ruletype, id)
    expect(response.status).toBe(302)
    expect(response.headers.get("Location")).toBe("https://some-url.com")
  })

  it("should call like on PUT request", async () => {
    const likeSpy = jest
      .spyOn(mockScoreTable.prototype, "like")
      .mockResolvedValue()

    const ruletype = "nineball"
    const id = "456"
    const url = `https://localhost/api/rank/${id}?ruletype=${ruletype}&id=${id}`
    req = {
      method: "PUT",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(likeSpy).toHaveBeenCalledWith(ruletype, id)
    expect(response.status).toBe(200)
  })
})
