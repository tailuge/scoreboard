import { ScoreTable } from "../services/scoretable"
import { mockKv } from "./mockkv"
import { logger } from "../utils/logger"

describe("ScoreTable", () => {
  afterEach(async () => {
    await mockKv.flushall()
  })

  it("should add a new high score and like it", async () => {
    const scoreTable = new ScoreTable(mockKv)
    await scoreTable.add("nineball", 100, "user", { some: "data" })
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
  })

  it("should retain 40 sagu scores but only 10 for other rule types", async () => {
    const scoreTable = new ScoreTable(mockKv)

    for (let score = 1; score <= 45; score++) {
      await scoreTable.add("sagu", score, `sagu-${score}`, { score })
      await scoreTable.add("nineball", score, `nineball-${score}`, { score })
    }

    const sagu = await mockKv.zrange(scoreTable.dbKey("sagu"), 0, -1)
    const nineball = await mockKv.zrange(scoreTable.dbKey("nineball"), 0, -1)

    expect(sagu).toHaveLength(40)
    expect(nineball).toHaveLength(10)
    // Reads match retention: sagu returns all 40 kept entries, others 10.
    expect(await scoreTable.topTen("sagu")).toHaveLength(40)
    expect(await scoreTable.topTen("nineball")).toHaveLength(10)
  })

  it("should throw error for invalid ruletype", async () => {
    const scoreTable = new ScoreTable(mockKv)
    await expect(
      scoreTable.add("invalid" as any, 100, "user", {})
    ).rejects.toThrow("Invalid ruletype")
    await expect(scoreTable.topTen("invalid" as any)).rejects.toThrow(
      "Invalid ruletype"
    )
    await expect(scoreTable.getById("invalid" as any, "id")).rejects.toThrow(
      "Invalid ruletype"
    )
    await expect(scoreTable.like("invalid" as any, "id")).rejects.toThrow(
      "Invalid ruletype"
    )
    await expect(scoreTable.get("invalid" as any, "id")).rejects.toThrow(
      "Invalid ruletype"
    )
  })
})
