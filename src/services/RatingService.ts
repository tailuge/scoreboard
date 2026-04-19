import { Glicko2 } from "glicko2.ts"

export type PlayerRating = {
  rating: number
  rd: number
  volatility: number
  lastUpdated: number
  gamesPlayed: number
}

export const DEFAULT_RATING: PlayerRating = {
  rating: 1500,
  rd: 350,
  volatility: 0.06,
  lastUpdated: 0,
  gamesPlayed: 0,
}

const C = 50 // inactivity tuning constant

export function applyInactivity(player: PlayerRating): PlayerRating {
  const daysInactive = (Date.now() - player.lastUpdated) / 86_400_000
  const newRd = Math.min(Math.sqrt(player.rd ** 2 + C ** 2 * daysInactive), 350)
  return { ...player, rd: newRd }
}

const glicko = new Glicko2({ tau: 0.5, rating: 1500, rd: 350, vol: 0.06 })

export function updateMatchRatings(
  winner: PlayerRating,
  loser: PlayerRating
): [PlayerRating, PlayerRating] {
  const w = applyInactivity(winner)
  const l = applyInactivity(loser)

  const pW = glicko.makePlayer(w.rating, w.rd, w.volatility)
  const pL = glicko.makePlayer(l.rating, l.rd, l.volatility)

  glicko.updateRatings([[pW, pL, 1]])

  const now = Date.now()
  return [
    {
      rating: pW.getRating(),
      rd: pW.getRd(),
      volatility: pW.getVol(),
      lastUpdated: now,
      gamesPlayed: (winner.gamesPlayed ?? 0) + 1,
    },
    {
      rating: pL.getRating(),
      rd: pL.getRd(),
      volatility: pL.getVol(),
      lastUpdated: now,
      gamesPlayed: (loser.gamesPlayed ?? 0) + 1,
    },
  ]
}
