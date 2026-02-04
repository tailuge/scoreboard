import handler from "@/pages/api/tables/[tableId]/index"
import { kv } from "@vercel/kv"
import { NextRequest } from "next/server"

jest.mock("@vercel/kv", () => ({
  kv: {
    hget: jest.fn(),
    hdel: jest.fn(),
  },
}))

describe("Edge Table API [tableId]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // @ts-ignore
    globalThis.Response = class {
      static json(body: any, init?: any) {
        return {
          status: init?.status || 200,
          json: async () => body,
        }
      }
      constructor(body: any, init?: any) {
        // @ts-ignore
        this.status = init?.status || 200
      }
    }
  })

  it("GET: finds table", async () => {
    const table = { id: "t1" }
    ;(kv.hget as jest.Mock).mockResolvedValue(table)
    const req = { method: "GET" } as NextRequest
    const res = await handler(req, { params: { tableId: "t1" } })
    expect(res.status).toBe(200)
    // @ts-ignore
    expect(await res.json()).toEqual(table)
  })

  it("GET: returns 404 if not found", async () => {
    ;(kv.hget as jest.Mock).mockResolvedValue(null)
    const req = { method: "GET" } as NextRequest
    const res = await handler(req, { params: { tableId: "missing" } })
    expect(res.status).toBe(404)
  })

  it("DELETE: removes table if authorized", async () => {
    const table = { id: "t1", creator: { id: "u1" } }
    ;(kv.hget as jest.Mock).mockResolvedValue(table)
    const req = {
      method: "DELETE",
      json: async () => ({ userId: "u1" }),
    } as unknown as NextRequest
    const res = await handler(req, { params: { tableId: "t1" } })
    expect(res.status).toBe(200)
    expect(kv.hdel).toHaveBeenCalledWith("tables", "t1")
  })

  it("DELETE: returns 403 if unauthorized", async () => {
    const table = { id: "t1", creator: { id: "u1" } }
    ;(kv.hget as jest.Mock).mockResolvedValue(table)
    const req = {
      method: "DELETE",
      json: async () => ({ userId: "other" }),
    } as unknown as NextRequest
    const res = await handler(req, { params: { tableId: "t1" } })
    expect(res.status).toBe(403)
  })
})
