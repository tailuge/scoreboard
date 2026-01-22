import { kv, VercelKV } from "@vercel/kv"
import { Table } from "@/types/table"

import { NchanPub } from "@/nchan/nchanpub"
import { Player } from "@/types/player"
import { getUID } from "@/utils/uid"

const KEY = "tables"
const TABLE_TIMEOUT = 60 * 1000 // 1 minute
const TABLE_NOT_FOUND_ERROR = "Table not found"

export class TableService {
  constructor(
    private readonly store: VercelKV | Partial<VercelKV> = kv,
    private readonly notify: (event: any) => Promise<void> = this.defaultNotify
  ) {}

  async getTables() {
    await this.expireTables()
    if (typeof this.store.hgetall !== "function") {
      return []
    }
    const tables = await this.store.hgetall<Record<string, Table>>(KEY)
    return Object.values(tables || {}).sort((a, b) => b.createdAt - a.createdAt)
  }

  async expireTables() {
    if (typeof this.store.hgetall !== "function") {
      return 0
    }
    const tables = await this.store.hgetall<Record<string, Table>>(KEY)
    const expiredEntries = Object.entries(tables || {}).filter(
      ([, table]) =>
        Date.now() - table.lastUsedAt >
        (table.players.length > 1 ? TABLE_TIMEOUT * 10 : TABLE_TIMEOUT)
    )
    //delete these tables
    if (expiredEntries.length > 0) {
      // Use hdel to remove multiple fields from the hash
      const keysToDelete = expiredEntries.map(([key, _]) => key)
      if (typeof this.store.hdel === "function") {
        await this.store.hdel(KEY, ...keysToDelete)
      }

      console.log(`Expired ${expiredEntries.length} tables.`)
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
    if (typeof this.store.hset !== "function") {
      throw new Error("Store is not configured correctly")
    }
    await this.store.hset(KEY, { [tableId]: newTable })
    await this.notify({ action: "create" })
    return newTable
  }

  async joinTable(tableId: string, userId: string, userName: string) {
    await this.expireTables()
    if (typeof this.store.hget !== "function") {
      throw new Error("Store is not configured correctly")
    }
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
    if (typeof this.store.hset !== "function") {
      throw new Error("Store is not configured correctly")
    }
    await this.store.hset(KEY, { [tableId]: table })
    await this.notify({ action: "join" })
    return table
  }

  async spectateTable(tableId: string, userId: string, userName: string) {
    if (typeof this.store.hget !== "function") {
      throw new Error("Store is not configured correctly")
    }
    const table = await this.store.hget<Table>(KEY, tableId)

    if (!table) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }

    const spectator: Player = { id: userId, name: userName || "Anonymous" }
    table.spectators.push(spectator)
    table.lastUsedAt = Date.now()
    if (typeof this.store.hset !== "function") {
      throw new Error("Store is not configured correctly")
    }
    await this.store.hset(KEY, { [tableId]: table })
    await this.notify({ action: "spectate" })
    return table
  }

  async completeTable(tableId: string) {
    if (typeof this.store.hget !== "function") {
      throw new Error("Store is not configured correctly")
    }
    const table = await this.store.hget<Table>(KEY, tableId)

    if (!table) {
      throw new Error(TABLE_NOT_FOUND_ERROR)
    }

    table.lastUsedAt = Date.now()
    table.completed = true
    if (typeof this.store.hset !== "function") {
      throw new Error("Store is not configured correctly")
    }
    await this.store.hset(KEY, { [tableId]: table })
    await this.notify({ action: "complete" })
    return table
  }

  async defaultNotify(event: any) {
    await new NchanPub("lobby").post(event)
  }
}
