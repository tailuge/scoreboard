import React, { memo, useState, useEffect, useMemo } from "react"
import { MatchResult, getRuleType } from "@/types/match"
import BallIcon from "./BallIcon"
import { PlayerMatchDisplay } from "./PlayerMatchDisplay"
import { LocationTimeBadge } from "./LocationTimeBadge"
import { formatTimeAgo } from "@/utils/timeago"

interface MatchResultCardProps {
  readonly result: MatchResult
  readonly compact?: boolean
  readonly isLive?: boolean
  readonly onClick?: () => void
}

interface IconConfig {
  readonly number?: number
  readonly solidColor?: "red" | "yellow"
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 180
  }
  return hash - 90
}

function getIconConfig(result: MatchResult): IconConfig {
  const ruleType = getRuleType(result)

  if (ruleType === "nineball") {
    const ballNumber = (Math.abs(result.timestamp) % 15) + 1
    return { number: ballNumber }
  }

  if (ruleType === "snooker") {
    return { solidColor: "red" }
  }

  if (ruleType === "threecushion") {
    return { solidColor: "yellow" }
  }

  return { number: 8 }
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
  const iconSize = compact ? 16 : 20
  const iconClassName = compact ? "w-4 h-4" : "w-5 h-5"
  const iconConfig = useMemo(() => getIconConfig(result), [result])
  const initialRotation = useMemo(
    () => hashString(`${result.id}:${result.timestamp}`),
    [result.id, result.timestamp]
  )

  const content = (
    <>
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex-shrink-0">
          <div
            className="transition-transform duration-700 ease-out hover:scale-110"
            style={{ transform: `rotate(${initialRotation}deg)` }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "rotate(0deg)"
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = `rotate(${initialRotation}deg)`
            }}
          >
            <BallIcon
              number={iconConfig.number}
              solidColor={iconConfig.solidColor}
              size={iconSize}
              className={iconClassName}
            />
          </div>
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
        className={`stagger-item flex w-full items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer text-left ${padding} gap-4`}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={`stagger-item flex items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 ${padding} gap-4`}
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
