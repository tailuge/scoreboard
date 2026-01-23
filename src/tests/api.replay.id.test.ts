import handler from "@/pages/api/replay/[id]"
import { Shortener } from "@/services/shortener"
import { NextRequest } from "next/server"

jest.mock("@/services/shortener")

const mockShortener = Shortener as jest.MockedClass<typeof Shortener>

describe("/api/replay/[id] handler", () => {
  let req: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()

    const mockResponseConstructor = jest.fn() as any
    mockResponseConstructor.redirect = jest.fn((url) => ({
      status: 307,
      headers: new Map([["Location", url]]),
    }))
    globalThis.Response = mockResponseConstructor
  })

  it("should redirect to the replayed URL", async () => {
    const replayUrl = "https://replayed-url.com"
    const replaySpy = jest
      .spyOn(mockShortener.prototype, "replay")
      .mockResolvedValue(replayUrl)

    const id = "some-id"
    const url = `https://localhost/api/replay/${id}?id=${id}`
    req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    await handler(req)

    expect(replaySpy).toHaveBeenCalledWith(id)
    expect(Response.redirect).toHaveBeenCalledWith(replayUrl)
  })
})
