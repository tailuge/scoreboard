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
      gameType: "snooker",
      timestamp: Date.now(),
    }

    await service.addMatchResult(result)
    const history = await service.getMatchResults()

    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(result)
  })

  it("should accept replay data without altering the stored result", async () => {
    const result: MatchResult = {
      id: "match-replay",
      winner: "Winner",
      loser: "Loser",
      winnerScore: 100,
      loserScore: 50,
      gameType: "snooker",
      timestamp: Date.now(),
    }

    await service.addMatchResult(result, "replay-data")
    const history = await service.getMatchResults()

    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(result)
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
        gameType: "snooker",
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
      gameType: "snooker",
      timestamp: Date.now(),
    }

    await service.addMatchResult(result)
    const history = await service.getMatchResults()

    expect(history).toHaveLength(1)
    expect(history[0]).toEqual(result)
    expect(history[0].loser).toBeUndefined()
  })

  it("should filter results by gameType", async () => {
    const match1: MatchResult = {
      id: "match1",
      winner: "P1",
      winnerScore: 10,
      gameType: "snooker",
      timestamp: Date.now(),
    }
    const match2: MatchResult = {
      id: "match2",
      winner: "P2",
      winnerScore: 20,
      gameType: "nineball",
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

  it("should respect limit when no gameType is provided", async () => {
    for (let i = 0; i < 10; i++) {
      await service.addMatchResult({
        id: `m${i}`,
        winner: "P",
        winnerScore: 10,
        gameType: "nineball",
        timestamp: Date.now() + i,
      })
    }
    const limited = await service.getMatchResults(5)
    expect(limited).toHaveLength(5)
    expect(limited[0].id).toBe("m9")
  })
})
