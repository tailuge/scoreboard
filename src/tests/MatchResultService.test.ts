import {
  getMatchReplayKey,
  MatchResultService,
} from "../services/MatchResultService"
import { mockKv } from "./mockkv"
import { MatchResult } from "../types/match"

describe("MatchResultService", () => {
  let service: MatchResultService

  beforeEach(async () => {
    await mockKv.flushall()
    service = new MatchResultService(mockKv as any)
  })

  it("should add a match result and retrieve it", async () => {
    const result: MatchResult = {
      id: "match1",
      winner: "Winner",
      loser: "Loser",
      winnerScore: 100,
      loserScore: 50,
      ruleType: "snooker",
      timestamp: Date.now(),
    }

    await service.addMatchResult(result)
    const history = await service.getMatchResults()

    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(result)
  })

  it("should store replay data separately and set hasReplay flag", async () => {
    const result: MatchResult = {
      id: "match-replay",
      winner: "Winner",
      loser: "Loser",
      winnerScore: 100,
      loserScore: 50,
      ruleType: "snooker",
      timestamp: Date.now(),
    }

    await service.addMatchResult(result, "replay-data")
    const history = await service.getMatchResults()

    expect(history).toHaveLength(1)
    expect(history[0].hasReplay).toBe(true)

    // Verify replay data is stored in a separate key
    const replayKey = getMatchReplayKey("match-replay")
    const storedReplay = await (mockKv as any).get(replayKey)
    expect(storedReplay).toBe("replay-data")
  })

  it("should retrieve replay data using getMatchReplay", async () => {
    const matchId = "match-with-replay"
    const result: MatchResult = {
      id: matchId,
      winner: "Winner",
      winnerScore: 100,
      ruleType: "snooker",
      timestamp: Date.now(),
    }

    await service.addMatchResult(result, "some-blob")
    const replay = await service.getMatchReplay(matchId)
    expect(replay).toBe("some-blob")
  })

  it("should return null if replay data does not exist", async () => {
    const replay = await service.getMatchReplay("non-existent")
    expect(replay).toBeNull()
  })

  it("should cleanup replay data when match is evicted from rolling history", async () => {
    const firstMatchId = "match-to-evict"
    const firstResult: MatchResult = {
      id: firstMatchId,
      winner: "Winner",
      winnerScore: 100,
      ruleType: "snooker",
      timestamp: Date.now(),
    }

    // Add the match with replay data
    await service.addMatchResult(firstResult, "evict-me-replay")
    expect(await (mockKv as any).get(getMatchReplayKey(firstMatchId))).toBe(
      "evict-me-replay"
    )

    // Add 50 more matches to evict the first one (limit is 50)
    for (let i = 0; i < 50; i++) {
      await service.addMatchResult({
        id: `m${i}`,
        winner: "P",
        winnerScore: 10,
        ruleType: "snooker",
        timestamp: Date.now() + 1000 + i,
      })
    }

    const history = await service.getMatchResults()
    expect(history).toHaveLength(50)
    expect(history.find((r) => r.id === firstMatchId)).toBeUndefined()

    // Replay data should be gone
    const storedReplay = await (mockKv as any).get(
      getMatchReplayKey(firstMatchId)
    )
    expect(storedReplay).toBeNull()
  })

  it("should build match replay keys consistently", () => {
    expect(getMatchReplayKey("match123")).toBe("match_replay:match123")
  })

  it("should maintain a rolling history limit", async () => {
    // Add 60 matches when limit is 50
    for (let i = 0; i < 60; i++) {
      const result: MatchResult = {
        id: `match${i}`,
        winner: `Winner${i}`,
        loser: `Loser${i}`,
        winnerScore: 100,
        loserScore: 50,
        ruleType: "snooker",
        timestamp: Date.now() + i, // Ensure distinct timestamps
      }
      await service.addMatchResult(result)
    }

    const history = await service.getMatchResults()
    expect(history).toHaveLength(50)
    // Should be latest matches (59 down to 10)
    expect(history[0].id).toBe("match59")
  })

  it("should support adding and retrieving solo match results", async () => {
    const result: MatchResult = {
      id: "solo-match",
      winner: "SoloPlayer",
      winnerScore: 100,
      ruleType: "snooker",
      timestamp: Date.now(),
    }

    await service.addMatchResult(result)
    const history = await service.getMatchResults()

    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(result)
    expect(history[0].loser).toBeUndefined()
  })

  it("should filter results by ruleType", async () => {
    const match1: MatchResult = {
      id: "match1",
      winner: "P1",
      winnerScore: 10,
      ruleType: "snooker",
      timestamp: Date.now(),
    }
    const match2: MatchResult = {
      id: "match2",
      winner: "P2",
      winnerScore: 20,
      ruleType: "nineball",
      timestamp: Date.now() + 1,
    }

    await service.addMatchResult(match1)
    await service.addMatchResult(match2)

    const snookerOnly = await service.getMatchResults(50, "snooker")
    expect(snookerOnly).toHaveLength(1)
    expect(snookerOnly[0].id).toBe("match1")

    const all = await service.getMatchResults()
    expect(all).toHaveLength(2)
  })

  it("should respect limit when no ruleType is provided", async () => {
    for (let i = 0; i < 10; i++) {
      await service.addMatchResult({
        id: `m${i}`,
        winner: "P",
        winnerScore: 10,
        ruleType: "nineball",
        timestamp: Date.now() + i,
      })
    }
    const limited = await service.getMatchResults(5)
    expect(limited).toHaveLength(5)
    expect(limited[0].id).toBe("m9")
  })
})
