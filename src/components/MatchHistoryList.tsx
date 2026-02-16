import React from "react"
import { Table } from "@/types/table"
import { MatchResultCard } from "./MatchResultCard"
import { GroupBox } from "./GroupBox"
import { LiveTableItem } from "./LiveTableItem"
import { useMatchHistory } from "./hooks/useMatchHistory"

interface MatchHistoryListProps {
  readonly liveTables?: Table[]
  readonly onSpectate?: (tableId: string) => void
}

export function MatchHistoryList({
  liveTables = [],
  onSpectate,
}: MatchHistoryListProps) {
  const { results, isLoading } = useMatchHistory()

  const activeGames = liveTables.filter(
    (t) => t.players.length === 2 && !t.completed
  )

  const renderContent = () => {
    const hasLiveGames = activeGames.length > 0
    const hasHistory = results.length > 0

    if (isLoading && results.length === 0 && !hasLiveGames) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm animate-pulse">
          Loading match history...
        </div>
      )
    }

    if (!hasLiveGames && !hasHistory) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm italic">
          No matches recorded yet.
        </div>
      )
    }

    return (
      <>
        {activeGames.map((table) => (
          <LiveTableItem
            key={table.id}
            table={table}
            onSpectate={onSpectate}
          />
        ))}
        {results.map((result) => (
          <MatchResultCard key={result.id} result={result} />
        ))}
      </>
    )
  }

  return (
    <GroupBox title="Recent Matches">
      <div className="flex flex-col max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
        {renderContent()}
      </div>
    </GroupBox>
  )
}

export default MatchHistoryList
