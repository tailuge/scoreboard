import { markUsage, markUsageFromServer } from "@/utils/usage"
import { UsageService } from "@/services/usageservice"

jest.mock("@/services/usageservice")

describe("Usage Utils", () => {
  const testMetric = "test-metric"
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("markUsage", () => {
    it("should call the usage API with the correct metric", () => {
      global.fetch = jest.fn()
      markUsage(testMetric)
      expect(global.fetch).toHaveBeenCalledWith(`/api/usage/${testMetric}`, {
        method: "PUT",
      })
    })
  })

  describe("markUsageFromServer", () => {
    it("should call the UsageService with the correct metric", async () => {
      const mockIncrementCount = jest.fn()
      ;(UsageService as jest.Mock).mockImplementation(() => {
        return {
          incrementCount: mockIncrementCount,
        }
      })

      await markUsageFromServer(testMetric)
      expect(UsageService).toHaveBeenCalledWith(testMetric)
      expect(mockIncrementCount).toHaveBeenCalled()
    })
  })
})
