import React, { useState, useEffect } from "react";
import { LeaderboardItem } from "@/types/leaderboard";

interface LeaderboardTableProps {
  title?: string; // Kept for API calls/logic if needed, but not rendered as header
  ruleType: string;
  gameUrl?: string; // Made optional if not used for header link
  limit?: number;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  ruleType,
  limit,
}) => {
  const [data, setData] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ ruletype: ruleType });
        const url = `/api/rank?${params.toString()}`;
        const response = await fetch(url);
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchData();
  }, [ruleType]);

  const handleLike = async (id: string) => {
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

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left border-b border-gray-700 text-gray-400 font-medium w-8"></th>
            <th className="p-2 text-left border-b border-gray-700 text-gray-400 font-medium">Score</th>
            <th className="p-2 text-left border-b border-gray-700 text-gray-400 font-medium">Player</th>
            <th className="p-2 text-left border-b border-gray-700"></th>
            <th className="p-2 text-left border-b border-gray-700"></th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((item, index) => (
            <tr key={item.id} className="group hover:bg-gray-800/30 transition-colors">
              <td className="p-2 text-left border-b border-gray-800">
                {renderTrophy(index)}
              </td>
              <td className="p-2 text-left border-b border-gray-800 text-gray-300">
                {item.score}
              </td>
              <td className="p-2 text-left border-b border-gray-800 text-gray-200">
                <span className="font-semibold">{item.name}</span>
              </td>
              <td className="p-2 text-left border-b border-gray-800">
                <a 
                  href={`/api/rank/${item.id}?ruletype=${ruleType}`}
                  className="text-blue-400 hover:text-blue-300 hover:underline text-xs"
                >
                  replay
                </a>
              </td>
              <td className="p-2 text-left border-b border-gray-800">
                <button
                  onClick={() => handleLike(item.id)}
                  className="inline-flex items-center bg-gray-700 text-gray-300 border border-gray-600 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-gray-600 hover:text-white transition-all ml-2"
                >
                  👍 {item.likes || 0}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
