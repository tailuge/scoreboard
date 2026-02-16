import { useState, useEffect, useCallback } from "react"
import { MatchResult } from "@/types/match"
import { logger } from "@/utils/logger"

export function useMatchHistory(pollInterval: number = 30000) {
  const [results, setResults] = useState<MatchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch("/api/match-results")
      if (!response.ok) throw new Error("Failed to fetch match history")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      logger.log("Error fetching match history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchResults()
    const interval = setInterval(fetchResults, pollInterval)
    return () => clearInterval(interval)
  }, [fetchResults, pollInterval])

  return { results, isLoading, fetchResults }
}
