import React from "react"
import { MatchResultCard } from "./MatchResultCard"
import { GroupBox } from "./GroupBox"
import { LiveTableItem } from "./LiveTableItem"
import { useMatchHistory } from "./hooks/useMatchHistory"
import type { ActiveGame } from "@tailuge/messaging"
import { MatchResult } from "@/types/match"

interface MatchHistoryListProps {
  readonly liveGames?: ActiveGame[]
  readonly tablesLoading?: boolean
  readonly initialData?: MatchResult[]
}

export function MatchHistoryList({
  liveGames = [],
  tablesLoading,
  initialData,
}: MatchHistoryListProps) {
  const { results: fetchedResults, isLoading } = useMatchHistory(
    30000,
    !!initialData
  )
  const results = initialData ?? fetchedResults

  const activeGames = liveGames.filter((game) => game.players.length === 2)

  const renderContent = () => {
    const hasLiveGames = activeGames.length > 0
    const hasHistory = results.length > 0

    if ((tablesLoading || isLoading) && results.length === 0 && !hasLiveGames) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm animate-pulse">
          Loading match history...
        </div>
      )
    }

    if (!tablesLoading && !isLoading && !hasLiveGames && !hasHistory) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm italic">
          No matches recorded yet.
        </div>
      )
    }

    return (
      <>
        {activeGames.map((game) => (
          <LiveTableItem key={game.tableId} game={game} />
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
