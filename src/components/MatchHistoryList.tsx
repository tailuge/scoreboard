import React, { useEffect, useState } from "react"
import { MatchResult } from "@/types/match"
import { MatchResultCard } from "./MatchResultCard"
import { GroupBox } from "./GroupBox"

export function MatchHistoryList() {
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResults = async () => {
    try {
      const response = await fetch("/api/match-results")
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Error fetching match history:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
    const interval = setInterval(fetchResults, 30000) // Poll every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <GroupBox title="Recent Matches">
      <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {loading && results.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm animate-pulse">
            Loading match history...
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm italic">
            No matches recorded yet.
          </div>
        ) : (
          results.map((result) => (
            <MatchResultCard key={result.id} result={result} />
          ))
        )}
      </div>
    </GroupBox>
  )
}

export default MatchHistoryList
