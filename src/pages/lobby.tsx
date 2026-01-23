import { useEffect, useState, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { TableList } from "@/components/tablelist"
import { CreateTable } from "@/components/createtable"
import { PlayModal } from "@/components/PlayModal"
import { ServerStatus } from "@/components/ServerStatus/ServerStatus"
import { User } from "@/components/User"
import Head from "next/head"
import { Table } from "@/types/table"
import { NchanSub } from "@/nchan/nchansub"
import { Star } from "@/components/Star"
import { markUsage } from "@/utils/usage"
import { useServerStatus } from "@/components/hooks/useServerStatus"
import { getUID } from "@/utils/uid"

export default function Lobby() {
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const statusPage = "https://billiards-network.onrender.com/basic_status"
  const hasHandledAutoJoin = useRef(false)
  const [modalTable, setModalTable] = useState<{
    id: string
    ruleType: string
  } | null>(null)

  const fetchTables = async () => {
    const res = await fetch("/api/tables")
    const data = await res.json()
    setTables(data)
    setIsLoading(false)
  }

  useServerStatus(statusPage)

  useEffect(() => {
    markUsage("lobby")
    const storedUserId = getUID()

    const urlUserName = searchParams.get("username")
    const storedUserName =
      urlUserName || localStorage.getItem("userName") || "Anonymous"

    setUserId(storedUserId)
    setUserName(storedUserName)
    localStorage.setItem("userId", storedUserId)
    localStorage.setItem("userName", storedUserName)

    fetchTables()
    const client = new NchanSub("lobby", (e) => {
      try {
        if (JSON.parse(e)?.action === "connected") {
          return
        }
      } catch (err) {
        // Not JSON, continue to fetchTables
      }
      fetchTables()
    })
    client.start()
    return () => client.stop()
  }, [searchParams])

  const tableAction = async (tableId: string, action: "join" | "spectate") => {
    const response = await fetch(`/api/tables/${tableId}/${action}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userName }),
    })
    fetchTables()
    return response.status === 200
  }

  const handleJoin = useCallback(
    async (tableId: string) => {
      const success = await tableAction(tableId, "join")
      if (success) {
        const table = tables.find((t) => t.id === tableId)
        if (table && !table.completed) {
          setModalTable({ id: table.id, ruleType: table.ruleType })
        }
      }
      return success
    },
    [tables, tableAction]
  )

  const handleSpectate = async (tableId: string) => {
    return tableAction(tableId, "spectate")
  }

  const handleCreate = () => {
    fetchTables()
  }

  const createTable = useCallback(
    async (ruleType: string) => {
      await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName, ruleType }),
      })
      fetchTables()
    },
    [userId, userName]
  )

  useEffect(() => {
    if (isLoading || hasHandledAutoJoin.current || !userId || !userName) return

    const action = searchParams.get("action")
    const gameType = searchParams.get("gameType")

    if (action === "join" && gameType) {
      hasHandledAutoJoin.current = true
      const existingTable = tables.find((t) => t.ruleType === gameType)

      if (existingTable) {
        handleJoin(existingTable.id)
      } else {
        createTable(gameType)
      }
    }
  }, [
    isLoading,
    tables,
    searchParams,
    userId,
    userName,
    createTable,
    handleJoin,
  ])

  useEffect(() => {
    tables.forEach((table) => {
      if (
        table.creator.id === userId &&
        table.players.length === 2 &&
        !table.completed
      ) {
        setModalTable({ id: table.id, ruleType: table.ruleType })
      }
    })
  }, [tables, userId])

  const handleUserNameChange = (newUserName: string) => {
    setUserName(newUserName)
    localStorage.setItem("userName", newUserName)
  }

  return (
    <main className="lobby-container">
      <Head>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="lobby-header">
        <div className="lobby-header-group">
          <CreateTable
            userId={userId}
            userName={userName}
            onCreate={handleCreate}
          />
        </div>
        <div className="lobby-header-group">
          <User
            userName={userName}
            userId={userId}
            onUserNameChange={handleUserNameChange}
          />
          <Star />
          <ServerStatus statusPage={statusPage} />
        </div>
      </div>
      <TableList
        userId={userId}
        userName={userName}
        onJoin={handleJoin}
        onSpectate={handleSpectate}
        tables={tables}
      />
      <PlayModal
        isOpen={!!modalTable}
        onClose={() => setModalTable(null)}
        tableId={modalTable?.id || ""}
        userName={userName}
        userId={userId}
        ruleType={modalTable?.ruleType || "nineball"}
      />
    </main>
  )
}
