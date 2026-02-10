import { MatchResult, getRuleType } from "../types/match"

describe("MatchResult Schema", () => {
  it("should define a valid MatchResult object with gameType", () => {
    const result: MatchResult = {
      id: "test-match-id",
      winner: "Player1",
      loser: "Player2",
      winnerScore: 100,
      loserScore: 50,
      gameType: "snooker",
      timestamp: Date.now(),
    }
    expect(result.winner).toBe("Player1")
  })

  it("should define a valid MatchResult object with ruleType", () => {
    const result: MatchResult = {
      id: "test-match-id",
      winner: "Player1",
      loser: "Player2",
      winnerScore: 100,
      loserScore: 50,
      ruleType: "snooker",
      timestamp: Date.now(),
    }
    expect(result.winner).toBe("Player1")
  })

  it("should support solo match results (no loser)", () => {
    const result: MatchResult = {
      id: "solo-match-id",
      winner: "SoloPlayer",
      winnerScore: 100,
      gameType: "snooker",
      timestamp: Date.now(),
    }
    expect(result.winner).toBe("SoloPlayer")
    expect(result.loser).toBeUndefined()
  })
})

describe("getRuleType helper", () => {
  it("should return ruleType when present", () => {
    const result: MatchResult = {
      id: "test",
      winner: "P1",
      winnerScore: 10,
      ruleType: "nineball",
      timestamp: Date.now(),
    }
    expect(getRuleType(result)).toBe("nineball")
  })

  it("should fall back to gameType when ruleType is missing", () => {
    const result: MatchResult = {
      id: "test",
      winner: "P1",
      winnerScore: 10,
      gameType: "snooker",
      timestamp: Date.now(),
    }
    expect(getRuleType(result)).toBe("snooker")
  })

  it("should prefer ruleType over gameType", () => {
    const result: MatchResult = {
      id: "test",
      winner: "P1",
      winnerScore: 10,
      ruleType: "nineball",
      gameType: "snooker",
      timestamp: Date.now(),
    }
    expect(getRuleType(result)).toBe("nineball")
  })

  it("should return unknown when both are missing", () => {
    const result: MatchResult = {
      id: "test",
      winner: "P1",
      winnerScore: 10,
      timestamp: Date.now(),
    }
    expect(getRuleType(result)).toBe("unknown")
  })
})
