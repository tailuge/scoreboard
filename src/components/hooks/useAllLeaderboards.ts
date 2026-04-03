import { useState, useEffect, useCallback } from "react"
import { LeaderboardItem } from "@/types/leaderboard"

export function useAllLeaderboards(skipFetch = false) {
  const [data, setData] = useState<Record<string, LeaderboardItem[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (skipFetch) return
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
        console.error("Error fetching all leaderboard data:", err)
      } finally {
        setLoading(false)
      }
    },
    [skipFetch]
  )

  useEffect(() => {
    if (skipFetch) return
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [fetchData, skipFetch])

  return { data, loading, error, refresh: fetchData }
}
