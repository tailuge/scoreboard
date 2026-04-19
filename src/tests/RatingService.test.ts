import {
  DEFAULT_RATING,
  PlayerRating,
  applyInactivity,
  updateMatchRatings,
} from "../services/RatingService"

describe("applyInactivity", () => {
  it("does not increase RD for brand-new player (lastUpdated=0 is far past)", () => {
    const result = applyInactivity({
      ...DEFAULT_RATING,
      lastUpdated: Date.now(),
    })
    expect(result.rd).toBeCloseTo(DEFAULT_RATING.rd, 1)
  })

  it("increases RD for inactive player", () => {
    const old = {
      ...DEFAULT_RATING,
      rd: 100,
      lastUpdated: Date.now() - 30 * 86_400_000,
    }
    const result = applyInactivity(old)
    expect(result.rd).toBeGreaterThan(100)
  })

  it("caps RD at 350", () => {
    const veryOld = { ...DEFAULT_RATING, rd: 100, lastUpdated: 0 }
    const result = applyInactivity(veryOld)
    expect(result.rd).toBe(350)
  })
})

describe("updateMatchRatings", () => {
  it("winner gains rating, loser loses rating", () => {
    const w = { ...DEFAULT_RATING, lastUpdated: Date.now() }
    const l = { ...DEFAULT_RATING, lastUpdated: Date.now() }
    const [newW, newL] = updateMatchRatings(w, l)
    expect(newW.rating).toBeGreaterThan(DEFAULT_RATING.rating)
    expect(newL.rating).toBeLessThan(DEFAULT_RATING.rating)
  })

  it("increments gamesPlayed for both players", () => {
    const w = { ...DEFAULT_RATING, lastUpdated: Date.now(), gamesPlayed: 3 }
    const l = { ...DEFAULT_RATING, lastUpdated: Date.now(), gamesPlayed: 5 }
    const [newW, newL] = updateMatchRatings(w, l)
    expect(newW.gamesPlayed).toBe(4)
    expect(newL.gamesPlayed).toBe(6)
  })

  it("increments wins for winner and losses for loser", () => {
    const w = {
      ...DEFAULT_RATING,
      lastUpdated: Date.now(),
      wins: 2,
      losses: 1,
    }
    const l = {
      ...DEFAULT_RATING,
      lastUpdated: Date.now(),
      wins: 1,
      losses: 2,
    }
    const [newW, newL] = updateMatchRatings(w, l)
    expect(newW.wins).toBe(3)
    expect(newW.losses).toBe(1)
    expect(newL.wins).toBe(1)
    expect(newL.losses).toBe(3)
  })

  it("high-RD player changes more than low-RD player", () => {
    const now = Date.now()
    const highRd: PlayerRating = {
      rating: 1500,
      rd: 300,
      volatility: 0.06,
      lastUpdated: now,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
    }
    const lowRd: PlayerRating = {
      rating: 1500,
      rd: 50,
      volatility: 0.06,
      lastUpdated: now,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
    }

    const [newHighW] = updateMatchRatings(highRd, {
      ...DEFAULT_RATING,
      lastUpdated: now,
    })
    const [newLowW] = updateMatchRatings(lowRd, {
      ...DEFAULT_RATING,
      lastUpdated: now,
    })

    expect(newHighW.rating - 1500).toBeGreaterThan(newLowW.rating - 1500)
  })
})
