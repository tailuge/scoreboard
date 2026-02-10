import React, { memo, useState, useEffect } from "react"
import Image from "next/image"
import { MatchResult, getRuleType } from "@/types/match"
import { getGameIcon } from "@/utils/game"
import { PlayerMatchDisplay } from "./PlayerMatchDisplay"
import { LocationTimeBadge } from "./LocationTimeBadge"
import { formatTimeAgo } from "@/utils/timeago"

interface MatchResultCardProps {
  readonly result: MatchResult
  readonly compact?: boolean
  readonly isLive?: boolean
  readonly onClick?: () => void
}

function MatchResultCardComponent({
  result,
  compact = false,
  isLive = false,
  onClick,
}: MatchResultCardProps) {
  const [formattedTime, setFormattedTime] = useState<string>("")

  useEffect(() => {
    setFormattedTime(formatTimeAgo(result.timestamp))
  }, [result.timestamp])

  const displayTime =
    formattedTime ||
    new Date(result.timestamp).toLocaleTimeString([], {
      hour: "numeric",
    })

  const padding = compact ? "px-1 py-0.5" : "py-1 px-2"

  const content = (
    <>
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex-shrink-0">
          <Image
            src={getGameIcon(getRuleType(result))}
            alt=""
            width={compact ? 16 : 20}
            height={compact ? 16 : 20}
            className={compact ? "w-4 h-4" : "w-5 h-5"}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <PlayerMatchDisplay
              winner={result.winner}
              winnerScore={result.winnerScore}
              loser={result.loser}
              loserScore={result.loserScore}
              compact={compact}
            />
          </div>
        </div>
      </div>
      <LocationTimeBadge
        locationCity={result.locationCity}
        locationCountry={result.locationCountry}
        formattedTime={displayTime}
        hasReplay={result.hasReplay}
        matchId={result.id}
        compact={compact}
        isLive={isLive}
      />
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer text-left ${padding} gap-4`}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={`flex items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 ${padding} gap-4`}
    >
      {content}
    </div>
  )
}

export const MatchResultCard = memo(MatchResultCardComponent, (prev, next) => {
  return (
    prev.result.id === next.result.id &&
    prev.compact === next.compact &&
    prev.isLive === next.isLive &&
    prev.onClick === next.onClick
  )
})

export default MatchResultCard
