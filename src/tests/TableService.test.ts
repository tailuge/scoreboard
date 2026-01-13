import { Table } from "@/services/table"
import { TableService } from "../services/TableService"
import { mockKv } from "./mockkv"
import { VercelKV } from "@vercel/kv"

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
    tableService = new TableService(mockKv, (_) =>
      Promise.resolve()
    )
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
})
