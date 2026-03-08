import { NextRequest } from "next/server"
import handler from "@/pages/api/client-error"
import { kv } from "@vercel/kv"

jest.mock("@vercel/kv", () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

describe("client-error API handler", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return 405 for non-POST requests", async () => {
    const req = new NextRequest("http://localhost/api/client-error", {
      method: "GET",
    })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })

  it("should process and store logs", async () => {
    const logs = [
      { sid: "s1", type: "error", message: "msg1", ts: 1000 },
      { sid: "s1", type: "warn", message: "msg2", ts: 2000 },
    ]
    // Use a real Request if NextRequest is problematic, or just mock what's needed
    const req = {
      method: "POST",
      json: async () => logs,
      headers: {
        get: (name: string) => {
          const h: any = {
            "user-agent": "test-ua",
            "x-vercel-id": "sfo1::test",
            "x-vercel-ip-city": "San Francisco",
            "x-vercel-ip-country": "US",
          }
          return h[name.toLowerCase()]
        },
      },
    } as unknown as NextRequest

    ;(kv.get as jest.Mock).mockResolvedValue([])

    const res = await handler(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(kv.set).toHaveBeenCalledWith(
      "logs:collection",
      expect.arrayContaining([
        expect.objectContaining({
          sid: "s1",
          ua: "test-ua",
          city: "San Francisco",
          country: "US",
          region: "sfo1",
          logs: expect.arrayContaining([
            expect.objectContaining({ message: "msg1", city: "San Francisco" }),
          ]),
        }),
      ]),
      expect.any(Object)
    )
  })

  it("should update existing sessions", async () => {
    const existingSession = {
      sid: "s1",
      ua: "old-ua",
      ts: 500,
      logs: [{ message: "old-log", ts: 500 }],
    }
    const logs = [{ sid: "s1", type: "error", message: "new-log", ts: 1000 }]
    const req = {
      method: "POST",
      json: async () => logs,
      headers: {
        get: () => null,
      },
    } as unknown as NextRequest

    ;(kv.get as jest.Mock).mockResolvedValue([existingSession])

    await handler(req)

    expect(kv.set).toHaveBeenCalledWith(
      "logs:collection",
      expect.arrayContaining([
        expect.objectContaining({
          sid: "s1",
          logs: expect.arrayContaining([
            expect.objectContaining({ message: "old-log" }),
            expect.objectContaining({ message: "new-log" }),
          ]),
        }),
      ]),
      expect.any(Object)
    )
  })

  it("should return 400 for non-array body", async () => {
    const req = {
      method: "POST",
      json: async () => ({ not: "an array" }),
      headers: {
        get: () => null,
      },
    } as unknown as NextRequest

    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it("should handle JSON parsing errors gracefully", async () => {
    const req = {
      method: "POST",
      json: async () => {
        throw new Error("Invalid JSON")
      },
      headers: {
        get: () => null,
      },
    } as unknown as NextRequest

    const res = await handler(req)
    expect(res.status).toBe(200) // The code has a catch-all that returns ok: true
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})
