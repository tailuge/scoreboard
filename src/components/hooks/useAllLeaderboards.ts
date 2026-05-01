import { useState, useEffect, useCallback, useRef } from "react"
import { LeaderboardItem } from "@/types/leaderboard"
import { logger } from "@/utils/logger"

export function useAllLeaderboards(
  initialData?: Record<string, LeaderboardItem[]>
) {
  const isInitialMount = useRef(true)
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
      const statusMatch =
        err instanceof Error ? /status[:\s](\d+)/.exec(err.message) : null
      logger.error(
        "Error fetching all leaderboard data",
        err instanceof Error ? err : new Error("Unknown error"),
        {
          operation: "fetchAllLeaderboards",
          file: "src/components/hooks/useAllLeaderboards.ts",
          url: "/api/rank?ruletype=all",
          method: "GET",
          status: statusMatch ? Number.parseInt(statusMatch[1], 10) : null,
        }
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (
      isInitialMount.current &&
      initialData &&
      Object.keys(initialData).length > 0
    ) {
      isInitialMount.current = false
      return
    }
    isInitialMount.current = false

    const controller = new AbortController()
    fetchData(controller.signal)
    return () => {
      controller.abort()
    }
  }, [fetchData])

  return { data, loading, error, refresh: fetchData }
}
