import React from "react"
import { MatchResultCard } from "./MatchResultCard"
import { GroupBox } from "./GroupBox"
import { useUser } from "@/contexts/UserContext"
import { useLobbyTables } from "./hooks/useLobbyTables"
import { LiveTableItem } from "./LiveTableItem"
import { useMatchHistory } from "./hooks/useMatchHistory"

export function RecentGamesList() {
  const { userId, userName } = useUser()
  const { tables, tableAction } = useLobbyTables(userId, userName)
  const { results: historyResults, isLoading: loadingHistory } =
    useMatchHistory()

  const handleSpectate = async (tableId: string) => {
    await tableAction(tableId, "spectate")
  }

  const liveMatches = tables.filter(
    (t) => t.players.length === 2 && !t.completed
  )

  const renderContent = () => {
    if (
      loadingHistory &&
      liveMatches.length === 0 &&
      historyResults.length === 0
    ) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm animate-pulse font-mono-data">
          Loading games...
        </div>
      )
    }
    if (liveMatches.length === 0 && historyResults.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm italic font-mono-data">
          No active or recent games.
        </div>
      )
    }
    return (
      <>
        {liveMatches.map((table) => (
          <LiveTableItem
            key={`live-${table.id}`}
            table={table}
            onSpectate={handleSpectate}
          />
        ))}
        {historyResults.map((result) => (
          <MatchResultCard key={`hist-${result.id}`} result={result} />
        ))}
      </>
    )
  }

  return (
    <GroupBox title="Recent Games">
      <div className="flex flex-col min-h-[100px] max-h-[170px] overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </GroupBox>
  )
}
