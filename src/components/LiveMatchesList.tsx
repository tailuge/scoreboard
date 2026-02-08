import React from "react"
import { Table } from "@/types/table"
import { GroupBox } from "./GroupBox"
import { useUser } from "@/contexts/UserContext"
import { GameUrl } from "@/utils/GameUrl"
import { getGameIcon } from "./MatchResultCard"

interface LiveMatchesListProps {
  readonly tables: Table[]
  readonly onSpectate: (tableId: string) => void
}

export function LiveMatchesList({ tables, onSpectate }: LiveMatchesListProps) {
  const { userId, userName } = useUser()
  // Filter for active games: 2 players and started (completed flag set on start)
  const activeGames = tables.filter(
    (t) => t.players.length === 2 && t.completed
  )

  if (activeGames.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <GroupBox title="Live Games">
        <div className="flex flex-col max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {activeGames.map((table) => {
            const formattedTime = new Date(table.createdAt).toLocaleTimeString(
              [],
              {
                hour: "numeric",
              }
            )
            const playerOne = table.players[0]?.name || "Player 1"
            const playerTwo = table.players[1]?.name || "Player 2"
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

            return (
              <button
                type="button"
                key={table.id}
                className="flex w-full items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 py-1 px-2 gap-4 cursor-pointer text-left"
                onClick={handleSpectate}
              >
                <div className="flex items-center gap-1 overflow-hidden">
                  <div className="flex-shrink-0">
                    <span className="text-lg">
                      {getGameIcon(table.ruleType)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-gray-100 truncate text-xs">
                        {playerOne}
                      </span>
                      <span className="text-gray-500 text-[9px] flex-shrink-0">
                        vs
                      </span>
                      <span className="text-gray-400 truncate text-xs">
                        {playerTwo}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-tight">
                      <span>{formattedTime}</span>
                      <span
                        className="inline-flex items-center rounded-sm bg-red-600 text-white uppercase font-semibold tracking-wide leading-none transition-colors hover:bg-red-500 text-[9px] px-1.5 py-0.5"
                        title="Spectate game"
                      >
                        LIVE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-sm" />
              </button>
            )
          })}
        </div>
      </GroupBox>
    </div>
  )
}
