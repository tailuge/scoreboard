import handler from "@/pages/api/tables/[tableId]"
import { kv } from "@vercel/kv"
import { NextRequest } from "next/server"
import { Table } from "@/types/table"

jest.mock("@vercel/kv")

const tableIdNotFound = "table-not-found"
describe("GET /api/tables/[tableId]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.Response.json = jest.fn().mockReturnValue(new Response())
  })

  it("should return a table if it exists", async () => {
    const mockTable: Table = {
      id: "table-1",
      game: "billiards",
      creator: { id: "user-1", name: "Player 1" },
      players: [],
      state: "open",
      created: 123,
      rules: { type: "eightball" },
    }
    jest.spyOn(kv, "hget").mockResolvedValue(mockTable)

    const req = { method: "GET" } as NextRequest
    await handler(req, { params: { tableId: "table-1" } })

    expect(kv.hget).toHaveBeenCalledWith("tables", "table-1")
    expect(Response.json).toHaveBeenCalledWith(mockTable)
  })

  it("should return 404 if the table does not exist", async () => {
    jest.spyOn(kv, "hget").mockResolvedValue(null)

    const req = { method: "GET" } as NextRequest
    await handler(req, { params: { tableId: tableIdNotFound } })

    expect(kv.hget).toHaveBeenCalledWith("tables", tableIdNotFound)
    expect(Response.json).toHaveBeenCalledWith(
      { error: "Table not found" },
      { status: 404 }
    )
  })
})

describe("DELETE /api/tables/[tableId]", () => {
  const mockTable: Table = {
    id: "table-1",
    game: "billiards",
    creator: { id: "user-1", name: "Player 1" },
    players: [],
    state: "open",
    created: 123,
    rules: { type: "eightball" },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.Response.json = jest.fn().mockReturnValue(new Response())
  })

  it("should delete a table if the user is the creator", async () => {
    jest.spyOn(kv, "hget").mockResolvedValue(mockTable)
    jest.spyOn(kv, "hdel").mockResolvedValue(1)

    const req = {
      method: "DELETE",
      json: async () => ({ userId: "user-1" }),
    } as unknown as NextRequest

    await handler(req, { params: { tableId: "table-1" } })

    expect(kv.hget).toHaveBeenCalledWith("tables", "table-1")
    expect(kv.hdel).toHaveBeenCalledWith("tables", "table-1")
    expect(Response.json).toHaveBeenCalledWith({ success: true })
  })

  it("should return 403 if the user is not the creator", async () => {
    jest.spyOn(kv, "hget").mockResolvedValue(mockTable)

    const req = {
      method: "DELETE",
      json: async () => ({ userId: "user-2" }),
    } as unknown as NextRequest

    await handler(req, { params: { tableId: "table-1" } })

    expect(kv.hget).toHaveBeenCalledWith("tables", "table-1")
    expect(kv.hdel).not.toHaveBeenCalled()
    expect(Response.json).toHaveBeenCalledWith(
      { error: "Unauthorized" },
      { status: 403 }
    )
  })

  it("should return 404 if the table does not exist", async () => {
    jest.spyOn(kv, "hget").mockResolvedValue(null)

    const req = {
      method: "DELETE",
      json: async () => ({ userId: "user-1" }),
    } as unknown as NextRequest

    await handler(req, { params: { tableId: tableIdNotFound } })

    expect(kv.hget).toHaveBeenCalledWith("tables", tableIdNotFound)
    expect(kv.hdel).not.toHaveBeenCalled()
    expect(Response.json).toHaveBeenCalledWith(
      { error: "Table not found" },
      { status: 404 }
    )
  })
})
