import { mockKv } from "./mockkv"

import { UsageService } from "@/services/usageservice"

describe("UsageService", () => {
  let usageService: UsageService

  beforeAll(() => {
    usageService = new UsageService("testUsage")
  })

  afterEach(async () => {
    await mockKv.flushall()
  })

  it("should add and get stats for a day", async () => {
    await usageService.incrementCount(Date.now())
    await usageService.incrementCount(Date.now())
    await usageService.incrementCount(Date.now() - 24 * 60 * 60 * 1000)

    const results = await usageService.getAllCounts()

    expect(results).toHaveLength(4)
  })
})
