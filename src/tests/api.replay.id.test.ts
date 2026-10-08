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
    mockResponseConstructor.redirect = jest.fn((url) => {
      const headers = new Map([["Location", url]])
      return {
        status: 307,
        headers: {
          get: (name: string) => headers.get(name) || null,
          set: (name: string, value: string) => headers.set(name, value),
        },
      }
    })
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

    const res = await handler(req)

    expect(replaySpy).toHaveBeenCalledWith(id)
    expect(Response.redirect).toHaveBeenCalledWith("https://replayed-url.com/")
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=172800, stale-while-revalidate=86400"
    )
  })

  it("should forward extra query params to the redirect URL", async () => {
    const replayUrl = "https://replayed-url.com"
    jest.spyOn(mockShortener.prototype, "replay").mockResolvedValue(replayUrl)

    const id = "some-id"
    req = {
      method: "GET",
      nextUrl: new URL(`https://localhost/api/replay/${id}?id=${id}&lod=4`),
    } as unknown as NextRequest

    await handler(req)

    expect(Response.redirect).toHaveBeenCalledWith(
      "https://replayed-url.com/?lod=4"
    )
  })
})
