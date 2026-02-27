import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/router"
import { LiveMatchesPanel } from "@/components/LiveMatchesPanel"
import { PlayModal } from "@/components/PlayModal"
import { User } from "@/components/User"
import { GroupBox } from "@/components/GroupBox"
import { OnlineUsersPopover } from "@/components/OnlineUsersPopover"
import { usePresenceList } from "@/components/hooks/usePresenceList"
import Head from "next/head"
import { markUsage } from "@/utils/usage"
import { useUser } from "@/contexts/UserContext"
import { useLobbyTables } from "@/components/hooks/useLobbyTables"
import { useAutoJoin } from "@/components/hooks/useAutoJoin"

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
  const { users: presenceUsers, count: presenceCount } = usePresenceList(
    userId,
    userName
  )

  const [seekingRuleType, setSeekingRuleType] = useState<string | null>(null)
  const [seekingTableId, setSeekingTableId] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const seekingTableIdRef = useRef<string | null>(null)

  useEffect(() => {
    seekingTableIdRef.current = seekingTableId
  }, [seekingTableId])

  const handleCancelSeeking = useCallback(async () => {
    if (seekingTableId) {
      await deleteTable(seekingTableId)
    }
    setSeekingRuleType(null)
    setSeekingTableId(null)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [seekingTableId, deleteTable])

  useEffect(() => {
    if (!router.isReady) return
    markUsage("lobby")
  }, [router.isReady])

  const handleFindOrCreate = useCallback(
    async (ruleType: string) => {
      setSeekingRuleType(ruleType)
      const updatedTable = await findOrCreateTable(ruleType)
      if (updatedTable) {
        if (updatedTable.players.length === 2) {
          setSeekingRuleType(null)
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
    tables.forEach((table) => {
      if (
        table.creator.id === userId &&
        table.players.length === 2 &&
        !table.completed &&
        !shownModals.current.has(table.id)
      ) {
        setSeekingRuleType(null)
        setSeekingTableId(null)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setModalTable({ id: table.id, ruleType: table.ruleType })
        shownModals.current.add(table.id)
      }
    })
  }, [tables, userId])

  // Timeout logic
  useEffect(() => {
    if (seekingRuleType) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(async () => {
        if (seekingTableIdRef.current) {
          await deleteTable(seekingTableIdRef.current)
        }
        setSeekingRuleType(null)
        setSeekingTableId(null)
        router.push("/game")
      }, 60000)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [seekingRuleType, deleteTable, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (seekingTableIdRef.current) {
        fetch(`/api/tables/${seekingTableIdRef.current}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })
      }
    }
  }, [userId])

  return (
    <>
      <Head>
        <title>Multiplayer Billiards Lobby - Play Pool & Snooker Online</title>
        <meta
          name="description"
          content="Find opponents for online billiards matches. Join Snooker, 9-Ball, or Three-Cushion tables and compete in real-time multiplayer games."
        />
        <link
          rel="canonical"
          href="https://scoreboard-tailuge.vercel.app/lobby"
        />
        <meta
          property="og:title"
          content="Multiplayer Billiards Lobby - Play Pool & Snooker Online"
        />
        <meta
          property="og:description"
          content="Find opponents for online billiards matches. Join Snooker, 9-Ball, or Three-Cushion tables and compete in real-time multiplayer games."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://scoreboard-tailuge.vercel.app/lobby"
        />
        <meta
          property="og:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Multiplayer Billiards Lobby - Play Pool & Snooker Online"
        />
        <meta
          name="twitter:description"
          content="Find opponents for online billiards matches. Join Snooker, 9-Ball, or Three-Cushion tables and compete in real-time multiplayer games."
        />
        <meta
          name="twitter:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
      </Head>
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
                {seekingRuleType && (
                  <div className="mx-auto w-full max-w-md rounded-xl border border-cyan-500/40 bg-gray-800/80 p-6 text-center shadow-xl animate-in fade-in zoom-in duration-300 motion-reduce:animate-none">
                    <div className="relative mx-auto mb-5 h-14 w-14">
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-glow-pulse motion-reduce:animate-none"></div>
                      <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-pulse motion-reduce:animate-none"></div>
                      <div className="absolute inset-4 rounded-full bg-cyan-400/20 animate-ping motion-reduce:animate-none"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white text-balance">
                      Finding a {seekingRuleType} opponent…
                    </h3>
                    <p className="mt-2 text-sm text-gray-300">
                      Game will start when opponent is found.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      <button
                        onClick={handleCancelSeeking}
                        className="rounded-lg border border-gray-600 px-6 py-2.5 text-sm font-semibold text-gray-200 transition-colors duration-200 hover:bg-gray-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/60 active:scale-95"
                      >
                        Cancel Search
                      </button>
                    </div>
                  </div>
                )}
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
