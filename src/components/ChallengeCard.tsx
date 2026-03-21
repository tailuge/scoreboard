import React from "react"
import { GAME_TYPES } from "@/config"
import type { RematchParam } from "@/utils/GameUrl"

type ChallengeCardProps = {
  readonly opponentName?: string
  readonly rematchParam?: RematchParam | null
  readonly onSelectRule: (ruleType: string) => void
  readonly onCancel: () => void
}

export function ChallengeCard({
  opponentName,
  rematchParam,
  onSelectRule,
  onCancel,
}: ChallengeCardProps) {
  const isRematch = !!rematchParam

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-cyan-500/40 bg-gray-800/80 p-6 text-center shadow-xl animate-in fade-in zoom-in duration-300">
      <h3 className="text-xl font-bold text-white mb-4">
        {isRematch ? "Send Rematch" : `Challenge ${opponentName || "Player"}`}
      </h3>

      {rematchParam && (
        <div className="mb-6 rounded-lg bg-gray-900/50 p-3">
          <p className="text-xs uppercase tracking-wider text-cyan-400/80 mb-2">
            Last Match Scores
          </p>
          <div className="flex items-center justify-around text-white">
            {rematchParam.lastScores.map((score, idx) => (
              <div key={score.userId} className="flex flex-col items-center">
                <span className="text-sm font-medium">
                  {score.userId === rematchParam.opponentId
                    ? rematchParam.opponentName
                    : "You"}
                </span>
                <span className="text-2xl font-bold">{score.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-300 mb-6">
        {isRematch ? "Send rematch with rules:" : "Select game rules:"}
      </p>
      <div className="grid grid-cols-1 gap-3">
        {GAME_TYPES.filter(
          (game) => !isRematch || game.ruleType === rematchParam.ruleType
        ).map((game) => (
          <button
            key={game.ruleType}
            onClick={() => onSelectRule(game.ruleType)}
            aria-label={isRematch ? "Send Rematch" : `Play ${game.ruleType}`}
            className={`w-full rounded-lg px-4 py-3 font-bold text-white transition active:scale-95 ${
              isRematch
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-cyan-600 hover:bg-cyan-500"
            }`}
          >
            {isRematch ? "Send Rematch" : game.name}
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
