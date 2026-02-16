import React from "react"
import { Table } from "@/types/table"
import { MatchResult } from "@/types/match"
import { MatchResultCard } from "./MatchResultCard"
import { GameUrl } from "@/utils/GameUrl"
import { useUser } from "@/contexts/UserContext"

interface LiveTableItemProps {
  readonly table: Table
  readonly onSpectate?: (tableId: string) => void
}

export function LiveTableItem({ table, onSpectate }: LiveTableItemProps) {
  const { userId, userName } = useUser()

  const handleSpectateClick = () => {
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
      onClick={handleSpectateClick}
    />
  )
}
