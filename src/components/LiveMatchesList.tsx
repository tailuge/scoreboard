import React from "react"
import { GroupBox } from "./GroupBox"
import { LiveTableItem } from "./LiveTableItem"
import type { ActiveGame } from "@tailuge/messaging"

interface LiveMatchesListProps {
  readonly games: ActiveGame[]
}

export function LiveMatchesList({ games }: LiveMatchesListProps) {
  const activeGames = games.filter((game) => game.players.length === 2)

  return (
    <div className="mb-4">
      <GroupBox title="Live Games">
        <div className="flex flex-col min-h-[40px] max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
          {activeGames.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-xs italic">
              No live games at the moment.
            </div>
          ) : (
            activeGames.map((game) => (
              <LiveTableItem key={game.tableId} game={game} />
            ))
          )}
        </div>
      </GroupBox>
    </div>
  )
}
