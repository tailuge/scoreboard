import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { TableList } from "@/components/tablelist"
import { CreateTable } from "@/components/createtable"
import { ServerStatus } from "@/components/ServerStatus/ServerStatus"
import { User } from "@/components/User"
import Head from "next/head"
import { Table } from "@/services/table"
import { NchanSub } from "@/nchan/nchansub"
import { Title } from "@/components/Title"
import { markUsage } from "@/utils/usage"
import { useServerStatus } from "@/components/hooks/useServerStatus"
import { getUID } from "@/utils/uid"

export default function Lobby() {
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [tables, setTables] = useState<Table[]>([])
  const searchParams = useSearchParams()
  const statusPage = "https://billiards-network.onrender.com/basic_status"

  const fetchTables = async () => {
    const res = await fetch("/api/tables")
    const data = await res.json()
    setTables(data)
  }

  const { fetchActiveUsers } = useServerStatus(statusPage)

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
      if (JSON.parse(e)?.action === "connected") {
        fetchActiveUsers()
        return
      }
      fetchTables()
    })
    client.start()
    return () => client.stop()
  }, [searchParams, fetchActiveUsers])

  const tableAction = async (tableId: string, action: "join" | "spectate") => {
    const response = await fetch(`/api/tables/${tableId}/${action}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, userName }),
    })
    fetchTables()
    return response.status === 200
  }

  const handleJoin = async (tableId: string) => {
    return tableAction(tableId, "join")
  }

  const handleSpectate = async (tableId: string) => {
    return tableAction(tableId, "spectate")
  }

  const handleCreate = () => {
    fetchTables()
  }

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
          <Title />
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
    </main>
  )
}
