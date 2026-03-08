import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/router"
import { LiveMatchesPanel } from "@/components/LiveMatchesPanel"
import { PlayModal } from "@/components/PlayModal"
import { User } from "@/components/User"
import { GroupBox } from "@/components/GroupBox"
import { OnlineUsersPopover } from "@/components/OnlineUsersPopover"
import { usePresenceList } from "@/components/hooks/usePresenceList"
import { Seo } from "@/components/Seo"
import { markUsage } from "@/utils/usage"
import { useUser } from "@/contexts/UserContext"
import { useLobbyTables } from "@/components/hooks/useLobbyTables"
import { useAutoJoin } from "@/components/hooks/useAutoJoin"
import { ChallengeCard } from "@/components/ChallengeCard"
import { SeekingCard } from "@/components/SeekingCard"

const log = (...args: unknown[]) => console.warn("[lobby]", ...args)

export default function Lobby() {
  const { userId, userName } = useUser()
  const router = useRouter()
  const { tables, isLoading, findOrCreateTable, deleteTable } = useLobbyTables(
    userId,
    userName
  )
  const [modalTable, setModalTable] = useState<{
    id: string
    ruleType: string
  } | null>(null)
  const shownModals = useRef<Set<string>>(new Set())

  const opponentId = router.query.opponentId as string | undefined
  const opponentName = router.query.opponentName as string | undefined
  const queryRuleType = router.query.ruletype as string | undefined

  const [activeOpponentId, setActiveOpponentId] = useState<string | null>(null)
  const [activeRuleType, setActiveRuleType] = useState<string | null>(null)

  useEffect(() => {
    log("router.isReady", router.isReady)
    if (router.isReady) {
      log("opponentId", opponentId)
      if (opponentId) setActiveOpponentId(opponentId)
      log("queryRuleType", queryRuleType)
      if (queryRuleType) setActiveRuleType(queryRuleType)
    }
  }, [router.isReady, opponentId, queryRuleType])

  const { users: presenceUsers, count: presenceCount } = usePresenceList(
    userId,
    userName,
    activeRuleType ? activeOpponentId : null,
    activeRuleType
  )

  const [seekingRuleType, setSeekingRuleType] = useState<string | null>(null)
  const [seekingTableId, setSeekingTableId] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const seekingTableIdRef = useRef<string | null>(null)

  useEffect(() => {
    seekingTableIdRef.current = seekingTableId
  }, [seekingTableId])

  const handleCancelSeeking = useCallback(async () => {
    log("handleCancelSeeking called", { seekingTableId })
    if (seekingTableId) {
      await deleteTable(seekingTableId)
    }
    setSeekingRuleType(null)
    setSeekingTableId(null)
    setActiveOpponentId(null)
    setActiveRuleType(null)
    log("timeoutRef.current", timeoutRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [seekingTableId, deleteTable])

  useEffect(() => {
    log("router.isReady check", router.isReady)
    if (!router.isReady) return
    markUsage("lobby")
  }, [router.isReady])

  const handleFindOrCreate = useCallback(
    async (ruleType: string) => {
      log("handleFindOrCreate called", { ruleType })
      setSeekingRuleType(ruleType)
      const updatedTable = await findOrCreateTable(ruleType)
      log("handleFindOrCreate result", {
        updatedTable: updatedTable
          ? {
              id: updatedTable.id,
              players: updatedTable.players,
              completed: updatedTable.completed,
              ruleType: updatedTable.ruleType,
            }
          : null,
      })
      if (updatedTable) {
        log("players.length", updatedTable.players.length)
        if (updatedTable.players.length === 2) {
          setSeekingRuleType(null)
          log("updatedTable.completed", updatedTable.completed)
          if (!updatedTable.completed) {
            setModalTable({
              id: updatedTable.id,
              ruleType: updatedTable.ruleType,
            })
            shownModals.current.add(updatedTable.id)
          }
        } else {
          setSeekingTableId(updatedTable.id)
        }
      } else {
        setSeekingRuleType(null)
      }
    },
    [findOrCreateTable]
  )

  useAutoJoin(router, isLoading, userId, userName, handleFindOrCreate)

  useEffect(() => {
    log("tables effect", { tablesCount: tables.length, userId })
    tables.forEach((table) => {
      log("checking table", {
        tableId: table.id,
        creatorId: table.creator.id,
        playersLength: table.players.length,
        completed: table.completed,
        shownModals: Array.from(shownModals.current),
      })
      if (
        table.creator.id === userId &&
        table.players.length === 2 &&
        !table.completed &&
        !shownModals.current.has(table.id)
      ) {
        log("table condition met, setting modal", { tableId: table.id })
        setSeekingRuleType(null)
        setSeekingTableId(null)
        log("timeoutRef.current before clear", timeoutRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setModalTable({ id: table.id, ruleType: table.ruleType })
        // Clear challenge from presence to remove it from recipient's screen
        setActiveOpponentId(null)
        shownModals.current.add(table.id)
      }
    })
  }, [tables, userId])

  // Timeout logic
  useEffect(() => {
    log("timeout effect", { seekingRuleType })
    if (seekingRuleType) {
      log("timeoutRef.current before clear", timeoutRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(async () => {
        log("timeout fired", { seekingTableIdRef: seekingTableIdRef.current })
        if (seekingTableIdRef.current) {
          await deleteTable(seekingTableIdRef.current)
        }
        setSeekingRuleType(null)
        setSeekingTableId(null)
        router.push("/game")
      }, 60000)
    }
    return () => {
      log("timeout cleanup", { timeoutRef: timeoutRef.current })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [seekingRuleType, deleteTable, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      log("unmount cleanup", { seekingTableIdRef: seekingTableIdRef.current })
      if (seekingTableIdRef.current) {
        // Use keepalive for the delete request on unmount to ensure it completes
        fetch(`/api/tables/${seekingTableIdRef.current}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
          keepalive: true,
        }).catch((err) =>
          console.error("Failed to delete table on unmount", err)
        )
      }
    }
  }, [userId])

  return (
    <>
      <Seo
        title="Free Open Source Multiplayer Billiards Lobby - Play Pool & Snooker Online"
        description="Find opponents for free open source online billiards matches. Join Snooker, 9-Ball, or Three-Cushion tables and compete in real-time multiplayer games."
        canonical="https://scoreboard-tailuge.vercel.app/lobby"
        ogUrl="https://scoreboard-tailuge.vercel.app/lobby"
      />
      {log("render state", {
        activeOpponentId,
        activeRuleType,
        seekingRuleType,
        seekingTableId,
        modalTable,
        userId,
        userName,
        isLoading,
        tablesCount: tables.length,
        presenceCount,
      })}
      <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4">
        <div className="w-full max-w-6xl mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <GroupBox
              title="Lobby"
              leftBadge={<User />}
              rightBadge={
                <OnlineUsersPopover
                  count={presenceCount}
                  users={presenceUsers}
                  totalCount={presenceCount}
                  currentUserId={userId}
                />
              }
            >
              <div className="flex flex-col gap-6">
                {
                  (log("render ChallengeCard condition", {
                    activeOpponentId,
                    activeRuleType,
                  }),
                  activeOpponentId && !activeRuleType ? (
                    <ChallengeCard
                      opponentName={opponentName}
                      onSelectRule={(ruleType) => {
                        log("onSelectRule", { ruleType })
                        setActiveRuleType(ruleType)
                        handleFindOrCreate(ruleType)
                      }}
                      onCancel={() => {
                        log("ChallengeCard onCancel")
                        setActiveOpponentId(null)
                        const newQuery = { ...router.query }
                        delete newQuery.opponentId
                        delete newQuery.opponentName
                        router.push({ pathname: "/lobby", query: newQuery })
                      }}
                    />
                  ) : null)
                }
                {
                  (log("render SeekingCard condition", { seekingRuleType }),
                  seekingRuleType ? (
                    <SeekingCard
                      ruleType={seekingRuleType}
                      onCancel={handleCancelSeeking}
                    />
                  ) : null)
                }
              </div>
            </GroupBox>
          </div>
          <div className="lg:col-span-1">
            <LiveMatchesPanel />
          </div>
        </div>
        <PlayModal
          isOpen={!!modalTable}
          onClose={() => setModalTable(null)}
          tableId={modalTable?.id || ""}
          ruleType={modalTable?.ruleType || "nineball"}
        />
      </div>
    </>
  )
}
