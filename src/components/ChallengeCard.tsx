import React from "react"
import { GAME_TYPES } from "@/config"

type ChallengeCardProps = {
  readonly opponentName?: string
  readonly onSelectRule: (ruleType: string) => void
  readonly onCancel: () => void
}

export function ChallengeCard({
  opponentName,
  onSelectRule,
  onCancel,
}: ChallengeCardProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-cyan-500/40 bg-gray-800/80 p-6 text-center shadow-xl animate-in fade-in zoom-in duration-300">
      <h3 className="text-xl font-bold text-white mb-4">
        Challenge {opponentName || "Player"}
      </h3>
      <p className="text-sm text-gray-300 mb-6">Select game rules:</p>
      <div className="grid grid-cols-1 gap-3">
        {GAME_TYPES.map((game) => (
          <button
            key={game.ruleType}
            onClick={() => onSelectRule(game.ruleType)}
            aria-label={`Play ${game.ruleType}`}
            className="w-full rounded-lg bg-cyan-600 px-4 py-3 font-bold text-white transition hover:bg-cyan-500 active:scale-95"
          >
            {game.name}
          </button>
        ))}
        <button
          onClick={onCancel}
          aria-label="Cancel challenge"
          className="mt-2 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
