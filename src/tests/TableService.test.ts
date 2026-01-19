import { Table } from "@/services/table"
import { TableService } from "../services/TableService"
import { mockKv } from "./mockkv"

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
    tableService = new TableService(undefined, (_) => Promise.resolve())
  })

  afterEach(async () => {
    await mockKv.flushall()
  })

  const userId = "user1"
  const userName = "luke"
  const ruleType = "nineball"

  it("should create a new table", async () => {
    const newTable = await tableService.createTable(userId, userName, ruleType)
    expect(newTable).toHaveProperty("id")
    const tables = await tableService.getTables()
    expect(tables).toHaveLength(1)
  })

  it("should expire old tables", async () => {
    const oldTable = makeTable(Date.now() - 61 * 1000, "oldId")
    const currentTable = makeTable(Date.now(), "newId")
    await mockKv.hset("tables", { [oldTable.id]: oldTable })
    await mockKv.hset("tables", { [currentTable.id]: currentTable })
    const tables = await tableService.getTables()
    expect(tables).toHaveLength(1)
    expect(tables[0].id).toBe(currentTable.id)
  })

  describe("joinTable", () => {
    it("should allow a second player to join", async () => {
      const table = await tableService.createTable("u1", "user1", "rule")
      const updated = await tableService.joinTable(table.id, "u2", "user2")
      expect(updated.players).toHaveLength(2)
      expect(updated.players[1].id).toBe("u2")
    })

    it("should fail if table is full (already has 2 players)", async () => {
      const table = await tableService.createTable("u1", "user1", "rule")
      await tableService.joinTable(table.id, "u2", "user2")
      await expect(tableService.joinTable(table.id, "u3", "user3"))
        .rejects.toThrow("Table is full")
    })

    it("should fail if table does not exist", async () => {
      await expect(tableService.joinTable("missing", "u2", "user2"))
        .rejects.toThrow("Table not found")
    })
  })

  describe("spectateTable", () => {
    it("should allow spectators to join", async () => {
      const table = await tableService.createTable("u1", "user1", "rule")
      const updated = await tableService.spectateTable(table.id, "u3", "spec1")
      expect(updated.spectators).toHaveLength(1)
      expect(updated.spectators[0].id).toBe("u3")
    })

    it("should fail if table does not exist", async () => {
      await expect(tableService.spectateTable("missing", "u3", "spec1"))
        .rejects.toThrow("Table not found")
    })
  })

  describe("completeTable", () => {
    it("should mark table as completed", async () => {
      const table = await tableService.createTable("u1", "user1", "rule")
      const updated = await tableService.completeTable(table.id)
      expect(updated.completed).toBe(true)
    })

    it("should fail if table does not exist", async () => {
      await expect(tableService.completeTable("missing"))
        .rejects.toThrow("Table not found")
    })
  })
})
