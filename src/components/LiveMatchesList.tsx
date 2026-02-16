import React from "react"
import { Table } from "@/types/table"
import { MatchResult } from "@/types/match"
import { GroupBox } from "./GroupBox"
import { MatchResultCard } from "./MatchResultCard"
import { useUser } from "@/contexts/UserContext"
import { GameUrl } from "@/utils/GameUrl"

interface LiveMatchesListProps {
  readonly tables: Table[]
  readonly onSpectate: (tableId: string) => void
}

export function LiveMatchesList({ tables, onSpectate }: LiveMatchesListProps) {
  const { userId, userName } = useUser()
  const activeGames = tables.filter(
    (t) => t.players.length === 2 && !t.completed
  )

  return (
    <div className="mb-4">
      <GroupBox title="Live Games">
        <div className="flex flex-col min-h-[40px] max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {activeGames.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-xs italic">
              No live games at the moment.
            </div>
          ) : (
            activeGames.map((table) => {
              const handleSpectate = () => {
                onSpectate(table.id)
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
            })
          )}
        </div>
      </GroupBox>
    </div>
  )
}
