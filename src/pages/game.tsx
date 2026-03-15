import React, { useState } from "react"
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

export default function Game() {
  const { userId, userName } = useUser()
  const { users, activeGames } = useMessaging()
  const presenceCount = users.length
  const [snookerReds, setSnookerReds] = useState(3)
  const [threecushionRaceTo, setThreecushionRaceTo] = useState(3)

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
          <MatchHistoryList liveGames={activeGames} />
        </div>
      </main>
    </div>
  )
}
