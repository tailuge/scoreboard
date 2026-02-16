import React, { useEffect, useState } from "react"
import { MatchResult } from "@/types/match"
import { Table } from "@/types/table"
import { MatchResultCard } from "./MatchResultCard"
import { GroupBox } from "./GroupBox"
import { logger } from "@/utils/logger"
import { GameUrl } from "@/utils/GameUrl"
import { useUser } from "@/contexts/UserContext"

interface MatchHistoryListProps {
  readonly liveTables?: Table[]
  readonly onSpectate?: (tableId: string) => void
}

export function MatchHistoryList({
  liveTables = [],
  onSpectate,
}: MatchHistoryListProps) {
  const { userId, userName } = useUser()
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/match-results")
      if (!response.ok) throw new Error("Failed to fetch match history")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      logger.log("Error fetching match history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
    const interval = setInterval(fetchResults, 30000)
    return () => clearInterval(interval)
  }, [])

  const activeGames = liveTables.filter(
    (t) => t.players.length === 2 && t.completed
  )

  const renderContent = () => {
    const hasLiveGames = activeGames.length > 0
    const hasHistory = results.length > 0

    if (loading && results.length === 0 && !hasLiveGames) {
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
        {activeGames.map((table) => {
          const handleSpectate = () => {
            onSpectate?.(table.id)
            if (!userId || !userName) return
            const spectatorUrl = GameUrl.create({
              tableId: table.id,
              userName,
              userId,
              ruleType: table.ruleType,
              isSpectator: true,
              isCreator: false,
            })
            globalThis.open(spectatorUrl.toString(), "_blank")
          }

          const virtualResult: MatchResult = {
            id: table.id,
            winner: table.players[0]?.name || "Player 1",
            loser: table.players[1]?.name || "Player 2",
            winnerScore: 0,
            loserScore: 0,
            ruleType: table.ruleType,
            timestamp: table.createdAt,
          }

          return (
            <MatchResultCard
              key={table.id}
              result={virtualResult}
              isLive
              onClick={handleSpectate}
            />
          )
        })}
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
