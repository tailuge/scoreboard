import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/router"
import { TableList } from "@/components/tablelist"
import { CreateTable } from "@/components/createtable"
import { MatchHistoryList } from "@/components/MatchHistoryList"
import { PlayModal } from "@/components/PlayModal"
import { User } from "@/components/User"
import { GroupBox } from "@/components/GroupBox"
import { OnlineCount } from "@/components/OnlineCount"
import { useServerStatus } from "@/components/hooks/useServerStatus"
import Head from "next/head"
import { Star } from "@/components/Star"
import { markUsage } from "@/utils/usage"
import { STATUS_PAGE_URL } from "@/utils/constants"
import { useUser } from "@/contexts/UserContext"
import { useLobbyTables } from "@/components/hooks/useLobbyTables"
import { useAutoJoin } from "@/components/hooks/useAutoJoin"

export default function Lobby() {
  const { userId, userName } = useUser()
  const router = useRouter()
  const { tables, isLoading, fetchTables, tableAction, createTable } =
    useLobbyTables(userId, userName)
  const [modalTable, setModalTable] = useState<{
    id: string
    ruleType: string
  } | null>(null)
  const shownModals = useRef<Set<string>>(new Set())
  const { activeUsers } = useServerStatus(STATUS_PAGE_URL)

  useEffect(() => {
    if (!router.isReady) return
    markUsage("lobby")
  }, [router.isReady])

  const handleJoin = useCallback(
    async (tableId: string) => {
      const updatedTable = await tableAction(tableId, "join")
      if (updatedTable) {
        if (!updatedTable.completed) {
          setModalTable({
            id: updatedTable.id,
            ruleType: updatedTable.ruleType,
          })
          shownModals.current.add(updatedTable.id)
        }
        return true
      }
      return false
    },
    [tableAction]
  )

  const handleSpectate = useCallback(
    async (tableId: string) => {
      await tableAction(tableId, "spectate")
    },
    [tableAction]
  )

  useAutoJoin(
    router,
    isLoading,
    userId,
    userName,
    tables,
    handleJoin,
    createTable
  )

  useEffect(() => {
    tables.forEach((table) => {
      if (
        table.creator.id === userId &&
        table.players.length === 2 &&
        !table.completed &&
        !shownModals.current.has(table.id)
      ) {
        setModalTable({ id: table.id, ruleType: table.ruleType })
        shownModals.current.add(table.id)
      }
    })
  }, [tables, userId])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
      <div className="w-full max-w-6xl mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GroupBox
            title="Lobby"
            leftBadge={<User />}
            rightBadge={
              <div className="flex items-center gap-4">
                <Star />
                {activeUsers !== null && <OnlineCount count={activeUsers} />}
              </div>
            }
          >
            <div className="flex flex-col gap-6">
              <div className="flex justify-start items-center px-2">
                <CreateTable onCreate={fetchTables} />
              </div>
              <TableList
                onJoin={handleJoin}
                onSpectate={handleSpectate}
                tables={tables}
              />
            </div>
          </GroupBox>
        </div>
        <div className="lg:col-span-1">
          <MatchHistoryList />
        </div>
      </div>
      <PlayModal
        isOpen={!!modalTable}
        onClose={() => setModalTable(null)}
        tableId={modalTable?.id || ""}
        ruleType={modalTable?.ruleType || "nineball"}
      />
    </div>
  )
}
