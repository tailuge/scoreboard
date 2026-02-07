import { kv, VercelKV } from "@vercel/kv"
import { MatchResult } from "../types/match"

const KEY = "match_results"
const HISTORY_LIMIT = 50
export const MATCH_REPLAY_KEY_PREFIX = "match_replay:"

export const getMatchReplayKey = (matchId: string): string =>
  `${MATCH_REPLAY_KEY_PREFIX}${matchId}`

export class MatchResultService {
  constructor(private readonly store: VercelKV | Partial<VercelKV> = kv) {}

  /**
   * Adds a match result to the rolling history.
   * Uses a sorted set where the score is the timestamp.
   */
  async addMatchResult(
    result: MatchResult,
    replayData?: string
  ): Promise<void> {
    if (replayData) {
      await this.store.set(getMatchReplayKey(result.id), replayData)
      result.hasReplay = true
    }

    // Add to sorted set
    await this.store.zadd(KEY, {
      score: result.timestamp,
      member: result,
    })

    // Identify matches that are about to be evicted from the sorted set (beyond the 50 limit).
    // zrange(0, -(HISTORY_LIMIT + 1)) returns members that will be removed by zremrangebyrank(0, -(HISTORY_LIMIT + 1))
    const toEvict = await this.store.zrange<MatchResult[]>(
      KEY,
      0,
      -(HISTORY_LIMIT + 1)
    )

    if (toEvict.length > 0) {
      const keysToDelete = toEvict.map((r) => getMatchReplayKey(r.id))
      if (this.store.del) {
        await this.store.del(...keysToDelete)
      }
    }

    // Trim to HISTORY_LIMIT (remove older entries)
    await this.store.zremrangebyrank(KEY, 0, -(HISTORY_LIMIT + 1))
  }

  /**
   * Retrieves the match history, sorted by latest first.
   */
  async getMatchResults(
    limit: number = HISTORY_LIMIT,
    gameType?: string
  ): Promise<MatchResult[]> {
    // Optimization: if no gameType filter, only fetch the requested limit from Redis
    const fetchLimit = gameType ? -1 : limit - 1
    const results = await this.store.zrange<MatchResult[]>(KEY, 0, fetchLimit, {
      rev: true,
    })

    const filtered = gameType
      ? results.filter((r) => r.gameType === gameType)
      : results

    // Even if we fetched with limit, we slice here for consistency
    return filtered.slice(0, limit)
  }
}
