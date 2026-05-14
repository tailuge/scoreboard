import type { VercelKV } from "@vercel/kv"
import { DEFAULT_RATING, PlayerRating, applyInactivity } from "./RatingService"

export type PlayerEntry = {
  name: string
  rating: number
  rd: number
  conservativeRating: number
  gamesPlayed: number
  wins: number
  losses: number
}

export class PlayerRatingStore {
  constructor(private readonly store: VercelKV | Partial<VercelKV>) {}

  private key(ruleType: string) {
    return `elo:${ruleType}`
  }

  async getOrCreate(ruleType: string, name: string): Promise<PlayerRating> {
    const stored = await this.store.hget<PlayerRating>(this.key(ruleType), name)
    return stored ?? { ...DEFAULT_RATING, lastUpdated: Date.now() }
  }

  async save(
    ruleType: string,
    name: string,
    rating: PlayerRating
  ): Promise<void> {
    const date = new Date().toISOString().split("T")[0]
    await Promise.all([
      this.store.hset(this.key(ruleType), { [name]: rating }),
      this.store.hset(`elo-history:${ruleType}:${name}`, {
        [date]: Math.round(rating.rating),
      }),
    ])
  }

  async getHistory(
    ruleType: string,
    name: string
  ): Promise<Record<string, number>> {
    return (
      (await this.store.hgetall<Record<string, number>>(
        `elo-history:${ruleType}:${name}`
      )) ?? {}
    )
  }

  async getTopN(ruleType: string, n: number): Promise<PlayerEntry[]> {
    const all = await this.store.hgetall<Record<string, PlayerRating>>(
      this.key(ruleType)
    )
    return this.processEntries(all, n)
  }

  async getTopNBatch(
    ruleTypes: string[],
    n: number
  ): Promise<Record<string, PlayerEntry[]>> {
    const p = (this.store as any).pipeline()
    for (const rt of ruleTypes) {
      p.hgetall(this.key(rt))
    }
    const results = await p.exec()

    const response: Record<string, PlayerEntry[]> = {}
    ruleTypes.forEach((rt, i) => {
      response[rt] = this.processEntries(results[i], n)
    })
    return response
  }

  private processEntries(
    all: Record<string, PlayerRating> | null,
    n: number
  ): PlayerEntry[] {
    if (!all) return []

    return Object.entries(all)
      .map(([name, r]) => {
        const decayed = applyInactivity(r)
        return {
          name,
          rating: Math.round(decayed.rating),
          rd: Math.round(decayed.rd),
          conservativeRating: Math.round(decayed.rating - 2 * decayed.rd),
          gamesPlayed: r.gamesPlayed ?? 0,
          wins: r.wins ?? 0,
          losses: r.losses ?? 0,
        }
      })
      .sort((a, b) => b.conservativeRating - a.conservativeRating)
      .slice(0, n)
  }
}
