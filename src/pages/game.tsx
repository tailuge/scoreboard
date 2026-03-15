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
import { GameUrl } from "@/utils/GameUrl"
import { GAME_TYPES } from "@/config"
import type { PresenceMessage } from "@tailuge/messaging"

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
  const [selectedOpponent, setSelectedOpponent] =
    useState<PresenceMessage | null>(null)
  const [challengeError, setChallengeError] = useState<string | null>(null)
  const [challengeBusy, setChallengeBusy] = useState(false)

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
    (tableId: string, ruleType: string, isCreator: boolean) => {
      if (!userId || !userName) return
      const target = GameUrl.create({
        tableId,
        userName,
        userId,
        ruleType,
        isCreator,
      })
      console.log("[challenge] opening game tab", {
        tableId,
        ruleType,
        isCreator,
        target: target.toString(),
      })
      const opened = globalThis.open(target.toString(), "_blank")
      console.log("[challenge] open result", { opened })
    },
    [userId, userName]
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
        await challenge(selectedOpponent.userId, ruleType)
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
      await updatePresenceForTable(
        incomingChallenge.tableId,
        incomingChallenge.ruleType,
        incomingChallenge.challengerId
      )
      openGameWindow(
        incomingChallenge.tableId,
        incomingChallenge.ruleType,
        false
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
    } catch (error) {
      console.error("Failed to cancel challenge", error)
      setChallengeError("Failed to cancel challenge. Please try again.")
    } finally {
      setChallengeBusy(false)
    }
  }, [cancelChallenge, pendingChallenge])

  useEffect(() => {
    if (!acceptedChallenge || !userId) return
    console.log("[challenge] accept received", {
      acceptedChallenge,
      userId,
    })
    if (acceptedChallenge.challengerId !== userId) {
      clearAcceptedChallenge()
      return
    }
    if (!acceptedChallenge.tableId) {
      clearAcceptedChallenge()
      return
    }

    const openAcceptedGame = async () => {
      await updatePresenceForTable(
        acceptedChallenge.tableId,
        acceptedChallenge.ruleType,
        acceptedChallenge.recipientId
      )
      openGameWindow(
        acceptedChallenge.tableId,
        acceptedChallenge.ruleType,
        true
      )
      clearAcceptedChallenge()
    }

    void openAcceptedGame()
  }, [
    acceptedChallenge,
    userId,
    clearAcceptedChallenge,
    openGameWindow,
    updatePresenceForTable,
  ])

  return (
    <div className="relative min-h-screen p-4 flex flex-col items-center">
      <Seo
        title="Play Billiards Online - Snooker, 9-Ball Pool & Carom Games"
        description="Experience realistic physics in our free open source online billiards games. Play Snooker, 9-Ball, and Three-Cushion carom against players worldwide or practice your skills."
        canonical="https://scoreboard-tailuge.vercel.app/game"
        ogUrl="https://scoreboard-tailuge.vercel.app/game"
      />

      <GameBackground />

      <LogoSection />

      <main className="relative z-10 w-full max-w-6xl mt-20 grid grid-cols-1 gap-6">
        <GroupBox
          title="Play"
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
              <div className="rounded-lg border border-cyan-500/40 bg-gray-800/80 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                    Incoming Challenge
                  </p>
                  <p className="text-sm text-gray-200">
                    {incomingChallenge.challengerName} wants to play{" "}
                    {ruleTypeLabels[incomingChallenge.ruleType] ||
                      incomingChallenge.ruleType}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptChallenge}
                    disabled={challengeBusy}
                    className="rounded-md bg-emerald-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
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
              <div className="rounded-lg border border-cyan-500/30 bg-gray-800/70 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
