import React from "react"
import { MatchResult } from "@/types/match"

interface MatchResultCardProps {
  readonly result: MatchResult
  readonly compact?: boolean
}

export function MatchResultCard({
  result,
  compact = false,
}: MatchResultCardProps) {
  const formattedTime = new Date(result.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div
      className={`flex items-center justify-between transition-colors border-b border-gray-800 hover:bg-gray-800/30 ${compact ? "px-1 py-0.5" : "p-2"} gap-4`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex-shrink-0">
          <span className={compact ? "scale-75 origin-left inline-block" : "text-xl"}>
            🏆
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold text-gray-200 truncate ${compact ? "text-[11px]" : "text-sm"}`}
            >
              {result.winner}
            </span>
            {result.loser && (
              <>
                <span className="text-gray-500 text-[10px]">vs</span>
                <span
                  className={`text-gray-400 truncate ${compact ? "text-[11px]" : "text-sm"}`}
                >
                  {result.loser}
                </span>
              </>
            )}
          </div>
          <div
            className={`text-[9px] text-gray-500 uppercase tracking-tight ${compact ? "hidden" : ""}`}
          >
            {result.gameType} • {formattedTime}
          </div>
          {compact && (
            <div className="text-[8px] text-gray-500/70 uppercase tracking-tight">
              {formattedTime}
            </div>
          )}
        </div>
      </div>
      <div
        className={`flex items-center gap-1.5 font-mono ${compact ? "text-[11px]" : "text-sm"}`}
      >
        <span className="text-green-400/80 font-bold">{result.winnerScore}</span>
        {result.loserScore !== undefined && (
          <>
            <span className="text-gray-600">-</span>
            <span className="text-gray-500">{result.loserScore}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default MatchResultCard
