import React, { memo } from "react"
import { MatchResult } from "@/types/match"

interface MatchResultCardProps {
  readonly result: MatchResult
  readonly compact?: boolean
}

export function getGameIcon(gameType: string): string {
  if (!gameType) return "🎱"
  switch (gameType.toLowerCase()) {
    case "eightball":
      return "🎱"
    case "nineball":
      return "⑨"
    case "snooker":
      return "🔴"
    case "threecushion":
      return "⚪"
    default:
      return "🎱" // Fallback to 8-ball or existing trophy if preferred, but user request implies specific mapping.
  }
}

function MatchResultCardComponent({
  result,
  compact = false,
}: MatchResultCardProps) {
  const formattedTime = new Date(result.timestamp).toLocaleTimeString([], {
    hour: "numeric",
  })

  const locationInfo = [result.locationCity, result.locationCountry]
    .filter(Boolean)
    .join(", ")

  const replayBadge = result.hasReplay ? (
    <a
      href={`/api/match-replay?id=${result.id}`}
      target="_blank"
      rel="noreferrer"
      title="Watch replay"
      className={`inline-flex items-center rounded-sm bg-blue-600 text-white uppercase font-semibold tracking-wide leading-none transition-colors hover:bg-blue-500 ${compact ? "text-[8px] px-1 py-0.5" : "text-[9px] px-1.5 py-0.5"}`}
    >
      REPLAY
    </a>
  ) : null

  return (
    <div
      className={`flex items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 ${compact ? "px-1 py-0.5" : "py-1 px-2"} gap-4`}
    >
      <div className="flex items-center gap-1 overflow-hidden">
        {/* Do not show emoji in 2-player mode to save space for text */}
        <div className="flex-shrink-0">
          <span
            className={
              compact ? "scale-75 origin-left inline-block" : "text-lg"
            }
          >
            {getGameIcon(result.gameType)}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {result.loser ? (
              <>
                <span
                  className={`font-medium text-gray-100 truncate ${compact ? "text-[10px]" : "text-xs"}`}
                >
                  {result.winner}{" "}
                  <span className="text-gray-400 font-normal">
                    ({result.winnerScore})
                  </span>
                </span>
                <span className="text-gray-500 text-[9px] flex-shrink-0">
                  vs
                </span>
                <span
                  className={`text-gray-400 truncate ${compact ? "text-[10px]" : "text-xs"}`}
                >
                  {result.loser}{" "}
                  <span className="text-gray-500">({result.loserScore})</span>
                </span>
              </>
            ) : (
              <span
                className={`text-gray-200 truncate ${compact ? "text-[10px] font-medium" : "text-xs font-semibold"}`}
              >
                {result.winner}
              </span>
            )}
          </div>
          <div
            className={`flex items-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-tight ${compact ? "hidden" : ""}`}
          >
            <span className="truncate">
              {locationInfo ? `${locationInfo} • ` : ""}
              {formattedTime}
            </span>
            {replayBadge}
          </div>
          {compact && (
            <div className="flex items-center gap-1.5 text-[8px] text-gray-500/70 uppercase tracking-tight">
              <span className="truncate">
                {locationInfo && `${locationInfo} • `}
                {formattedTime}
              </span>
              {replayBadge}
            </div>
          )}
        </div>
      </div>
      <div
        className={`flex items-center gap-1.5 font-mono ${compact ? "text-[11px]" : "text-sm"}`}
      >
        {/* Score removed for single player results */}
      </div>
    </div>
  )
}

// Optimization: memoize match result cards as they are rendered in potentially long lists
// and often fetched via polling even if they haven't changed.
export const MatchResultCard = memo(MatchResultCardComponent, (prev, next) => {
  return prev.result.id === next.result.id && prev.compact === next.compact
})

export default MatchResultCard
