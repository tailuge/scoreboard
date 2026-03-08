import { NextRequest } from "next/server"
import handler from "@/pages/api/logs"
import { kv } from "@vercel/kv"

jest.mock("@vercel/kv", () => ({
  kv: {
    get: jest.fn(),
  },
}))

describe("logs API handler", () => {
  it("should return 405 for non-GET requests", async () => {
    const req = new NextRequest("http://localhost/api/logs", {
      method: "POST",
    })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })

  it("should return sessions from KV", async () => {
    const mockSessions = [{ sid: "s1" }]
    ;(kv.get as jest.Mock).mockResolvedValue(mockSessions)

    const req = new NextRequest("http://localhost/api/logs", {
      method: "GET",
    })
    const res = await handler(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual(mockSessions)
    expect(kv.get).toHaveBeenCalledWith("logs:collection")
  })

  it("should return empty array if no sessions in KV", async () => {
    ;(kv.get as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest("http://localhost/api/logs", {
      method: "GET",
    })
    const res = await handler(req)
    const data = await res.json()

    expect(data).toEqual([])
  })
})
