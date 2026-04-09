import { useState, useEffect, useCallback } from "react"
import { LeaderboardItem } from "@/types/leaderboard"
import { logger } from "@/utils/logger"

export function useAllLeaderboards(
  initialData?: Record<string, LeaderboardItem[]>
) {
  const [data, setData] = useState<Record<string, LeaderboardItem[]>>(
    initialData ?? {}
  )
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const url = "/api/rank?ruletype=all"
      const response = await fetch(url, { signal })
      if (!response.ok)
        throw new Error(
          `Failed to fetch all leaderboard data: ${response.status}`
        )
      const jsonData = await response.json()
      setData(jsonData)
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err : new Error("Unknown error"))
      logger.error(
        "Error fetching all leaderboard data",
        err instanceof Error ? err : new Error("Unknown error"),
        {
          operation: "fetchAllLeaderboards",
          file: "src/components/hooks/useAllLeaderboards.ts",
          url: "/api/rank?ruletype=all",
          method: "GET",
          status:
            err instanceof Error && /status[:\s](\d+)/.test(err.message)
              ? parseInt(err.message.match(/status[:\s](\d+)/)![1], 10)
              : null,
        }
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialData) {
      fetchData()
    }
  }, [fetchData, initialData])

  return { data, loading, error, refresh: fetchData }
}
