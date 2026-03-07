import React, { useMemo } from "react"
import { LeaderboardItem } from "@/types/leaderboard"
import { navigateTo } from "@/utils/navigation"
import { useLeaderboard } from "./hooks/useLeaderboard"

interface LeaderboardTableProps {
  readonly ruleType: string
  readonly limit?: number
}

type LeaderboardRowItem = LeaderboardItem & { isPlaceholder: boolean }

const cellClass = "px-0 py-0.5"
const hideReplay = "@max-[300px]:hidden"

function renderTrophy(index: number) {
  const icons = ["🏆", "🥈", "🥉"]
  const icon = icons[index]
  if (!icon) return null
  return <span className="text-[1.15rem]">{icon}</span>
}

const PlaceholderRow: React.FC<{ id: string }> = ({ id }) => (
  <tr key={id}>
    <td className={`text-left ${cellClass} pl-0 pr-0`}>&nbsp;</td>
    <td className={`text-left ${cellClass} pl-0`}>&nbsp;</td>
    <td className={`text-left ${cellClass}`}>&nbsp;</td>
    <td className={hideReplay} />
    <td />
  </tr>
)

const LeaderboardRow: React.FC<{
  item: LeaderboardItem
  index: number
  ruleType: string
  onLike: (e: React.MouseEvent, id: string) => void
}> = ({ item, index, ruleType, onLike }) => {
  const handleRowClick = () => {
    const replayUrl = `/api/rank/${item.id}?ruletype=${ruleType}`
    navigateTo(replayUrl)
  }

  return (
    <tr
      className={`group hover:bg-gray-800/30 transition-colors cursor-pointer stagger-item`}
      onClick={handleRowClick}
    >
      <td className={`text-left ${cellClass} pl-0 pr-0`}>
        <div className="flex items-center leading-none h-full">
          {renderTrophy(index)}
        </div>
      </td>
      <td
        className={`text-left truncate leading-none ${cellClass} pl-0 text-gray-300`}
      >
        <span className="font-semibold">{item.name}</span>
      </td>
      <td
        className={`text-center font-mono-data leading-none ${cellClass} text-gray-300`}
      >
        {item.score}
      </td>
      <td className={`text-right ${cellClass} text-gray-400 ${hideReplay}`}>
        <a href={`/api/rank/${item.id}?ruletype=${ruleType}`}>replay</a>
      </td>
      <td className={`text-left ${cellClass}`}>
        <button
          onClick={(e) => onLike(e, item.id)}
          className="inline-flex items-center bg-gray-700/30 text-gray-500 border border-gray-600/30 rounded-full px-[4px] py-0 text-[10px] cursor-pointer hover:bg-gray-600 hover:text-white transition-all ml-1"
        >
          👍{"\u00A0"}
          {item.likes || 0}
        </button>
      </td>
    </tr>
  )
}

export function LeaderboardTable({ ruleType, limit }: LeaderboardTableProps) {
  const { data, handleLike } = useLeaderboard(ruleType)

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

  const onLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    handleLike(id)
  }

  return (
    <div className="w-full overflow-x-auto @container">
      <table className="w-full table-fixed border-collapse text-sm">
        <tbody>
          {rows.map((item, index) =>
            item.isPlaceholder ? (
              <PlaceholderRow key={item.id} id={item.id} />
            ) : (
              <LeaderboardRow
                key={item.id}
                item={item}
                index={index}
                ruleType={ruleType}
                onLike={onLike}
              />
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

export default LeaderboardTable
