import { MatchResult } from "../types/match"

describe("MatchResult Schema", () => {
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
      ruleType: "snooker",
      timestamp: Date.now(),
    }
    expect(result.winner).toBe("SoloPlayer")
    expect(result.loser).toBeUndefined()
  })

  it("should work without ruleType", () => {
    const result: MatchResult = {
      id: "test-match-id",
      winner: "Player1",
      loser: "Player2",
      winnerScore: 100,
      loserScore: 50,
      timestamp: Date.now(),
    }
    expect(result.winner).toBe("Player1")
    expect(result.ruleType).toBeUndefined()
  })
})
