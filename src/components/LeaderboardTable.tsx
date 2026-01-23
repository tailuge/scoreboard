import React, { useState, useEffect } from "react";
import { LeaderboardItem } from "@/types/leaderboard";

interface LeaderboardTableProps {
  title: string;
  ruleType: string;
  gameUrl: string;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  title,
  ruleType,
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

  return (
    <div className="bg-white p-2.5 rounded shadow-md flex-1 min-w-[300px]">
      <h2 className="text-xl font-semibold mb-2 text-center text-gray-700">
        <a href={gameUrl} className="hover:underline decoration-1">{title}</a>
      </h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-1 text-left border-b border-gray-200 w-8"></th>
            <th className="p-1 text-left border-b border-gray-200 text-gray-600 text-sm font-normal">Score</th>
            <th className="p-1 text-left border-b border-gray-200 text-gray-600 text-sm font-normal">Player</th>
            <th className="p-1 text-left border-b border-gray-200"></th>
            <th className="p-1 text-left border-b border-gray-200"></th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={item.id}>
              <td className="p-1 text-left border-b border-gray-100">
                {renderTrophy(index)}
              </td>
              <td className="p-1 text-left border-b border-gray-100">
                {item.score}
              </td>
              <td className="p-1 text-left border-b border-gray-100">
                <b>{item.name}</b>
              </td>
              <td className="p-1 text-left border-b border-gray-100">
                <a 
                  href={`/api/rank/${item.id}?ruletype=${ruleType}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  replay
                </a>
              </td>
              <td className="p-1 text-left border-b border-gray-100">
                <button
                  onClick={() => handleLike(item.id)}
                  className="inline-flex items-center bg-white text-blue-600 border border-blue-200 rounded-full px-2.5 py-1 text-xs cursor-pointer hover:bg-blue-50 hover:shadow-sm transition-all ml-2"
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
