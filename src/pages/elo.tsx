import React from "react"
import type { GetServerSideProps } from "next"
import Link from "next/link"
import { GroupBox } from "@/components/GroupBox"
import { GAME_TYPES } from "@/config"
import type { PlayerEntry } from "@/services/PlayerRatingStore"

import { kv } from "@vercel/kv"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"

type GameElo = {
  name: string
  ruleType: string
  players: PlayerEntry[]
}

export const getServerSideProps: GetServerSideProps = async () => {
  const store = new PlayerRatingStore(kv)
  const ruleTypes = GAME_TYPES.map((g) => g.ruleType)
  const batchResults = await store.getTopNBatch(
    ruleTypes as unknown as string[],
    20
  )

  const results = GAME_TYPES.map((g) => {
    const players = batchResults[g.ruleType] ?? []
    const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating)
    return { name: g.name, ruleType: g.ruleType, players: sortedPlayers }
  })

  return { props: { games: results } }
}

export default function EloPage({ games }: { games: GameElo[] }) {
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-sans text-gray-100">
      <h1 className="text-4xl font-light text-center mb-2 text-gray-200 tracking-wider">
        ELO Ratings
      </h1>
      <p className="text-center text-gray-400 text-sm mb-8">
        Glicko-2 · Score = rating − 2×RD
      </p>

      <div className="flex flex-wrap justify-center gap-6 items-start max-w-7xl mx-auto">
        {games.map((g) => (
          <div
            key={g.ruleType}
            className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]"
          >
            <GroupBox title={g.name}>
              {g.players.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">
                  No data yet
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-1 w-6">#</th>
                      <th className="text-left py-1">Player</th>
                      <th className="text-right py-1">Rating</th>
                      <th className="text-right py-1">w/l</th>
                      <th className="text-right py-1">Games</th>
                      <th className="text-right py-1">Score</th>
                      <th className="text-right py-1">RD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.players.map((p, i) => (
                      <tr key={p.name} className="border-b border-gray-800">
                        <td className="py-1 text-gray-500">{i + 1}</td>
                        <td className="py-1 truncate max-w-[120px]">
                          <Link
                            href={`/player/${encodeURIComponent(p.name)}?ruleType=${g.ruleType}`}
                            className="hover:text-blue-400 transition-colors"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-1 text-right font-mono">
                          {p.rating}
                        </td>
                        <td className="py-1 text-right whitespace-nowrap">
                          <span className="text-green-400">{p.wins}</span>
                          <span className="text-gray-500 mx-0.5">/</span>
                          <span className="text-red-400">{p.losses}</span>
                        </td>
                        <td className="py-1 text-right text-gray-300">
                          {p.gamesPlayed}
                        </td>
                        <td className="py-1 text-right font-mono text-yellow-400">
                          {p.conservativeRating}
                        </td>
                        <td className="py-1 text-right font-mono text-gray-400">
                          {p.rd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GroupBox>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/game"
          className="inline-block px-4 py-1 text-gray-200 no-underline rounded-lg transition-colors hover:text-white"
          style={{
            color: "rgba(220, 230, 255, 0.9)",
            backdropFilter: "blur(10px) saturate(100%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            background: "rgba(7, 27, 7, 0.724)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
          }}
        >
          Back to Lobby
        </Link>
      </div>
    </div>
  )
}
