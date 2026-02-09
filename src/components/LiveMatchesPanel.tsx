import React from "react"
import { LiveMatchesList } from "./LiveMatchesList"
import { MatchHistoryList } from "./MatchHistoryList"
import { useUser } from "@/contexts/UserContext"
import { useLobbyTables } from "./hooks/useLobbyTables"

export function LiveMatchesPanel() {
  const { userId, userName } = useUser()
  const { tables, tableAction } = useLobbyTables(userId, userName)

  const handleSpectate = async (tableId: string) => {
    await tableAction(tableId, "spectate")
  }

  return (
    <>
      <LiveMatchesList tables={tables} onSpectate={handleSpectate} />
      <MatchHistoryList />
    </>
  )
}
