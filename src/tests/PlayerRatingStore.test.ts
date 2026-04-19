import { PlayerRatingStore } from "../services/PlayerRatingStore"
import { DEFAULT_RATING } from "../services/RatingService"
import { mockKv } from "./mockkv"

describe("PlayerRatingStore", () => {
  let store: PlayerRatingStore

  beforeEach(async () => {
    await mockKv.flushall()
    store = new PlayerRatingStore(mockKv as any)
  })

  it("returns default rating for unknown player", async () => {
    const r = await store.getOrCreate("nineball", "Alice")
    expect(r.rating).toBe(DEFAULT_RATING.rating)
    expect(r.rd).toBe(DEFAULT_RATING.rd)
    expect(r.gamesPlayed).toBe(0)
    expect(r.wins).toBe(0)
    expect(r.losses).toBe(0)
  })

  it("saves and retrieves a rating", async () => {
    const rating = {
      rating: 1600,
      rd: 80,
      volatility: 0.06,
      lastUpdated: Date.now(),
      gamesPlayed: 5,
      wins: 3,
      losses: 2,
    }
    await store.save("nineball", "Alice", rating)
    const retrieved = await store.getOrCreate("nineball", "Alice")
    expect(retrieved.rating).toBe(1600)
    expect(retrieved.gamesPlayed).toBe(5)
    expect(retrieved.wins).toBe(3)
    expect(retrieved.losses).toBe(2)
  })

  it("getTopN returns players sorted by conservative rating desc", async () => {
    const now = Date.now()
    await store.save("nineball", "Alice", {
      rating: 1600,
      rd: 50,
      volatility: 0.06,
      lastUpdated: now,
      gamesPlayed: 10,
      wins: 7,
      losses: 3,
    })
    await store.save("nineball", "Bob", {
      rating: 1700,
      rd: 200,
      volatility: 0.06,
      lastUpdated: now,
      gamesPlayed: 3,
      wins: 2,
      losses: 1,
    })
    await store.save("nineball", "Carol", {
      rating: 1550,
      rd: 30,
      volatility: 0.06,
      lastUpdated: now,
      gamesPlayed: 20,
      wins: 15,
      losses: 5,
    })

    const top = await store.getTopN("nineball", 10)
    // Alice: 1600 - 100 = 1500, Bob: 1700 - 400 = 1300, Carol: 1550 - 60 = 1490
    expect(top[0].name).toBe("Alice")
    expect(top[1].name).toBe("Carol")
    expect(top[2].name).toBe("Bob")
  })

  it("getTopN returns empty array when no data", async () => {
    const top = await store.getTopN("nineball", 10)
    expect(top).toEqual([])
  })

  it("getTopN respects limit", async () => {
    const now = Date.now()
    for (let i = 0; i < 5; i++) {
      await store.save("nineball", `Player${i}`, {
        rating: 1500 + i * 10,
        rd: 50,
        volatility: 0.06,
        lastUpdated: now,
        gamesPlayed: i,
        wins: i,
        losses: 0,
      })
    }
    const top = await store.getTopN("nineball", 3)
    expect(top).toHaveLength(3)
  })
})
