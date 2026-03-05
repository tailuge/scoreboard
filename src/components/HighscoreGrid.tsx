import React from "react";
import LeaderboardTable from "./LeaderboardTable";

interface HighscoreGridProps {
  heightClass?: string;
  className?: string;
}

export function HighscoreGrid({
  heightClass = "h-[72px]",
  className = "",
}: HighscoreGridProps) {
  const games = [
    { name: "Snooker", ruleType: "snooker" },
    { name: "Nine Ball", ruleType: "nineball" },
    { name: "Three Cushion", ruleType: "threecushion" },
  ];

  return (
    <div className={`grid grid-cols-3 gap-3 w-full ${className}`}>
      {games.map((game) => (
        <div key={game.ruleType} className="flex flex-col gap-0">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest text-center mb-0">
            {game.name}
          </div>
          <div className={`overflow-hidden ${heightClass}`}>
            <LeaderboardTable ruleType={game.ruleType} limit={3} />
          </div>
        </div>
      ))}
    </div>
  );
}
