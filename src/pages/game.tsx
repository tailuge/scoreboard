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
import { GAME_TYPES } from "@/config"
import type { PresenceMessage } from "@tailuge/messaging"
import { useChallengeFlow } from "@/components/hooks/useChallengeFlow"

export default function Game() {
  const { userId, userName } = useUser()
  const { users, activeGames } = useMessaging()
  const {
    pendingChallenge,
    incomingChallenge,
    rematchParam,
    isChallengeBusy,
    challengeError,
    isAutoAccepting,
    sendChallenge,
    acceptChallenge,
    declineChallenge,
    cancelChallenge,
    clearError,
  } = useChallengeFlow()

  const presenceCount = users.length
  const [snookerReds, setSnookerReds] = useState(3)
  const [threecushionRaceTo, setThreecushionRaceTo] = useState(3)
  const [selectedOpponent, setSelectedOpponent] =
    useState<PresenceMessage | null>(null)

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
                  clearError()
                  setSelectedOpponent(user)
                }}
              />
            </div>
          }
        >
          <div className="flex flex-col gap-4 -mt-3">
            {isAutoAccepting && (
              <div className="rounded-lg border border-emerald-500/30 bg-gray-800/80 px-4 py-3 text-center">
                <p className="text-sm font-medium text-emerald-400">
                  Reconnecting to rematch...
                </p>
              </div>
            )}

            {incomingChallenge && !isAutoAccepting ? (
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
                      ? "Rematch Request"
                      : "Incoming Challenge"}
                  </p>
                  <p className="text-sm text-gray-200">
                    {incomingChallenge.challengerName} wants to play{" "}
                    {ruleTypeLabels[incomingChallenge.ruleType] ||
                      incomingChallenge.ruleType}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label="Accept challenge"
                    onClick={acceptChallenge}
                    disabled={isChallengeBusy}
                    className="rounded-md bg-emerald-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    aria-label="Decline challenge"
                    onClick={declineChallenge}
                    disabled={isChallengeBusy}
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
                    onClick={cancelChallenge}
                    disabled={isChallengeBusy}
                    className="rounded-md border border-gray-500/60 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700/60 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {selectedOpponent || rematchParam ? (
              <ChallengeCard
                opponentName={
                  selectedOpponent?.userName || rematchParam?.opponentName
                }
                rematchParam={rematchParam}
                onSelectRule={(ruleType) => {
                  if (rematchParam) {
                    sendChallenge(rematchParam.opponentId, ruleType, {
                      lastScores: rematchParam.lastScores,
                      isRematch: true,
                      nextTurnId: rematchParam.nextTurnId,
                    })
                  } else if (selectedOpponent) {
                    sendChallenge(selectedOpponent.userId, ruleType)
                  }
                  setSelectedOpponent(null)
                }}
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
