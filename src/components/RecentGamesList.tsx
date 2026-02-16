import React, { useEffect, useState } from "react";
import { MatchResult } from "@/types/match";
import { MatchResultCard } from "./MatchResultCard";
import { GroupBox } from "./GroupBox";
import { useUser } from "@/contexts/UserContext";
import { useLobbyTables } from "./hooks/useLobbyTables";
import { GameUrl } from "@/utils/GameUrl";
import { logger } from "@/utils/logger";

export function RecentGamesList() {
  const { userId, userName } = useUser();
  const { tables, tableAction } = useLobbyTables(userId, userName);
  const [historyResults, setHistoryResults] = useState<MatchResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/match-results");
      if (!response.ok) throw new Error("Failed to fetch match history");
      const data = await response.json();
      setHistoryResults(data);
    } catch (error) {
      logger.log("Error fetching match history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSpectate = async (tableId: string) => {
    await tableAction(tableId, "spectate");
  };

  const liveMatches = tables
    .filter((t) => t.players.length === 2 && !t.completed) // Active games only
    .map((table) => {
      const virtualResult: MatchResult = {
        id: table.id,
        winner: table.players[0]?.name || "Player 1",
        loser: table.players[1]?.name || "Player 2",
        winnerScore: 0,
        loserScore: 0,
        ruleType: table.ruleType as any,
        timestamp: table.createdAt,
      };
      return {
        ...virtualResult,
        isLive: true,
        originalTable: table,
      };
    });

  // Combine and sort
  // Live matches first, then history
  const combinedList = [
    ...liveMatches,
    ...historyResults.map((r) => ({ ...r, isLive: false })),
  ];

  const displayList = combinedList;

  const renderContent = () => {
    if (loadingHistory && displayList.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm animate-pulse font-mono-data">
          Loading games...
        </div>
      );
    }
    if (displayList.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm italic font-mono-data">
          No active or recent games.
        </div>
      );
    }
    return displayList.map((item) => {
      if (item.isLive) {
        const table = (item as any).originalTable;
        const onSpectateClick = () => {
          handleSpectate(table.id);
          if (!userId || !userName) return;
          const spectatorUrl = GameUrl.create({
            tableId: table.id,
            userName,
            userId,
            ruleType: table.ruleType,
            isSpectator: true,
            isCreator: false,
          });
          globalThis.open(spectatorUrl.toString(), "_blank");
        };
        return (
          <MatchResultCard
            key={`live-${item.id}`}
            result={item}
            isLive={true}
            onClick={onSpectateClick}
          />
        );
      }
      return <MatchResultCard key={`hist-${item.id}`} result={item} />;
    });
  };

  return (
    <GroupBox title="Recent Games">
      <div className="flex flex-col min-h-[100px] max-h-[170px] overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>
    </GroupBox>
  );
}
