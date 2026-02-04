import handler from "@/pages/api/usage/[metric]"
import { UsageService } from "@/services/usageservice"
import { NextRequest } from "next/server"

jest.mock("@/services/usageservice")

const mockUsageService = UsageService as jest.MockedClass<typeof UsageService>

describe("/api/usage/[metric] handler", () => {
  let req: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()

    const mockResponseConstructor = jest.fn((body, init) => ({
      status: init?.status || 200,
    })) as any

    mockResponseConstructor.json = jest.fn((data) => ({
      status: 200,
      json: () => Promise.resolve(data),
    }))

    globalThis.Response = mockResponseConstructor
  })

  it("should return all counts on GET request", async () => {
    const counts = [
      { date: "2024-01-01" },
      "10", // Scores are returned as strings from vercel/kv zrange withScores
    ]
    const getAllCountsSpy = jest
      .spyOn(mockUsageService.prototype, "getAllCounts")
      .mockResolvedValue(counts)

    const metric = "some-metric"
    const url = `https://localhost/api/usage/${metric}?metric=${metric}`
    req = {
      method: "GET",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)
    const jsonData = await response.json()

    expect(getAllCountsSpy).toHaveBeenCalled()
    expect(mockUsageService).toHaveBeenCalledWith(metric)
    expect(response.status).toBe(200)
    expect(jsonData).toEqual(counts)
  })

  it("should increment count on PUT request", async () => {
    const incrementCountSpy = jest
      .spyOn(mockUsageService.prototype, "incrementCount")
      .mockResolvedValue()

    const metric = "another-metric"
    const url = `https://localhost/api/usage/${metric}?metric=${metric}`
    req = {
      method: "PUT",
      nextUrl: new URL(url),
    } as unknown as NextRequest

    const response = await handler(req)

    expect(incrementCountSpy).toHaveBeenCalled()
    expect(mockUsageService).toHaveBeenCalledWith(metric)
    expect(response.status).toBe(200)
  })
})
