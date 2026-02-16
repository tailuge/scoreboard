import React from "react"
import { Table } from "@/types/table"
import { GroupBox } from "./GroupBox"
import { LiveTableItem } from "./LiveTableItem"

interface LiveMatchesListProps {
  readonly tables: Table[]
  readonly onSpectate: (tableId: string) => void
}

export function LiveMatchesList({ tables, onSpectate }: LiveMatchesListProps) {
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
            activeGames.map((table) => (
              <LiveTableItem
                key={table.id}
                table={table}
                onSpectate={onSpectate}
              />
            ))
          )}
        </div>
      </GroupBox>
    </div>
  )
}
