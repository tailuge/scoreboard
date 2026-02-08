import React, { useEffect, useState, useMemo } from "react"
import { MatchResult } from "@/types/match"
import { MatchResultCard } from "./MatchResultCard"
import { logger } from "@/utils/logger"

interface CompactMatchHistoryProps {
  readonly gameType: string
  readonly limit?: number
  readonly pollingInterval?: number
}

export function CompactMatchHistory({
  gameType,
  limit = 3,
  pollingInterval = 30000,
}: CompactMatchHistoryProps) {
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResults = async () => {
    try {
      const response = await fetch(
        `/api/match-results?gameType=${gameType}&limit=${limit}`
      )
      if (!response.ok) throw new Error("Failed to fetch match history")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      logger.log(`Error fetching match history for ${gameType}:`, error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
    const interval = setInterval(fetchResults, pollingInterval)
    return () => clearInterval(interval)
  }, [gameType, limit, pollingInterval])

  const skeletonIds = useMemo(
    () => [...new Array(limit)].map((_, i) => `skeleton-${gameType}-${i}`),
    [limit, gameType]
  )

  if (loading && results.length === 0) {
    return (
      <div className="flex flex-col">
        {skeletonIds.map((id) => (
          <div
            key={id}
            className="h-8 border-b border-gray-800/50 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-2 text-gray-500 text-[10px] italic">
        No matches
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {results.map((result) => (
        <MatchResultCard key={result.id} result={result} compact={true} />
      ))}
    </div>
  )
}

export default CompactMatchHistory
