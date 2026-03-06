import handler from "@/pages/api/shorten"
import { Shortener } from "@/services/shortener"
import { NextRequest } from "next/server"

jest.mock("@/services/shortener")

const mockShortener = Shortener as jest.MockedClass<typeof Shortener>

describe("/api/shorten handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    globalThis.Response = jest.fn().mockImplementation((body, init) => {
      let responseHeaders: Map<string, string>
      if (!init?.headers) {
        responseHeaders = new Map()
      } else if (init.headers instanceof Map) {
        responseHeaders = init.headers
      } else {
        responseHeaders = new Map(
          Object.entries(init.headers as Record<string, string>)
        )
      }
      return {
        status: init?.status || 200,
        headers: responseHeaders,
        json: () => Promise.resolve(JSON.parse(body)),
        text: () => Promise.resolve(body),
      } as any
    }) as unknown as typeof Response
  })

  it("should return a shortened URL with a 200 status code", async () => {
    const requestBody = { data: "some-long-url" }
    const shortenerResponse = {
      input: requestBody,
      key: "1",
      shortUrl: "https://scoreboard-tailuge.vercel.app/api/replay/1",
    }

    const shortenSpy = jest
      .spyOn(mockShortener.prototype, "shorten")
      .mockResolvedValue(shortenerResponse)

    const req = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest

    const response = await handler(req)
    const responseBody = await response.json()

    expect(response.status).toBe(200)
    expect(shortenSpy).toHaveBeenCalledWith(requestBody)
    expect(responseBody).toEqual(shortenerResponse)
  })
})
