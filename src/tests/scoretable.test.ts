import { ScoreTable } from "../services/scoretable"
import { mockKv } from "./mockkv"
import { logger } from "../utils/logger"

describe("ScoreTable", () => {
  afterEach(async () => {
    await mockKv.flushall()
  })

  it("should add a new high score and like it", async () => {
    const scoreTable = new ScoreTable(mockKv)
    await scoreTable.add("nineball", 100, "user", "some-data")
    const items = await scoreTable.topTen("nineball")
    logger.log(items)
    expect(items).toHaveLength(1)
    const item = items[0]
    expect(item.name).toEqual("user")
    expect(item.score).toEqual(100)
    expect(item.likes).toEqual(0)
    await scoreTable.like("nineball", item.id)
    const likedItem = await scoreTable.getById("nineball", item.id)
    expect(likedItem.likes).toEqual(1)

    // Coverage for get and successful formatReplayUrl
    const replayUrl = await scoreTable.get("nineball", item.id)
    expect(replayUrl).toContain("tailuge.github.io/billiards/dist/")

    // Coverage for likes ?? 0 in topTen and like
    // Manually insert an item without likes field to test ?? 0
    const noLikesItem = {
      name: "no-likes",
      score: 500,
      data: "data",
      id: "no-likes-id"
    }
    await mockKv.zadd!(scoreTable.dbKey("nineball"), { score: 500, member: noLikesItem })

    const itemsWithNoLikes = await scoreTable.topTen("nineball")
    const found = itemsWithNoLikes.find(i => i.id === "no-likes-id")
    expect(found?.likes).toBe(0)

    await scoreTable.like("nineball", "no-likes-id")
    const likedItemNoLikesBefore = await scoreTable.getById("nineball", "no-likes-id")
    expect(likedItemNoLikesBefore.likes).toBe(1)
  })

  it("should handle like for non-existent item", async () => {
    const scoreTable = new ScoreTable(mockKv)
    const likes = await scoreTable.like("nineball", "non-existent")
    expect(likes).toBe(0)
  })

  it("should prevent open redirect in get", async () => {
    const scoreTable = new ScoreTable(mockKv)
    // Test with invalid data (not a string)
    await scoreTable.add("nineball", 50, "user", null)
    const items0 = await scoreTable.topTen("nineball")
    const url0 = await scoreTable.get("nineball", items0[0].id)
    expect(url0).toContain("notfound.html")

    await scoreTable.add("nineball", 100, "user", "//malicious.com")
    const items = await scoreTable.topTen("nineball")
    const id = items[0].id
    const url = await scoreTable.get("nineball", id)
    expect(url).toContain("notfound.html")

    await scoreTable.add("nineball", 200, "user", "https://malicious.com")
    const items2 = await scoreTable.topTen("nineball")
    const id2 = items2[0].id
    const url2 = await scoreTable.get("nineball", id2)
    expect(url2).toContain("notfound.html")
  })
})
