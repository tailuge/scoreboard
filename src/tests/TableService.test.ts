import { Table } from "@/types/table"
import { TableService } from "../services/TableService"
import { mockKv } from "./mockkv"
import { NchanPub } from "@/nchan/nchanpub"
import { logger } from "@/utils/logger"

function makeTable(lastUsed: number, tableId: string): Table {
  const newTable: Table = {
    id: tableId,
    creator: { id: "creator01", name: "user01" },
    players: [{ id: "creator01", name: "user01" }],
    spectators: [],
    createdAt: lastUsed,
    lastUsedAt: lastUsed,
    isActive: true,
    ruleType: "nineball",
    completed: false,
  }
  return newTable
}

describe("TableService", () => {
  let tableService: TableService

  beforeAll(() => {
    tableService = new TableService(undefined, () => Promise.resolve())
  })

  afterEach(async () => {
    await mockKv.flushall()
  })

  const userId = "user1"
  const userName = "luke"
  const ruleType = "nineball"
  const TABLE_NOT_FOUND_ERROR = "Table not found"
  const SHOULD_FAIL_IF_TABLE_MISSING = "should fail if table does not exist"

  it("should create a new table", async () => {
    const newTable = await tableService.createTable(userId, userName, ruleType)
    expect(newTable).toHaveProperty("id")
    const tables = await tableService.getTables()
    expect(tables).toHaveLength(1)
  })

  it("should expire old tables in getTables", async () => {
    const oldTable = makeTable(Date.now() - 61 * 1000, "oldId")
    const currentTable = makeTable(Date.now(), "newId")
    await mockKv.hset("tables", { [oldTable.id]: oldTable })
    await mockKv.hset("tables", { [currentTable.id]: currentTable })
    const tables = await tableService.getTables()
    expect(tables).toHaveLength(1)
    expect(tables[0].id).toBe(currentTable.id)
  })

  it("should expire old tables in expireTables", async () => {
    const oldTable = makeTable(Date.now() - 61 * 1000, "oldId")
    await mockKv.hset("tables", { [oldTable.id]: oldTable })
    const expiredCount = await tableService.expireTables()
    expect(expiredCount).toBe(1)
    const tables = await mockKv.hgetall("tables")
    // ioredis-mock returns {} for empty hash, while @vercel/kv might return null
    if (tables !== null) {
      expect(Object.keys(tables)).toHaveLength(0)
    }
  })

  it("should use defaultNotify if no notify function provided", async () => {
    const serviceWithDefaultNotify = new TableService(mockKv as any)
    const publishLobbySpy = jest
      .spyOn(NchanPub.prototype, "publishLobby")
      .mockResolvedValue(undefined)

    await serviceWithDefaultNotify.createTable("u1", "user1", "nineball")

    expect(publishLobbySpy).toHaveBeenCalledWith({ action: "create" })
    publishLobbySpy.mockRestore()
  })

  it("should handle error in background cleanup", async () => {
    const oldTable = makeTable(Date.now() - 61 * 1000, "oldId")
    await mockKv.hset("tables", { [oldTable.id]: oldTable })

    // Force hdel to fail
    const hdelSpy = jest
      .spyOn(tableService["store"], "hdel")
      .mockRejectedValueOnce(new Error("Redis error"))
    const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {})

    await tableService.getTables()

    // Wait for the background catch to execute
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to delete expired tables:",
      expect.any(Error)
    )

    hdelSpy.mockRestore()
    errorSpy.mockRestore()
  })

  describe("joinTable", () => {
    it("should allow a second player to join", async () => {
      const table = await tableService.createTable("u1", "user1", "nineball")
      const updated = await tableService.joinTable(table.id, "u2", "user2")
      expect(updated.players).toHaveLength(2)
      expect(updated.players[1].id).toBe("u2")
    })

    it("should fail if table is full (already has 2 players)", async () => {
      const table = await tableService.createTable("u1", "user1", "nineball")
      await tableService.joinTable(table.id, "u2", "user2")
      await expect(
        tableService.joinTable(table.id, "u3", "user3")
      ).rejects.toThrow("Table is full")
    })

    it(SHOULD_FAIL_IF_TABLE_MISSING, async () => {
      await expect(
        tableService.joinTable("missing", "u2", "user2")
      ).rejects.toThrow(TABLE_NOT_FOUND_ERROR)
    })
  })

  describe("spectateTable", () => {
    it("should allow spectators to join", async () => {
      const table = await tableService.createTable("u1", "user1", "nineball")
      const updated = await tableService.spectateTable(table.id, "u3", "spec1")
      expect(updated.spectators).toHaveLength(1)
      expect(updated.spectators[0].id).toBe("u3")
    })

    it(SHOULD_FAIL_IF_TABLE_MISSING, async () => {
      await expect(
        tableService.spectateTable("missing", "u3", "spec1")
      ).rejects.toThrow(TABLE_NOT_FOUND_ERROR)
    })
  })

  describe("completeTable", () => {
    it("should mark table as completed", async () => {
      const table = await tableService.createTable("u1", "user1", "nineball")
      const updated = await tableService.completeTable(table.id)
      expect(updated.completed).toBe(true)
    })

    it(SHOULD_FAIL_IF_TABLE_MISSING, async () => {
      await expect(tableService.completeTable("missing")).rejects.toThrow(
        TABLE_NOT_FOUND_ERROR
      )
    })
  })

  describe("findPendingTable", () => {
    it("should return null if no tables exist", async () => {
      const pending = await tableService.findPendingTable("nineball")
      expect(pending).toBeNull()
    })

    it("should return null if hgetall returns null", async () => {
      // @ts-expect-error store is Partial and might not have hgetall in type but we know it does or we mock it
      jest.spyOn(tableService.store, "hgetall").mockResolvedValueOnce(null)
      const pending = await tableService.findPendingTable("nineball")
      expect(pending).toBeNull()
    })

    it("should return null if only full tables exist", async () => {
      const table = await tableService.createTable("u1", "user1", "nineball")
      await tableService.joinTable(table.id, "u2", "user2")
      const pending = await tableService.findPendingTable("nineball")
      expect(pending).toBeNull()
    })

    it("should return a table if a valid pending table exists", async () => {
      const table = await tableService.createTable("u1", "user1", "nineball")
      const pending = await tableService.findPendingTable("nineball")
      expect(pending).not.toBeNull()
      expect(pending?.id).toBe(table.id)
    })
  })

  describe("findOrCreate", () => {
    it("should create a new table if none exist", async () => {
      const table = await tableService.findOrCreate("u1", "user1", "nineball")
      expect(table.players).toHaveLength(1)
      expect(table.players[0].id).toBe("u1")
    })

    it("should join an existing table if one is pending", async () => {
      await tableService.createTable("user1", "User 1", "nineball")
      const result = await tableService.findOrCreate(
        "user2",
        "User 2",
        "nineball"
      )
      expect(result.players).toHaveLength(2)
      expect(result.players[1].id).toBe("user2")
    })
  })

  describe("deleteTable", () => {
    it("should delete a table if it has only 1 player and user is creator", async () => {
      const table = await tableService.createTable(
        "user1",
        "User 1",
        "nineball"
      )
      const success = await tableService.deleteTable(table.id, "user1")
      expect(success).toBe(true)
      const tables = await tableService.getTables()
      expect(tables).toHaveLength(0)
    })

    it("should return false if table does not exist", async () => {
      const success = await tableService.deleteTable("non-existent", "user1")
      expect(success).toBe(false)
    })

    it("should return false if user is not creator", async () => {
      const table = await tableService.createTable(
        "user1",
        "User 1",
        "nineball"
      )
      const success = await tableService.deleteTable(table.id, "user2")
      expect(success).toBe(false)
      const tables = await tableService.getTables()
      expect(tables).toHaveLength(1)
    })

    it("should return false if table has 2 players", async () => {
      const table = await tableService.createTable(
        "user1",
        "User 1",
        "nineball"
      )
      await tableService.joinTable(table.id, "user2", "User 2")
      const success = await tableService.deleteTable(table.id, "user1")
      expect(success).toBe(false)
      const tables = await tableService.getTables()
      expect(tables).toHaveLength(1)
    })
  })
})
