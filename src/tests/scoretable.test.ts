import { MockVercelKVAdapter } from "./mockvercelkvadapter"
import { ScoreTable } from "../services/scoretable"

describe("ScoreTable", () => {
  let mockStore: MockVercelKVAdapter

  beforeEach(() => {
    mockStore = new MockVercelKVAdapter()
  })

  afterEach(async () => {
    await mockStore.flushall()
  })

  it("should add a score", async () => {
    const scoreTable = new ScoreTable(mockStore)
    await scoreTable.add("nineball", 100, "testuser", { some: "data" })

    const result = await mockStore.zrange("hiscorenineball", 0, -1)

    mockStore.printMockRedisData()
    console.log(result)
    console.log(result[0])
    console.log(JSON.stringify(result[0]))
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: "testuser",
      score: 100,
      data: { some: "data" },
    })
  })
})
