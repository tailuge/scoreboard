import React, { useState, useEffect } from "react";
import { LeaderboardItem } from "@/types/leaderboard";
import { logger } from "@/utils/logger"

interface LeaderboardTableProps {
  ruleType: string;
  limit?: number;
  compact?: boolean;
  gameUrl: string;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  ruleType,
  limit,
  compact = false,
  gameUrl,
}) => {
  const [data, setData] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ ruletype: ruleType });
        const url = `/api/rank?${params.toString()}`;
        const response = await fetch(url);
        const jsonData = await response.json();
        logger.log(`fetched leaderboard data: ${jsonData}`);
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchData();
  }, [ruleType]);

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const url = `/api/rank/${id}?ruletype=${ruleType}`;
      await fetch(url, { method: "PUT" });
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item
        )
      );
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const handleRowClick = (id: string) => {
    globalThis.location.href = `${gameUrl}&replayId=${id}`;
  };

  const renderTrophy = (index: number) => {
    switch (index) {
      case 0:
        return <span className="text-xl">🏆</span>;
      case 1:
        return <span className="text-xl">🥈</span>;
      case 2:
        return <span className="text-xl">🥉</span>;
      default:
        return null;
    }
  };

  const displayData = limit ? data.slice(0, limit) : data;
  const rows = limit
    ? [...displayData, ...Array.from({ length: Math.max(0, limit - displayData.length) }, () => null)]
    : displayData;

  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full border-collapse ${compact ? 'text-[11px]' : 'text-sm'}`}>
        {!compact && (
          <thead>
            <tr>
              <th className="px-2 py-1 text-left border-b border-gray-700 text-gray-400 font-medium w-8"></th>
              <th className="px-2 py-1 text-left border-b border-gray-700 text-gray-400 font-medium">Score</th>
              <th className="px-2 py-1 text-left border-b border-gray-700 text-gray-400 font-medium">Player</th>
              <th className="px-2 py-1 text-left border-b border-gray-700"></th>
              <th className="px-2 py-1 text-left border-b border-gray-700"></th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((item, index) => {
            if (!item) {
              return (
                // Using index as a key is acceptable here for non-interactive placeholder rows.
                <tr key={`empty-${index}`} className={compact ? "h-[22px]" : "h-[28px]"}>
                  <td className={`text-left border-b border-gray-800/50 ${compact ? 'px-1 py-0' : 'px-2 py-1'}`}>&nbsp;</td>
                  <td className={`text-left border-b border-gray-800/50 ${compact ? 'px-1 py-0' : 'px-2 py-1'}`}>&nbsp;</td>
                  <td className={`text-left border-b border-gray-800/50 ${compact ? 'px-1 py-0' : 'px-2 py-1'}`}>&nbsp;</td>
                  {!compact && <><td /><td /></>}
                </tr>
              );
            }
            return (
              <tr
                key={item.id}
                className="group hover:bg-gray-800/30 transition-colors cursor-pointer"
                onClick={() => handleRowClick(item.id)}
              >
                <td className={`text-left border-b border-gray-800 ${compact ? 'px-1 py-0 text-gray-600' : 'px-2 py-1'}`}>
                  <div className={compact ? 'scale-75 origin-left' : ''}>
                    {renderTrophy(index)}
                  </div>
                </td>
                <td className={`text-left border-b border-gray-800 ${compact ? 'px-1 py-0 text-gray-500/70' : 'px-2 py-1 text-gray-400'}`}>
                  {item.score}
                </td>
                <td className={`text-left border-b border-gray-800 truncate ${compact ? 'px-1 py-0 text-gray-500/70 max-w-[60px]' : 'px-2 py-1 text-gray-300 max-w-[120px]'}`}>
                  <span className={compact ? "font-medium" : "font-semibold"}>{item.name}</span>
                </td>
                {!compact && (
                  <>
                    <td className="px-2 py-1 text-left border-b border-gray-800">
                      <a
                        href={`${gameUrl}&replayId=${item.id}`}
                      >
                        replay
                      </a>
                    </td>
                    <td className="px-2 py-1 text-left border-b border-gray-800">
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
