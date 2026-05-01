import { renderHook, waitFor } from "@testing-library/react"
import { useLeaderboard } from "@/components/hooks/useLeaderboard"
import { useAllLeaderboards } from "@/components/hooks/useAllLeaderboards"
import { mockFetchResponse } from "./testUtils"

describe("Rank hooks optimization", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.fetch = jest.fn().mockImplementation(() => mockFetchResponse([]))
  })

  describe("useLeaderboard", () => {
    it("fetches data when initialData is missing", async () => {
      renderHook(() => useLeaderboard("snooker"))
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/rank?ruletype=snooker"),
          expect.any(Object)
        )
      })
    })

    it("fetches data when initialData is empty", async () => {
      renderHook(() => useLeaderboard("snooker", []))
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled()
      })
    })

    it("skips fetching when initialData is provided", async () => {
      const initialData = [{ id: "1", name: "Player", score: 100, likes: 0 }]
      renderHook(() => useLeaderboard("snooker", initialData))

      // Wait a bit to ensure no fetch is triggered
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it("fetches if ruleType changes after mount even with initialData", async () => {
      const initialData = [{ id: "1", name: "Player", score: 100, likes: 0 }]
      const { rerender } = renderHook(
        ({ ruleType }) => useLeaderboard(ruleType, initialData),
        {
          initialProps: { ruleType: "snooker" },
        }
      )

      expect(globalThis.fetch).not.toHaveBeenCalled()

      rerender({ ruleType: "nineball" })

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("ruletype=nineball"),
          expect.any(Object)
        )
      })
    })
  })

  describe("useAllLeaderboards", () => {
    it("fetches data when initialData is missing", async () => {
      renderHook(() => useAllLeaderboards())
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/rank?ruletype=all"),
          expect.any(Object)
        )
      })
    })

    it("fetches data when initialData is empty", async () => {
      renderHook(() => useAllLeaderboards({}))
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled()
      })
    })

    it("skips fetching when initialData is provided", async () => {
      const initialData = { snooker: [{ id: "1", name: "Player", score: 100, likes: 0 }] }
      renderHook(() => useAllLeaderboards(initialData))

      await new Promise(resolve => setTimeout(resolve, 100))
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })
  })
})
