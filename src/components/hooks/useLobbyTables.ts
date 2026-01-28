import { useState, useCallback, useEffect } from "react"
import { Table } from "@/types/table"
import { useLobbyContext } from "@/contexts/LobbyContext"

export function useLobbyTables(
  userId: string | null,
  userName: string | null,
  enableSubscription: boolean = true
) {
  const { lastMessage } = useLobbyContext()
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/tables")
      if (!res.ok) throw new Error("Failed to fetch tables")
      const data = await res.json()
      setTables(data)
    } catch (error) {
      console.error("Error fetching tables:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  useEffect(() => {
    if (!enableSubscription || !lastMessage) return

    if (lastMessage.action === "connected") {
      return
    }
    fetchTables()
  }, [fetchTables, enableSubscription, lastMessage])

  const tableAction = useCallback(
    async (tableId: string, action: "join" | "spectate"): Promise<Table | null> => {
      if (!userId || !userName) return null
      try {
        const response = await fetch(`/api/tables/${tableId}/${action}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userName }),
        })
        if (response.ok) {
          const updatedTable = await response.json()
          fetchTables()
          return updatedTable
        }
        return null
      } catch (error) {
        console.error(`Error performing ${action} on table:`, error)
        return null
      }
    },
    [userId, userName, fetchTables]
  )

  const createTable = useCallback(
    async (ruleType: string) => {
      if (!userId || !userName) return false
      try {
        const response = await fetch("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userName, ruleType }),
        })
        if (!response.ok) throw new Error("Failed to create table")
        fetchTables()
        return true
      } catch (error) {
        console.error("Error creating table:", error)
        return false
      }
    },
    [userId, userName, fetchTables]
  )

  return {
    tables,
    isLoading,
    fetchTables,
    tableAction,
    createTable,
  }
}
