import handler from "@/pages/api/replay/[id]"
import { Shortener } from "@/services/shortener"
import type { NextApiRequest, NextApiResponse } from "next"

jest.mock("@/services/shortener")

const mockShortener = Shortener as jest.MockedClass<typeof Shortener>

function makeRes() {
  const headers: Record<string, string> = {}
  let statusCode = 200
  let redirectUrl: string | undefined

  const res = {
    setHeader: (key: string, value: string) => {
      headers[key] = value
    },
    status: (code: number) => {
      statusCode = code
      return res
    },
    end: (_body?: string) => {
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
  } as unknown as NextApiResponse & {
    _headers: Record<string, string>
    statusCode: number
    redirectUrl: string | undefined
  }

  return res as typeof res
}

function makeReq(query: Record<string, string>): NextApiRequest {
  return { method: "GET", query } as unknown as NextApiRequest
}

describe("/api/replay/[id] handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should redirect to the replayed URL", async () => {
    const replayUrl = "https://replayed-url.com"
    const replaySpy = jest
      .spyOn(mockShortener.prototype, "replay")
      .mockResolvedValue(replayUrl)

    const id = "some-id"
    const req = makeReq({ id })
    const res = makeRes()
    await handler(req, res)

    expect(replaySpy).toHaveBeenCalledWith(id)
    expect(res.statusCode).toBe(307)
    expect(res.redirectUrl).toBe("https://replayed-url.com/")
    expect(res._headers["Cache-Control"]).toBe(
      "public, s-maxage=172800, stale-while-revalidate=86400"
    )
  })

  it("should forward extra query params to the redirect URL", async () => {
    const replayUrl = "https://replayed-url.com"
    jest.spyOn(mockShortener.prototype, "replay").mockResolvedValue(replayUrl)

    const id = "some-id"
    const req = makeReq({ id, lod: "4" })
    const res = makeRes()
    await handler(req, res)

    expect(res.statusCode).toBe(307)
    expect(res.redirectUrl).toBe("https://replayed-url.com/?lod=4")
  })
})
