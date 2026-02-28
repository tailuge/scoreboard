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
    <div className="relative min-h-screen p-4 flex flex-col items-center">
      <Head>
        <title>Play Billiards Online - Snooker, 9-Ball Pool & Carom Games</title>
        <meta
          name="description"
          content="Experience realistic physics in our free online billiards games. Play Snooker, 9-Ball, and Three-Cushion carom against players worldwide or practice your skills."
        />
        <link
          rel="canonical"
          href="https://scoreboard-tailuge.vercel.app/game"
        />
        <meta
          property="og:title"
          content="Play Billiards Online - Snooker, 9-Ball Pool & Carom Games"
        />
        <meta
          property="og:description"
          content="Experience realistic physics in our free online billiards games. Play Snooker, 9-Ball, and Three-Cushion carom against players worldwide or practice your skills."
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
          content="Play Billiards Online - Snooker, 9-Ball Pool & Carom Games"
        />
        <meta
          name="twitter:description"
          content="Experience realistic physics in our free online billiards games. Play Snooker, 9-Ball, and Three-Cushion carom against players worldwide or practice your skills."
        />
        <meta
          name="twitter:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
      </Head>

      {/* Static Background */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          // To adjust darkness, change the alpha value (0.5) in the rgba colors below.
          // 0.0 is fully transparent (original image), 1.0 is fully black.
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(/assets/bg.jpg)",
          backgroundSize: "100% auto",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          backgroundPosition: "top center",
        }}
      />

      <LogoSection />

      <main className="relative z-10 w-full max-w-6xl mt-20 grid grid-cols-1 gap-6">
        <GroupBox
        title="Play"
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
              userId={userId}
              snookerReds={snookerReds}
              onSnookerRedsChange={setSnookerReds}
              threecushionRaceTo={threecushionRaceTo}
              onThreecushionRaceToChange={setThreecushionRaceTo}
            />
          </div>
        </GroupBox>

        <div className="grid grid-cols-1 gap-6">
          <GroupBox title="Top Scores">
            <HighscoreGrid />
          </GroupBox>
          <MatchHistoryList liveTables={tables} onSpectate={handleSpectate} />
        </div>
      </main>
    </div>
  )
}
