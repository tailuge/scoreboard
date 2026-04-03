import { useState, useEffect, useCallback } from "react"
import { MatchResult } from "@/types/match"
import { logger } from "@/utils/logger"

export function useMatchHistory(
  pollInterval: number = 15000,
  initialData?: MatchResult[]
) {
  const [results, setResults] = useState<MatchResult[]>(initialData ?? [])
  const [isLoading, setIsLoading] = useState(!initialData)

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch("/api/match-results")
      if (!response.ok)
        throw new Error(`Failed to fetch match history: ${response.status}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      logger.error("Error fetching match history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialData) {
      fetchResults()
    }
    const interval = setInterval(fetchResults, pollInterval)
    return () => clearInterval(interval)
  }, [fetchResults, pollInterval, initialData])

  return { results, isLoading, fetchResults }
}
