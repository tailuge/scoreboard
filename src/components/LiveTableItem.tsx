import React from "react"
import { MatchResult } from "@/types/match"
import { MatchResultCard } from "./MatchResultCard"
import { GameUrl } from "@/utils/GameUrl"
import { useUser } from "@/contexts/UserContext"
import type { ActiveGame } from "@tailuge/messaging"

interface LiveTableItemProps {
  readonly game: ActiveGame
  readonly onSpectate?: (tableId: string) => void
}

export function LiveTableItem({ game, onSpectate }: LiveTableItemProps) {
  const { userId, userName } = useUser()
  const ruleType = game.ruleType || "nineball"

  const handleSpectateClick = () => {
    onSpectate?.(game.tableId)
    if (!userId || !userName) return
    const spectatorUrl = GameUrl.create({
      tableId: game.tableId,
      userName,
      userId,
      ruleType,
      isSpectator: true,
      isCreator: false,
    })
    globalThis.open(spectatorUrl.toString(), "_blank")
  }

  const virtualResult: MatchResult = {
    id: game.tableId,
    winner: game.players[0]?.name || "Player 1",
    loser: game.players[1]?.name || "Player 2",
    winnerScore: 0,
    loserScore: 0,
    ruleType,
    timestamp: 0,
  }

  return (
    <MatchResultCard
      result={virtualResult}
      isLive
      onClick={handleSpectateClick}
    />
  )
}
