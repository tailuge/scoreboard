import React, { useState, useEffect, useMemo } from "react"
import { LeaderboardItem } from "@/types/leaderboard"
import { navigateTo } from "@/utils/navigation"

interface LeaderboardTableProps {
  ruleType: string
  limit?: number
  compact?: boolean
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  ruleType,
  limit,
  compact = false,
}) => {
  const [data, setData] = useState<LeaderboardItem[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ ruletype: ruleType })
        const url = `/api/rank?${params.toString()}`
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error("Failed to fetch leaderboard data")
        const jsonData = await response.json()
        setData(jsonData)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        console.error("Error fetching leaderboard data:", error)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [ruleType])

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      const url = `/api/rank/${id}?ruletype=${ruleType}`
      const response = await fetch(url, { method: "PUT" })
      if (!response.ok) throw new Error("Failed to update likes")
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item
        )
      )
    } catch (error) {
      console.error("Error updating likes:", error)
    }
  }

  const handleRowClick = (id: string) => {
    const replayUrl = `/api/rank/${id}?ruletype=${ruleType}`
    navigateTo(replayUrl)
  }

  const renderTrophy = (index: number, isCompact: boolean) => {
    const sizeClass = isCompact ? "text-[12px]" : "text-xl"
    switch (index) {
      case 0:
        return <span className={sizeClass}>🏆</span>
      case 1:
        return <span className={sizeClass}>🥈</span>
      case 2:
        return <span className={sizeClass}>🥉</span>
      default:
        return null
    }
  }

  type LeaderboardRowItem = LeaderboardItem & { isPlaceholder: boolean }

  const rows = useMemo<LeaderboardRowItem[]>(() => {
    const displayData = limit ? data.slice(0, limit) : data
    const placeholdersCount = limit
      ? Math.max(0, limit - displayData.length)
      : 0
    return [
      ...displayData.map((item) => ({ ...item, isPlaceholder: false })),
      ...Array.from({ length: placeholdersCount }, (_, i) => ({
        id: `placeholder-${ruleType}-${i}`,
        name: "",
        score: 0,
        likes: 0,
        isPlaceholder: true,
      })),
    ]
  }, [data, limit, ruleType])

  const cellClasses = compact ? "px-[3px] py-0" : "px-2 py-1"

  const renderPlaceholderRow = (item: LeaderboardRowItem) => (
    <tr key={item.id} className={compact ? "h-[17px]" : "h-7"}>
      <td className={`text-left ${cellClasses} pl-0 pr-0`}>&nbsp;</td>
      <td className={`text-left ${cellClasses} pl-0`}>&nbsp;</td>
      <td className={`text-left ${cellClasses}`}>&nbsp;</td>
      {!compact && (
        <>
          <td />
          <td />
        </>
      )}
    </tr>
  )

  const renderDataRow = (item: LeaderboardRowItem, index: number) => (
    <tr
      key={item.id}
      className={`group hover:bg-gray-800/30 transition-colors cursor-pointer stagger-item ${compact ? "h-[17px]" : "h-7"}`}
      onClick={() => handleRowClick(item.id)}
    >
      <td
        className={`text-left ${cellClasses} pl-0 pr-0 ${compact ? "text-gray-400" : ""}`}
      >
        <div className="flex items-center leading-none h-full">
          {renderTrophy(index, compact)}
        </div>
      </td>
      <td
        className={`text-left truncate leading-none ${cellClasses} pl-0 ${compact ? "text-gray-300/80" : "text-gray-300"}`}
      >
        <span className={compact ? "font-medium" : "font-semibold"}>
          {item.name}
        </span>
      </td>
      <td
        className={`text-left font-mono-data leading-none ${cellClasses} ${compact ? "text-gray-300/80" : "text-gray-400"}`}
      >
        {item.score}
      </td>
      {!compact && (
        <>
          <td className="px-2 py-1 text-left">
            <a href={`/api/rank/${item.id}?ruletype=${ruleType}`}>replay</a>
          </td>
          <td className="px-2 py-1 text-left">
            <button
              onClick={(e) => handleLike(e, item.id)}
              className="inline-flex items-center bg-gray-700/30 text-gray-500 border border-gray-600/30 rounded-full px-1.5 py-0 text-[10px] cursor-pointer hover:bg-gray-600 hover:text-white transition-all ml-1"
            >
              👍 {item.likes || 0}
            </button>
          </td>
        </>
      )}
    </tr>
  )

  const renderRow = (item: LeaderboardRowItem, index: number) => {
    if (item.isPlaceholder) {
      return renderPlaceholderRow(item)
    }
    return renderDataRow(item, index)
  }

  return (
    <div className="w-full overflow-x-auto">
      <table
        className={`w-full table-fixed border-collapse ${compact ? "text-[11px]" : "text-sm"}`}
      >
        <thead>
          <tr className={compact ? "h-0 invisible" : ""}>
            <th className="p-0 text-left text-gray-400 font-medium w-[20px]"></th>
            <th className="px-2 py-1 text-left text-gray-400 font-medium">
              {!compact && "Player"}
            </th>
            <th className="px-2 py-1 text-left text-gray-400 font-medium w-[60px]">
              {!compact && "Score"}
            </th>
            {!compact && (
              <>
                <th className="px-2 py-1 text-left w-16"></th>
                <th className="px-2 py-1 text-left w-16"></th>
              </>
            )}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  )
}

export default LeaderboardTable
