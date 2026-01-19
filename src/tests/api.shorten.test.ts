import handler from "@/pages/api/shorten"
import { Shortener } from "@/services/shortener"
import { NextRequest } from "next/server"

// Mock the Shortener service
jest.mock("@/services/shortener")

const mockShortener = Shortener as jest.MockedClass<typeof Shortener>

describe("/api/shorten handler", () => {
  let req: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock the global Response object for the edge runtime
    global.Response = jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        headers: new Map(init?.headers),
        json: () => Promise.resolve(JSON.parse(body)),
        text: () => Promise.resolve(body),
      } as any
    })
  })

  it("should return a shortened URL with a 200 status code", async () => {
    const requestBody = { data: "some-long-url" }
    const shortenerResponse = {
      input: requestBody,
      key: "1",
      shortUrl: "https://scoreboard-tailuge.vercel.app/api/replay/1",
    }

    // Mock the Shortener's shorten method
    const shortenSpy = jest
      .spyOn(mockShortener.prototype, "shorten")
      .mockResolvedValue(shortenerResponse)

    // Create a mock NextRequest
    const req = {
      json: jest.fn().mockResolvedValue(requestBody),
    } as unknown as NextRequest

    const response = await handler(req)
    const responseBody = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(shortenSpy).toHaveBeenCalledWith(requestBody)
    expect(responseBody).toEqual(shortenerResponse)
  })
})
