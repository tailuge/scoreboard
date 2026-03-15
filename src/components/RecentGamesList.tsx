import React from "react"
import { MatchResultCard } from "./MatchResultCard"
import { GroupBox } from "./GroupBox"
import { LiveTableItem } from "./LiveTableItem"
import { useMatchHistory } from "./hooks/useMatchHistory"
import { useMessaging } from "@/contexts/MessagingContext"

export function RecentGamesList() {
  const { results: historyResults, isLoading: loadingHistory } =
    useMatchHistory()
  const { activeGames } = useMessaging()

  const liveMatches = activeGames.filter((game) => game.players.length === 2)

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
        {liveMatches.map((game) => (
          <LiveTableItem key={`live-${game.tableId}`} game={game} />
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
