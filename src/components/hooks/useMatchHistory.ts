import { useState, useEffect, useCallback } from "react"
import { MatchResult } from "@/types/match"
import { logger } from "@/utils/logger"

export function useMatchHistory(initialData?: MatchResult[]) {
  const [results, setResults] = useState<MatchResult[]>(initialData ?? [])
  const [isLoading, setIsLoading] = useState(!initialData)

  const fetchResults = useCallback(async () => {
    try {
      const url = "/api/match-results"
      const response = await fetch(url)
      if (!response.ok)
        throw new Error(`Failed to fetch match history: ${response.status}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      logger.error(
        "Error fetching match history",
        error instanceof Error ? error : new Error("Unknown error"),
        {
          operation: "fetchMatchHistory",
          file: "src/components/hooks/useMatchHistory.ts",
          url: "/api/match-results",
          method: "GET",
          status:
            error instanceof Error && /status[:\s](\d+)/.test(error.message)
              ? parseInt(error.message.match(/status[:\s](\d+)/)![1], 10)
              : null,
        }
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialData) {
      fetchResults()
    }
  }, [fetchResults, initialData])

  return { results, isLoading, fetchResults }
}
