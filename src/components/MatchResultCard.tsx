import React from "react"
import { MatchResult } from "@/types/match"
import { TrophyIcon } from "@heroicons/react/24/solid"

interface MatchResultCardProps {
  readonly result: MatchResult
}

export function MatchResultCard({ result }: MatchResultCardProps) {
  const formattedTime = new Date(result.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-700/30 hover:border-gray-600/50 transition-colors gap-4">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex-shrink-0">
          <TrophyIcon className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-200 truncate">
              {result.winner}
            </span>
            <span className="text-gray-500 text-xs">vs</span>
            <span className="text-gray-400 truncate">{result.loser}</span>
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">
            {result.gameType} • {formattedTime}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 font-mono text-sm">
        <span className="text-green-400 font-bold">{result.winnerScore}</span>
        <span className="text-gray-600">-</span>
        <span className="text-gray-400">{result.loserScore}</span>
      </div>
    </div>
  )
}

export default MatchResultCard
