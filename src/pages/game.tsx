import Head from "next/head"
import React, { useState } from "react"
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

export default function Game() {
  const { userId, userName } = useUser()
  const { users: presenceUsers, count: presenceCount } = usePresenceList(
    userId,
    userName
  )
  const { tables, tableAction } = useLobbyTables(userId, userName)
  const [snookerReds, setSnookerReds] = useState(3)
  const [threecushionRaceTo, setThreecushionRaceTo] = useState(3)

  const handleSpectate = async (tableId: string) => {
    await tableAction(tableId, "spectate")
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center p-4 bg-[var(--background)]">
      <Head>
        <title>Play Billiards Online | Free Snooker, Pool & Carom Games</title>
        <meta
          name="description"
          content="Play free online billiards games! Choose from Snooker, 9-Ball, and Three Cushion. Challenge high scores or compete against players worldwide in multiplayer matches."
        />
        <link
          rel="canonical"
          href="https://scoreboard-tailuge.vercel.app/game"
        />
        <meta
          property="og:title"
          content="Play Billiards Online | Free Snooker, Pool & Carom Games"
        />
        <meta
          property="og:description"
          content="Play free online billiards games! Choose from Snooker, 9-Ball, and Three Cushion. Challenge high scores or compete against players worldwide in multiplayer matches."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://scoreboard-tailuge.vercel.app/game"
        />
        <meta
          property="og:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Play Billiards Online | Free Snooker, Pool & Carom Games"
        />
        <meta
          name="twitter:description"
          content="Play free online billiards games! Choose from Snooker, 9-Ball, and Three Cushion. Challenge high scores or compete against players worldwide in multiplayer matches."
        />
        <meta
          name="twitter:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
      </Head>

      <LogoSection />

      <div className="relative z-10 w-full max-w-6xl mt-20 grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-4">
          <GroupBox
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
            <div className="-mt-3">
              <GameGrid
                userName={userName}
                snookerReds={snookerReds}
                onSnookerRedsChange={setSnookerReds}
                threecushionRaceTo={threecushionRaceTo}
                onThreecushionRaceToChange={setThreecushionRaceTo}
              />
            </div>
          </GroupBox>
        </div>
        <div className="flex flex-col gap-4">
          <GroupBox title="Top Scores">
            <HighscoreGrid />
          </GroupBox>
          <MatchHistoryList liveTables={tables} onSpectate={handleSpectate} />
        </div>
      </div>
    </div>
  )
}
