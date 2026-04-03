interface PlayerMatchDisplayProps {
  readonly winner: string
  readonly winnerScore: number
  readonly loser?: string | null
  readonly loserScore?: number | null
  readonly compact: boolean
  readonly isLive?: boolean
}

export function PlayerMatchDisplay({
  winner,
  winnerScore,
  loser,
  loserScore,
  compact,
  isLive,
}: PlayerMatchDisplayProps) {
  if (!loser) {
    return (
      <span
        className={`text-gray-200 truncate ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {winner}
      </span>
    )
  }

  const isClawBreak = winner === "ClawBreak" || loser === "ClawBreak"
  const showTrophy = !isLive && !isClawBreak

  return (
    <>
      <span
        className={`text-gray-200 truncate ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {showTrophy && "🎖️"}{winner}{" "}
        <span className="text-gray-400 font-mono-data">({winnerScore})</span>
      </span>
      <span className="text-gray-400 text-[9px] flex-shrink-0">vs</span>
      <span
        className={`text-gray-300 truncate ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {loser}{" "}
        <span className="text-gray-600 font-mono-data">({loserScore})</span>
      </span>
    </>
  )
}
