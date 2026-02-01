import React, { useEffect, useState } from "react"
import { MatchResult } from "@/types/match"
import { MatchResultCard } from "./MatchResultCard"
import { GroupBox } from "./GroupBox"
import { logger } from "@/utils/logger"

export function MatchHistoryList() {
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/match-results")
      if (!response.ok) throw new Error("Failed to fetch match history")
      const data = await response.json()
      setResults(data)
    } catch (error) {
      logger.log("Error fetching match history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
    const interval = setInterval(fetchResults, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const renderContent = () => {
    if (loading && results.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm animate-pulse">
          Loading match history...
        </div>
      )
    }

    if (results.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm italic">
          No matches recorded yet.
        </div>
      )
    }

    return results.map((result) => (
      <MatchResultCard key={result.id} result={result} />
    ))
  }

  return (
    <GroupBox title="Recent Matches">
      <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
        {renderContent()}
      </div>
    </GroupBox>
  )
}

export default MatchHistoryList
