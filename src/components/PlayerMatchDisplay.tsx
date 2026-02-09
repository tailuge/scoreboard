interface PlayerMatchDisplayProps {
  readonly winner: string
  readonly winnerScore: number
  readonly loser?: string | null
  readonly loserScore?: number | null
  readonly compact: boolean
}

export function PlayerMatchDisplay({
  winner,
  winnerScore,
  loser,
  loserScore,
  compact,
}: PlayerMatchDisplayProps) {
  if (!loser) {
    return (
      <span
        className={`text-gray-200 truncate ${compact ? "text-[10px] font-medium" : "text-xs font-semibold"}`}
      >
        {winner}
      </span>
    )
  }

  return (
    <>
      <span
        className={`font-medium text-gray-100 truncate ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {winner}{" "}
        <span className="text-gray-400 font-normal">({winnerScore})</span>
      </span>
      <span className="text-gray-500 text-[9px] flex-shrink-0">vs</span>
      <span
        className={`text-gray-400 truncate ${compact ? "text-[10px]" : "text-xs"}`}
      >
        {loser} <span className="text-gray-500">({loserScore})</span>
      </span>
    </>
  )
}
