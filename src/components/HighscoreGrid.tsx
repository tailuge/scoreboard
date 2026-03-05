import React from "react"
import LeaderboardTable from "./LeaderboardTable"

interface HighscoreGridProps {
  heightClass?: string
}

export function HighscoreGrid({ heightClass = "h-[62px]" }: HighscoreGridProps) {
  const games = [
    { name: "Snooker", ruleType: "snooker" },
    { name: "Nine Ball", ruleType: "nineball" },
    { name: "Three Cushion", ruleType: "threecushion" },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {games.map((game) => (
        <div key={game.ruleType} className="flex flex-col gap-1">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest text-center mb-1">
            {game.name}
          </div>
          <div className={`overflow-hidden ${heightClass}`}>
            <LeaderboardTable
              ruleType={game.ruleType}
              limit={3}
              compact={true}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
