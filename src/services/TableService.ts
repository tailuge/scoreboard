import { kv, VercelKV } from "@vercel/kv"
import { Table } from "@/types/table"

import { NchanPub } from "@/nchan/nchanpub"
import { Player } from "@/types/player"
import { getUID } from "@/utils/uid"
import { logger } from "@/utils/logger"

const KEY = "tables"
const TABLE_TIMEOUT = 60 * 1000 // 1 minute
const TABLE_NOT_FOUND_ERROR = "Table not found"

export class TableService {
  constructor(
    private readonly store: VercelKV | Partial<VercelKV> = kv,
    private readonly notify: (event: any) => Promise<void> = this.defaultNotify
  ) {}

  async getTables() {
    const allTables =
      (await this.store.hgetall<Record<string, Table>>(KEY)) || {}
    const now = Date.now()
    const expiredKeys: string[] = []
    const activeTables: Table[] = []

    for (const [id, table] of Object.entries(allTables)) {
      const timeout =
        table.players.length > 1 ? TABLE_TIMEOUT * 10 : TABLE_TIMEOUT
      if (now - table.lastUsedAt > timeout) {
        expiredKeys.push(id)
      } else {
        activeTables.push(table)
      }
    }

    if (expiredKeys.length > 0) {
      // Background cleanup of expired tables
      this.store.hdel(KEY, ...expiredKeys).catch((err) => {
        logger.error("Failed to delete expired tables:", err)
      })
      logger.log(`Found ${expiredKeys.length} expired tables.`)
    }

    return activeTables.sort((a, b) => b.createdAt - a.createdAt)
  }

  async expireTables() {
    // This method is now used mostly for side-effect cleanup
    const tables = await this.store.hgetall<Record<string, Table>>(KEY)
    const expiredEntries = Object.entries(tables || {}).filter(
      ([, table]) =>
        Date.now() - table.lastUsedAt >
        (table.players.length > 1 ? TABLE_TIMEOUT * 10 : TABLE_TIMEOUT)
    )
    if (expiredEntries.length > 0) {
      const keysToDelete = expiredEntries.map(([key]) => key)
      await this.store.hdel(KEY, ...keysToDelete)
      logger.log(`Expired ${expiredEntries.length} tables.`)
    }
    return expiredEntries.length
  }

  async createTable(userId: string, userName: string, ruleType: string) {
    const tableId = getUID()
    const creator: Player = { id: userId, name: userName || "Anonymous" }

    const newTable: Table = {
      id: tableId,
      creator,
      players: [creator],
      spectators: [],
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      isActive: true,
      ruleType,
      completed: false,
    }

    await this.store.hset(KEY, { [tableId]: newTable })
    await this.notify({ action: "create" })
    return newTable
  }

  async joinTable(tableId: string, userId: string, userName: string) {
    await this.expireTables()

    const table = await this.store.hget<Table>(KEY, tableId)
    if (!table) {
      await this.notify({ action: "expired table" })
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }

    if (table.players.length >= 2) {
      throw new Error("Table is full")
    }

    const player: Player = { id: userId, name: userName || "Anonymous" }
    table.players.push(player)
    table.lastUsedAt = Date.now()

    await this.store.hset(KEY, { [tableId]: table })
    await this.notify({ action: "join" })
    return table
  }

  async spectateTable(tableId: string, userId: string, userName: string) {
    const table = await this.store.hget<Table>(KEY, tableId)

    if (!table) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }

    const spectator: Player = { id: userId, name: userName || "Anonymous" }
    table.spectators.push(spectator)
    table.lastUsedAt = Date.now()

    await this.store.hset(KEY, { [tableId]: table })
    await this.notify({ action: "spectate" })
    return table
  }

  async completeTable(tableId: string) {
    const table = await this.store.hget<Table>(KEY, tableId)

    if (!table) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }

    table.lastUsedAt = Date.now()
    table.completed = true
    await this.store.hset(KEY, { [tableId]: table })
    await this.notify({ action: "complete" })
    return table
  }

  async findPendingTable(gameType: string): Promise<Table | null> {
    const tables = await this.store.hgetall<Record<string, Table>>(KEY)
    if (!tables) return null

    const pending = Object.values(tables).find(
      (table) =>
        table.ruleType === gameType &&
        table.players.length === 1 &&
        !table.completed
    )

    return pending || null
  }

  async findOrCreate(
    userId: string,
    userName: string,
    gameType: string
  ): Promise<Table> {
    const pending = await this.findPendingTable(gameType)
    if (pending) {
      return this.joinTable(pending.id, userId, userName)
    } else {
      return this.createTable(userId, userName, gameType)
    }
  }

  async defaultNotify(event: any) {
    await new NchanPub("lobby").post(event)
  }
}
