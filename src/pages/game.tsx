import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Seo } from "@/components/Seo"
import { GroupBox } from "../components/GroupBox"
import { OnlineUsersPopover } from "../components/OnlineUsersPopover"
import { User } from "@/components/User"
import { useUser } from "@/contexts/UserContext"
import { MatchHistoryList } from "@/components/MatchHistoryList"
import { GameGrid } from "@/components/GameGrid"
import { LogoSection } from "@/components/LogoSection"
import { HighscoreGrid } from "@/components/HighscoreGrid"
import { GameBackground } from "@/components/GameBackground"
import { useMessaging } from "@/contexts/MessagingContext"
import { ChallengeCard } from "@/components/ChallengeCard"
import { navigateTo } from "@/utils/navigation"
import { markUsage } from "@/utils/usage"
import { GameUrl, type RematchParam } from "@/utils/GameUrl"
import { GAME_TYPES } from "@/config"
import type { PresenceMessage, RematchInfo } from "@tailuge/messaging"

export default function Game() {
  const { userId, userName } = useUser()
  const {
    users,
    activeGames,
    pendingChallenge,
    incomingChallenge,
    acceptedChallenge,
    challenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    updatePresence,
    clearAcceptedChallenge,
  } = useMessaging()
  const presenceCount = users.length
  const [snookerReds, setSnookerReds] = useState(3)
  const [threecushionRaceTo, setThreecushionRaceTo] = useState(3)
  const [rematchParam, setRematchParam] = useState<RematchParam | null>(null)
  const [hasAttemptedRematch, setHasAttemptedRematch] = useState(false)
  const [selectedOpponent, setSelectedOpponent] =
    useState<PresenceMessage | null>(null)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [challengeBusy, setChallengeBusy] = useState(false)
  const lastOutgoingChallengeRef = React.useRef<{
    tableId: string
    recipientId: string
    ruleType: string
  } | null>(null)

  const ruleTypeLabels = useMemo(
    () =>
      GAME_TYPES.reduce<Record<string, string>>((acc, game) => {
        acc[game.ruleType] = game.name
        return acc
      }, {}),
    []
  )

  const pendingRecipientName = useMemo(() => {
    if (!pendingChallenge) return null
    return users.find((user) => user.userId === pendingChallenge.recipientId)
      ?.userName
  }, [pendingChallenge, users])

  const openGameWindow = useCallback(
    (
      tableId: string,
      ruleType: string,
      shouldStartFirst: boolean,
      rematch?: RematchParam
    ) => {
      if (!userId || !userName) {
        console.log("[challenge] open blocked: missing user identity", {
          userId,
          userName,
        })
        return
      }
      const target = GameUrl.create({
        tableId,
        userName,
        userId,
        ruleType,
        isCreator: shouldStartFirst,
        rematch,
      })
      console.log("[challenge] redirecting to game", {
        tableId,
        ruleType,
        shouldStartFirst,
        target: target.toString(),
      })
      navigateTo(target.toString())
    },
    [userId, userName]
  )

  const resolveIsFirstPlayer = useCallback(
    (rematch: RematchInfo | undefined, challengerId: string) =>
      (rematch?.nextTurnId ?? challengerId) === userId,
    [userId]
  )

  const updatePresenceForTable = useCallback(
    async (tableId: string, ruleType: string, opponentId: string) => {
      try {
        await updatePresence({ tableId, ruleType, opponentId })
      } catch (error) {
        console.error("Failed to update presence for table", error)
      }
    },
    [updatePresence]
  )

  const handleSelectRuleType = useCallback(
    async (ruleType: string) => {
      if (!selectedOpponent) return
      setChallengeBusy(true)
      setChallengeError(null)
      try {
        const tableId = await challenge(selectedOpponent.userId, ruleType)
        markUsage("createTable")
        lastOutgoingChallengeRef.current = {
          tableId,
          recipientId: selectedOpponent.userId,
          ruleType,
        }
        console.log("[challenge] offer sent", {
          tableId,
          recipientId: selectedOpponent.userId,
          ruleType,
        })
        setSelectedOpponent(null)
      } catch (error) {
        console.error("Failed to send challenge", error)
        setChallengeError("Failed to send challenge. Please try again.")
      } finally {
        setChallengeBusy(false)
      }
    },
    [challenge, selectedOpponent]
  )

  const handleAcceptChallenge = useCallback(async () => {
    if (!incomingChallenge) return
    if (!incomingChallenge.tableId) {
      setChallengeError("Challenge is missing table information.")
      return
    }
    setChallengeBusy(true)
    setChallengeError(null)
    try {
      await acceptChallenge(
        incomingChallenge.challengerId,
        incomingChallenge.ruleType,
        incomingChallenge.tableId
      )
      markUsage("joinTable")
      await updatePresenceForTable(
        incomingChallenge.tableId,
        incomingChallenge.ruleType,
        incomingChallenge.challengerId
      )
      // If it's a rematch, check if we should go first
      const isFirst = resolveIsFirstPlayer(
        incomingChallenge.rematch,
        incomingChallenge.challengerId
      )
      const rematchParam: RematchParam | undefined = incomingChallenge.rematch
        ? {
            opponentId: incomingChallenge.challengerId,
            opponentName: incomingChallenge.challengerName,
            ruleType: incomingChallenge.ruleType,
            lastScores: incomingChallenge.rematch.lastScores,
            nextTurnId: incomingChallenge.rematch.nextTurnId,
          }
        : undefined
      openGameWindow(
        incomingChallenge.tableId,
        incomingChallenge.ruleType,
        isFirst,
        rematchParam
      )
    } catch (error) {
      console.error("Failed to accept challenge", error)
      setChallengeError("Failed to accept challenge. Please try again.")
    } finally {
      setChallengeBusy(false)
    }
  }, [
    acceptChallenge,
    incomingChallenge,
    openGameWindow,
    updatePresenceForTable,
    resolveIsFirstPlayer,
  ])

  const handleDeclineChallenge = useCallback(async () => {
    if (!incomingChallenge) return
    setChallengeBusy(true)
    setChallengeError(null)
    try {
      await declineChallenge(
        incomingChallenge.challengerId,
        incomingChallenge.ruleType
      )
    } catch (error) {
      console.error("Failed to decline challenge", error)
      setChallengeError("Failed to decline challenge. Please try again.")
    } finally {
      setChallengeBusy(false)
    }
  }, [declineChallenge, incomingChallenge])

  const handleCancelChallenge = useCallback(async () => {
    if (!pendingChallenge) return
    setChallengeBusy(true)
    setChallengeError(null)
    try {
      await cancelChallenge(
        pendingChallenge.recipientId,
        pendingChallenge.ruleType
      )
      lastOutgoingChallengeRef.current = null
    } catch (error) {
      console.error("Failed to cancel challenge", error)
      setChallengeError("Failed to cancel challenge. Please try again.")
    } finally {
      setChallengeBusy(false)
    }
  }, [cancelChallenge, pendingChallenge])

  useEffect(() => {
    const url = new URL(globalThis.location.href)
    const parsed = GameUrl.parseRematch(url)
    if (parsed) {
      setRematchParam(parsed)
    }
  }, [])

  useEffect(() => {
    if (
      !rematchParam ||
      !userId ||
      challengeBusy ||
      hasAttemptedRematch ||
      pendingChallenge ||
      incomingChallenge ||
      acceptedChallenge
    )
      return

    const isTargetOnline = users.some(
      (u) => u.userId === rematchParam.opponentId
    )
    if (!isTargetOnline) return

    const sendAutoRematch = async () => {
      setChallengeBusy(true)
      setHasAttemptedRematch(true)
      try {
        const info: RematchInfo = {
          lastScores: rematchParam.lastScores,
          isRematch: true,
          nextTurnId: rematchParam.nextTurnId,
        }
        const tableId = await challenge(
          rematchParam.opponentId,
          rematchParam.ruleType,
          info
        )
        markUsage("createTable")
        lastOutgoingChallengeRef.current = {
          tableId,
          recipientId: rematchParam.opponentId,
          ruleType: rematchParam.ruleType,
        }
      } catch (e) {
        console.error("Auto rematch failed", e)
      } finally {
        setChallengeBusy(false)
      }
    }
    void sendAutoRematch()
  }, [
    rematchParam,
    userId,
    challengeBusy,
    hasAttemptedRematch,
    users,
    challenge,
    pendingChallenge,
    incomingChallenge,
    acceptedChallenge,
  ])

  useEffect(() => {
    if (
      !incomingChallenge ||
      !rematchParam ||
      challengeBusy ||
      acceptedChallenge
    )
      return

    const isMatch =
      incomingChallenge.rematch &&
      incomingChallenge.challengerId === rematchParam.opponentId &&
      incomingChallenge.ruleType === rematchParam.ruleType

    if (isMatch) {
      console.log("[rematch] auto-accepting mutual rematch", incomingChallenge)
      handleAcceptChallenge()
    }
  }, [
    incomingChallenge,
    rematchParam,
    challengeBusy,
    acceptedChallenge,
    handleAcceptChallenge,
  ])

  useEffect(() => {
    if (!acceptedChallenge || !userId) return
    console.log("[challenge] accept received", {
      acceptedChallenge,
      userId,
    })
    const outgoing = lastOutgoingChallengeRef.current
    const matchesOutgoing =
      outgoing?.tableId === acceptedChallenge.tableId ||
      outgoing?.recipientId === acceptedChallenge.recipientId

    if (!matchesOutgoing && !pendingChallenge) {
      console.log("[challenge] accept ignored (no outgoing match)", {
        acceptedChallenge,
        outgoing,
        pendingChallenge,
      })
      clearAcceptedChallenge()
      return
    }
    if (!acceptedChallenge.tableId) {
      console.log("[challenge] accept missing tableId", {
        acceptedChallenge,
      })
      clearAcceptedChallenge()
      return
    }

    const openAcceptedGame = async () => {
      await updatePresenceForTable(
        acceptedChallenge.tableId,
        acceptedChallenge.ruleType,
        acceptedChallenge.recipientId
      )
      const rematchNextTurnId =
        acceptedChallenge.rematch?.nextTurnId ??
        (rematchParam && rematchParam.ruleType === acceptedChallenge.ruleType
          ? rematchParam.nextTurnId
          : null)

      const isFirst = rematchNextTurnId ? rematchNextTurnId === userId : true

      openGameWindow(
        acceptedChallenge.tableId,
        acceptedChallenge.ruleType,
        isFirst,
        rematchParam
      )
      lastOutgoingChallengeRef.current = null
      clearAcceptedChallenge()
    }

    void openAcceptedGame()
  }, [
    acceptedChallenge,
    userId,
    clearAcceptedChallenge,
    openGameWindow,
    pendingChallenge,
    updatePresenceForTable,
    rematchParam,
  ])

  return (
    <div className="relative min-h-screen p-4 flex flex-col items-center">
      <Seo
        title="Play Billiards Online - Snooker, 9-Ball Pool & Carom Games"
        description="Experience realistic physics in our free open source online billiards games. Play Snooker, 9-Ball, and Three-Cushion carom against players worldwide. 無料のオンラインビリヤード、スヌーカー、9ボール、3クッション。 무료 온라인 당구, 스누커, 9볼, 3쿠션 게임."
        keywords="billiards, snooker, 9-ball, pool, carom, three-cushion, online game, free, open source, ビリヤード, スヌーカー, 9ボール, 3クッション, オンラインゲーム, 無料, 당구, 스누커, 9볼, 3쿠션, 온라인 게임, 무료"
        canonical="https://scoreboard-tailuge.vercel.app/game"
        ogUrl="https://scoreboard-tailuge.vercel.app/game"
      />

      <GameBackground />

      <LogoSection />

      <main className="relative z-10 w-full max-w-6xl mt-20 grid grid-cols-1 gap-6">
        <GroupBox
          title="Play Online"
          leftBadge={<User />}
          rightBadge={
            <div className="flex items-center gap-2">
              <OnlineUsersPopover
                count={presenceCount}
                users={users}
                totalCount={presenceCount}
                currentUserId={userId}
                onChallenge={(user) => {
                  setChallengeError(null)
                  setSelectedOpponent(user)
                }}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 -mt-3">
            {incomingChallenge ? (
              <div
                className="rounded-lg border bg-gray-800/80 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  animation: "challenge-throb 2s ease-in-out infinite",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.2)",
                }}
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                    {incomingChallenge.rematch
                      ? "Incoming Rematch"
                      : "Incoming Challenge"}
                  </p>
                  <p className="text-sm text-gray-200">
                    {incomingChallenge.challengerName} wants to play{" "}
                    {ruleTypeLabels[incomingChallenge.ruleType] ||
                      incomingChallenge.ruleType}
                  </p>
                  {incomingChallenge.rematch ? (
                    <p className="text-xs text-emerald-400 mt-1">
                      {incomingChallenge.rematch.lastScores.map((s, i) => {
                        const isMe = s.userId === userId
                        const name = isMe
                          ? "You"
                          : incomingChallenge.challengerName
                        return (
                          <span key={s.userId}>
                            {name} {s.score}
                            {i === 0 ? " — " : ""}
                          </span>
                        )
                      })}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label="Accept challenge"
                    onClick={handleAcceptChallenge}
                    disabled={challengeBusy}
                    className="rounded-md bg-emerald-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    aria-label="Decline challenge"
                    onClick={handleDeclineChallenge}
                    disabled={challengeBusy}
                    className="rounded-md border border-gray-500/60 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700/60 disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ) : null}

            {pendingChallenge ? (
              <div
                className="rounded-lg border bg-gray-800/70 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                style={{
                  animation: "challenge-throb 2s ease-in-out infinite",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.2)",
                }}
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                    Challenge Sent
                  </p>
                  <p className="text-sm text-gray-200">
                    Waiting for {pendingRecipientName || "opponent"} to accept{" "}
                    {ruleTypeLabels[pendingChallenge.ruleType] ||
                      pendingChallenge.ruleType}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label="Cancel challenge"
                    onClick={handleCancelChallenge}
                    disabled={challengeBusy}
                    className="rounded-md border border-gray-500/60 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700/60 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {selectedOpponent ? (
              <ChallengeCard
                opponentName={selectedOpponent.userName}
                onSelectRule={handleSelectRuleType}
                onCancel={() => setSelectedOpponent(null)}
              />
            ) : null}

            {challengeError ? (
              <p className="text-xs text-red-400">{challengeError}</p>
            ) : null}
          </div>
        </GroupBox>

        <GroupBox title="Play">
          <div className="flex flex-col gap-4 -mt-3">
            <GameGrid
              userName={userName}
              userId={userId}
              snookerReds={snookerReds}
              onSnookerRedsChange={setSnookerReds}
              threecushionRaceTo={threecushionRaceTo}
              onThreecushionRaceToChange={setThreecushionRaceTo}
            />
          </div>
        </GroupBox>

        <div className="grid grid-cols-1 gap-6">
          <GroupBox title="Top Scores" titleHref="/leaderboard">
            <HighscoreGrid className="-mt-3" />
          </GroupBox>
          <MatchHistoryList liveGames={activeGames} />
        </div>
      </main>
    </div>
  )
}
