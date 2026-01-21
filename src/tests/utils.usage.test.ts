import { markUsage, markUsageFromServer } from "@/utils/usage"
import { UsageService } from "@/services/usageservice"

jest.mock("@/services/usageservice")

describe("Usage Utils", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("markUsage", () => {
    it("should call the usage API with the correct metric", () => {
      global.fetch = jest.fn()
      markUsage("test-metric")
      expect(global.fetch).toHaveBeenCalledWith("/api/usage/test-metric", {
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

      await markUsageFromServer("test-metric")
      expect(UsageService).toHaveBeenCalledWith("test-metric")
      expect(mockIncrementCount).toHaveBeenCalled()
    })
  })
})
