import React from "react"
import LeaderboardTable from "./LeaderboardTable"
import { GAME_TYPES } from "@/config"
import { useAllLeaderboards } from "./hooks/useAllLeaderboards"
import { LeaderboardItem } from "@/types/leaderboard"

interface HighscoreGridProps {
  heightClass?: string
  className?: string
  initialData?: Record<string, LeaderboardItem[]>
}

export function HighscoreGrid({
  heightClass = "h-[78px] w-[142px]",
  className = "",
  initialData,
}: Readonly<HighscoreGridProps>) {
  const { data } = useAllLeaderboards(initialData)

  return (
    <div
      className={`grid grid-cols-3 gap-3 w-full justify-items-center ${className}`}
    >
      {GAME_TYPES.map((game) => (
        <div key={game.ruleType} className="flex flex-col gap-0">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest text-center mb-0">
            {game.name}
          </div>
          <div className={`overflow-hidden ${heightClass}`}>
            <LeaderboardTable
              ruleType={game.ruleType}
              limit={3}
              initialData={data[game.ruleType]}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
