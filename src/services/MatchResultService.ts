import { kv, VercelKV } from "@vercel/kv"
import { MatchResult } from "../types/match"

const KEY = "match_results"
const HISTORY_LIMIT = 50

export class MatchResultService {
  constructor(private readonly store: VercelKV | Partial<VercelKV> = kv) {}

  /**
   * Adds a match result to the rolling history.
   * Uses a sorted set where the score is the timestamp.
   */
  async addMatchResult(result: MatchResult): Promise<void> {
    // Add to sorted set
    await this.store.zadd(KEY, {
      score: result.timestamp,
      member: result,
    })

    // Trim to HISTORY_LIMIT (remove older entries)
    // zremrangebyrank uses 0-based indices.
    // To keep the latest 50, we remove from 0 to -(HISTORY_LIMIT + 1)
    // Wait, if we want to keep TOP 50, and they are sorted by timestamp (ascending)
    // The highest timestamps are at the end.
    // So we want to remove from the start if count > HISTORY_LIMIT.
    await this.store.zremrangebyrank(KEY, 0, -(HISTORY_LIMIT + 1))
  }

  /**
   * Retrieves the match history, sorted by latest first.
   */
  async getMatchResults(
    limit: number = HISTORY_LIMIT,
    gameType?: string
  ): Promise<MatchResult[]> {
    // zrange with negative indices to get latest (highest scores)
    // -1 is the last element, -limit is the limit-th from the end
    const results = await this.store.zrange<MatchResult[]>(KEY, 0, -1, {
      rev: true,
    })

    const filtered = gameType
      ? results.filter((r) => r.gameType === gameType)
      : results

    return filtered.slice(0, limit)
  }
}
