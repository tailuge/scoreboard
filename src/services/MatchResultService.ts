import { kv, VercelKV } from "@vercel/kv"
import { MatchResult, getRuleType } from "../types/match"

const KEY = "match_results"
const HISTORY_LIMIT = 32
const MATCH_REPLAY_KEY_PREFIX = "match_replay:"

/**
 * How long a replay is kept. Replays are only useful while their match is still
 * in the rolling history, so rather than reading the sorted set to find evicted
 * matches and deleting their replays (a read-then-delete on every write), the
 * key is given a TTL and Redis expires it on its own.
 */
export const MATCH_REPLAY_TTL_SECONDS = 5 * 24 * 60 * 60

export const getMatchReplayKey = (matchId: string): string =>
  `${MATCH_REPLAY_KEY_PREFIX}${matchId}`

export class MatchResultService {
  constructor(private readonly store: VercelKV | Partial<VercelKV> = kv) {}

  /**
   * Adds a match result to the rolling history.
   *
   * Uses a sorted set where the score is the timestamp. The replay `set`, the
   * `zadd`, and the trim are queued as a single pipeline: one HTTP round trip
   * instead of the previous read-then-delete eviction dance.
   */
  async addMatchResult(
    result: MatchResult,
    replayData?: string
  ): Promise<void> {
    const pipeline = (this.store as VercelKV).pipeline()

    if (replayData) {
      pipeline.set(getMatchReplayKey(result.id), replayData, {
        ex: MATCH_REPLAY_TTL_SECONDS,
      })
      result.hasReplay = true
    }

    // Add to the sorted set, then trim to the newest HISTORY_LIMIT members.
    await pipeline
      .zadd(KEY, { score: result.timestamp, member: result })
      .zremrangebyrank(KEY, 0, -(HISTORY_LIMIT + 1))
      .exec()
  }

  /**
   * Retrieves the match history, sorted by latest first.
   */
  async getMatchResults(
    limit: number = HISTORY_LIMIT,
    ruleType?: string
  ): Promise<MatchResult[]> {
    const fetchLimit = ruleType ? -1 : limit - 1
    const results = await this.store.zrange<MatchResult[]>(KEY, 0, fetchLimit, {
      rev: true,
    })

    const filtered = ruleType
      ? results.filter((r) => getRuleType(r) === ruleType)
      : results

    return filtered.slice(0, limit)
  }

  /**
   * Retrieves the replay data for a given match ID.
   */
  async getMatchReplay(matchId: string): Promise<string | null> {
    return this.store.get<string>(getMatchReplayKey(matchId))
  }
}
