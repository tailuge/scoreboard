import React from "react"
import { Table } from "@/types/table"
import { GroupBox } from "./GroupBox"

interface LiveMatchesListProps {
  readonly tables: Table[]
  readonly onSpectate: (tableId: string) => void
}

export function LiveMatchesList({ tables, onSpectate }: LiveMatchesListProps) {
  // Filter for active games: 2 players and not completed
  const activeGames = tables.filter(
    (t) => t.players.length === 2 && !t.completed
  )

  if (activeGames.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <GroupBox title="Live Games">
        <div className="flex flex-col max-h-[200px] overflow-y-auto custom-scrollbar">
          {activeGames.map((table) => {
            const formattedTime = new Date(table.createdAt).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )

            return (
              <div
                key={table.id}
                className="flex items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 p-2 gap-4"
              >
                <div className="flex items-center gap-1 overflow-hidden">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium text-gray-100 truncate text-xs">
                        {table.players[0]?.name || "Player 1"}
                      </span>
                      <span className="text-gray-500 text-[9px] flex-shrink-0">
                        vs
                      </span>
                      <span className="text-gray-400 truncate text-xs">
                        {table.players[1]?.name || "Player 2"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-tight">
                      <span>
                        {table.ruleType} • {formattedTime}
                      </span>
                      <button
                        onClick={() => onSpectate(table.id)}
                        className="inline-flex items-center rounded-sm bg-red-600 text-white uppercase font-semibold tracking-wide leading-none transition-colors hover:bg-red-500 text-[9px] px-1.5 py-0.5 cursor-pointer"
                        title="Spectate game"
                      >
                        LIVE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </GroupBox>
    </div>
  )
}
