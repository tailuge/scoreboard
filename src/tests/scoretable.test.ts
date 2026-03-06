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
