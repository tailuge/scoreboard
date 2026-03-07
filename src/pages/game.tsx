import { useRouter } from "next/router"
import React, { useState, useMemo } from "react"
import { Seo } from "@/components/Seo"
import { GroupBox } from "../components/GroupBox"
import { OnlineUsersPopover } from "../components/OnlineUsersPopover"
import { User } from "@/components/User"
import { usePresenceList } from "@/components/hooks/usePresenceList"
import { useUser } from "@/contexts/UserContext"
import { MatchHistoryList } from "@/components/MatchHistoryList"
import { useLobbyTables } from "@/components/hooks/useLobbyTables"
import { GameGrid } from "@/components/GameGrid"
import { LogoSection } from "@/components/LogoSection"
import { HighscoreGrid } from "@/components/HighscoreGrid"
import { GameBackground } from "@/components/GameBackground"
import { IncomingChallengeBanner } from "@/components/IncomingChallengeBanner"

export default function Game() {
  const { userId, userName } = useUser()
  const router = useRouter()
  const { users: presenceUsers, count: presenceCount } = usePresenceList(
    userId,
    userName
  )

  const incomingChallenge = useMemo(() => {
    return presenceUsers.find((u) => u.opponentId === userId)
  }, [presenceUsers, userId])
  const {
    tables,
    tableAction,
    isLoading: tablesLoading,
  } = useLobbyTables(userId, userName)
  const [snookerReds, setSnookerReds] = useState(3)
  const [threecushionRaceTo, setThreecushionRaceTo] = useState(3)

  const handleSpectate = async (tableId: string) => {
    await tableAction(tableId, "spectate")
  }

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
              {incomingChallenge ? (
                <IncomingChallengeBanner
                  userName={incomingChallenge.userName}
                  onClick={() => {
                    router.push({
                      pathname: "/lobby",
                      query: {
                        ruletype: incomingChallenge.ruletype,
                        opponentId: incomingChallenge.userId,
                        opponentName: incomingChallenge.userName,
                        action: "join",
                      },
                    })
                  }}
                />
              ) : null}
              <OnlineUsersPopover
                count={presenceCount}
                users={presenceUsers}
                totalCount={presenceCount}
                currentUserId={userId}
              />
            </div>
          }
        >
          <div className="-mt-3">
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
          <MatchHistoryList
            liveTables={tables}
            tablesLoading={tablesLoading}
            onSpectate={handleSpectate}
          />
        </div>
      </main>
    </div>
  )
}
