import { useState, useEffect, useCallback } from "react"
import { LeaderboardItem } from "@/types/leaderboard"

export function useLeaderboard(ruleType: string, skipFetch = false) {
  const [data, setData] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ ruletype: ruleType })
        const url = `/api/rank?${params.toString()}`
        const response = await fetch(url, { signal })
        if (!response.ok) throw new Error("Failed to fetch leaderboard data")
        const jsonData = await response.json()
        setData(jsonData)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        setError(err instanceof Error ? err : new Error("Unknown error"))
        console.error("Error fetching leaderboard data:", err)
      } finally {
        setLoading(false)
      }
    },
    [ruleType]
  )

  useEffect(() => {
    if (skipFetch) return
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => controller.abort()
  }, [fetchData, skipFetch])

  const handleLike = useCallback(
    async (id: string) => {
      try {
        const url = `/api/rank/${id}?ruletype=${ruleType}`
        const response = await fetch(url, { method: "PUT" })
        if (!response.ok) throw new Error("Failed to update likes")
        setData((prevData) =>
          prevData.map((item) =>
            item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item
          )
        )
      } catch (err) {
        console.error("Error updating likes:", err)
      }
    },
    [ruleType]
  )

  return { data, loading, error, handleLike, refresh: fetchData }
}
