import { kv, VercelKV } from "@vercel/kv"
import { Table } from "@/types/table"
import { RuleType } from "@/utils/gameTypes"

import { NchanPub } from "@/nchan/nchanpub"
import type { LobbyMessage } from "@/nchan/types"
import { Player } from "@/types/player"
import { getUID } from "@/utils/uid"
import { logger } from "@/utils/logger"

const KEY = "tables"
const TABLE_TIMEOUT = 60 * 1000 // 1 minute
const MULTIPLAYER_TIMEOUT_FACTOR = 10
const TABLE_NOT_FOUND_ERROR = "Table not found"

export class TableService {
  constructor(
    private readonly store: VercelKV | Partial<VercelKV> = kv,
    private readonly notify: (event: any) => Promise<void> = this.defaultNotify
  ) {}

  private isTableExpired(table: Table, now: number): boolean {
    const timeout =
      table.players.length > 1
        ? TABLE_TIMEOUT * MULTIPLAYER_TIMEOUT_FACTOR
        : TABLE_TIMEOUT
    return now - table.lastUsedAt > timeout
  }

  private cleanupExpiredTables(expiredKeys: string[]): void {
    if (expiredKeys.length > 0) {
      // Background cleanup of expired tables
      this.store.hdel(KEY, ...expiredKeys).catch((err) => {
        logger.error("Failed to delete expired tables:", err)
      })
      logger.log(`Found ${expiredKeys.length} expired tables.`)
    }
  }

  async getTables() {
    const allTables =
      (await this.store.hgetall<Record<string, Table>>(KEY)) || {}
    const now = Date.now()
    const expiredKeys: string[] = []
    const activeTables: Table[] = []

    for (const [id, table] of Object.entries(allTables)) {
      if (this.isTableExpired(table, now)) {
        expiredKeys.push(id)
      } else {
        activeTables.push(table)
      }
    }

    this.cleanupExpiredTables(expiredKeys)

    return activeTables.sort((a, b) => b.createdAt - a.createdAt)
  }

  async expireTables() {
    // This method is now used mostly for side-effect cleanup
    const tables = await this.store.hgetall<Record<string, Table>>(KEY)
    const now = Date.now()
    const expiredKeys = Object.entries(tables || {})
      .filter(([, table]) => this.isTableExpired(table, now))
      .map(([key]) => key)

    if (expiredKeys.length > 0) {
      await this.store.hdel(KEY, ...expiredKeys)
      logger.log(`Expired ${expiredKeys.length} tables.`)
    }
    return expiredKeys.length
  }

  async createTable(userId: string, userName: string, ruleType: RuleType) {
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

  async deleteTable(tableId: string, userId: string) {
    const table = await this.store.hget<Table>(KEY, tableId)
    if (!table) return false

    // Only creator can delete if they are the only one, or maybe just allow it for one-player tables
    if (table.creator.id === userId && table.players.length === 1) {
      await this.store.hdel(KEY, tableId)
      await this.notify({ action: "delete" })
      return true
    }
    return false
  }

  async findPendingTable(ruleType: RuleType): Promise<Table | null> {
    const tables = await this.store.hgetall<Record<string, Table>>(KEY)
    if (!tables) return null

    const pending = Object.values(tables).find(
      (table) =>
        table.ruleType === ruleType &&
        table.players.length === 1 &&
        !table.completed
    )

    return pending || null
  }

  async findOrCreate(
    userId: string,
    userName: string,
    ruleType: RuleType
  ): Promise<Table> {
    const pending = await this.findPendingTable(ruleType)
    if (pending) {
      return this.joinTable(pending.id, userId, userName)
    } else {
      return this.createTable(userId, userName, ruleType)
    }
  }

  async defaultNotify(event: Omit<LobbyMessage, "messageType">) {
    await new NchanPub("lobby").publishLobby(event)
  }
}
