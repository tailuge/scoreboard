import React, { useState, useEffect, useMemo } from "react";
import { LeaderboardItem } from "@/types/leaderboard";
import { navigateTo } from "@/utils/navigation";

interface LeaderboardTableProps {
  ruleType: string;
  limit?: number;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  ruleType,
  limit,
}) => {
  const [data, setData] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ ruletype: ruleType });
        const url = `/api/rank?${params.toString()}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch leaderboard data");
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [ruleType]);

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const url = `/api/rank/${id}?ruletype=${ruleType}`;
      const response = await fetch(url, { method: "PUT" });
      if (!response.ok) throw new Error("Failed to update likes");
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item,
        ),
      );
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const handleRowClick = (id: string) => {
    const replayUrl = `/api/rank/${id}?ruletype=${ruleType}`;
    navigateTo(replayUrl);
  };

  const renderTrophy = (index: number) => {
    const icons = ["🏆", "🥈", "🥉"];
    const icon = icons[index];
    if (!icon) return null;
    return <span className="text-[1.15rem]">{icon}</span>;
  };

  type LeaderboardRowItem = LeaderboardItem & { isPlaceholder: boolean };

  const rows = useMemo<LeaderboardRowItem[]>(() => {
    const displayData = limit ? data.slice(0, limit) : data;
    const placeholdersCount = limit
      ? Math.max(0, limit - displayData.length)
      : 0;
    return [
      ...displayData.map((item) => ({ ...item, isPlaceholder: false })),
      ...Array.from({ length: placeholdersCount }, (_, i) => ({
        id: `placeholder-${ruleType}-${i}`,
        name: "",
        score: 0,
        likes: 0,
        isPlaceholder: true,
      })),
    ];
  }, [data, limit, ruleType]);

  const cellClass = "px-0 py-0.5";
  const hideReplay = "@max-[300px]:hidden";

  const renderPlaceholderRow = (item: LeaderboardRowItem) => (
    <tr key={item.id}>
      <td className={`text-left ${cellClass} pl-0 pr-0`}>&nbsp;</td>
      <td className={`text-left ${cellClass} pl-0`}>&nbsp;</td>
      <td className={`text-left ${cellClass}`}>&nbsp;</td>
      <td className={hideReplay} />
      <td />
    </tr>
  );

  const renderDataRow = (item: LeaderboardRowItem, index: number) => (
    <tr
      key={item.id}
      className={`group hover:bg-gray-800/30 transition-colors cursor-pointer stagger-item`}
      onClick={() => handleRowClick(item.id)}
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
      <td className={`text-right ${cellClass}`}>
        <button
          onClick={(e) => handleLike(e, item.id)}
          className="inline-flex items-center bg-gray-700/30 text-gray-500 border border-gray-600/30 rounded-full px-[4px] py-0 text-[10px] cursor-pointer hover:bg-gray-600 hover:text-white transition-all ml-1"
        >
          👍{"\u00A0"}
          {item.likes || 0}
        </button>
      </td>
    </tr>
  );

  const renderRow = (item: LeaderboardRowItem, index: number) => {
    if (item.isPlaceholder) {
      return renderPlaceholderRow(item);
    }
    return renderDataRow(item, index);
  };

  return (
    <div className="w-full overflow-x-auto @container">
      <table className="w-full table-fixed border-collapse text-sm">
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
