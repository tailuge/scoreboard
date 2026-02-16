import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import React, { useState } from "react"
import {
  ButtonOptionsPlaceholder,
  RaceToButtons,
  RedBallButtons,
} from "../components/GameButtonOptions"
import { GroupBox } from "../components/GroupBox"
import { OnlineUsersPopover } from "../components/OnlineUsersPopover"
import { User } from "@/components/User"
import { usePresenceList } from "@/components/hooks/usePresenceList"
import { useUser } from "@/contexts/UserContext"
import LeaderboardTable from "@/components/LeaderboardTable"
import { MatchHistoryList } from "@/components/MatchHistoryList"
import { useLobbyTables } from "@/components/hooks/useLobbyTables"

const GAMES = [
  {
    name: "Snooker",
    icon: "/snooker_icon.png",
    alt: "Play classic Snooker billiards online with 22 balls on a full-size table",
    highscoreUrl: "https://tailuge.github.io/billiards/dist/?ruletype=snooker",
    ruleType: "snooker",
  },
  {
    name: "Nine Ball",
    icon: "/nineball_icon.png",
    alt: "Play 9-Ball pool online - fast-paced pocket billiards game",
    highscoreUrl: "https://tailuge.github.io/billiards/dist/?ruletype=nineball",
    ruleType: "nineball",
  },
  {
    name: "Three Cushion",
    icon: "/threecushion_icon.png",
    alt: "Play Three Cushion carom billiards online - no pockets, hit three rails",
    highscoreUrl:
      "https://tailuge.github.io/billiards/dist/?ruletype=threecushion",
    ruleType: "threecushion",
  },
]

type GameButtonProps = {
  readonly icon: string
  readonly alt: string
  readonly href?: string
  readonly onClick?: () => void
  readonly ariaLabel: string
}

function GameButton({ icon, alt, href, onClick, ariaLabel }: GameButtonProps) {
  const content = (
    <div className="relative w-full h-full p-4 transition-transform duration-300 group-hover:scale-110">
      <Image
        src={icon}
        alt={alt}
        fill
        className="object-contain p-2"
        sizes="(max-width: 768px) 33vw, 20vw"
        priority
      />
    </div>
  )

  const commonClasses = `group relative flex flex-col items-center justify-center bg-gunmetal/30 backdrop-blur-sm rounded-xl border border-gunmetal hover:border-blue-500 hover:bg-gunmetal/50 transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-lg active:shadow-inner active:translate-y-0.5 aspect-square block w-32 h-32`

  if (href) {
    const isInternal = href.startsWith("/")
    if (isInternal) {
      return (
        <Link href={href} className={commonClasses} aria-label={ariaLabel}>
          {content}
        </Link>
      )
    }

    return (
      <a
        href={href}
        className={commonClasses}
        aria-label={ariaLabel}
        target={href.startsWith("http") ? "_blank" : "_self"}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={commonClasses} aria-label={ariaLabel}>
      {content}
    </button>
  )
}

type ActionButtonProps = {
  readonly href: string
  readonly children: React.ReactNode
  readonly hoverBorderColor: string
  readonly hoverTextColor: string
}

function ActionButton({
  href,
  children,
  hoverBorderColor,
  hoverTextColor,
}: ActionButtonProps) {
  const isInternal = href.startsWith("/")

  const commonClasses = `w-32 h-8 flex items-center justify-center bg-gunmetal/30 backdrop-blur-sm rounded border border-gunmetal ${hoverBorderColor} ${hoverTextColor} text-sm transition-colors`

  if (isInternal) {
    return (
      <Link href={href} className={commonClasses}>
        {children}
      </Link>
    )
  }

  return (
    <a
      href={href}
      className={commonClasses}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

function GameGrid({
  userName,
  snookerReds,
  onSnookerRedsChange,
  threecushionRaceTo,
  onThreecushionRaceToChange,
}: {
  readonly userName: string
  readonly snookerReds: number
  readonly onSnookerRedsChange: (value: number) => void
  readonly threecushionRaceTo: number
  readonly onThreecushionRaceToChange: (value: number) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {GAMES.map((game) => {
        let onlineUrl = `/lobby?action=join&ruletype=${game.ruleType}`
        if (game.ruleType === "snooker") {
          onlineUrl += `&reds=${snookerReds}`
        } else if (game.ruleType === "threecushion") {
          onlineUrl += `&raceTo=${threecushionRaceTo}`
        }

        let highscoreUrl = `${game.highscoreUrl}&playername=${encodeURIComponent(userName)}`
        if (game.ruleType === "snooker") {
          highscoreUrl += `&reds=${snookerReds}`
        } else if (game.ruleType === "threecushion") {
          highscoreUrl += `&raceTo=${threecushionRaceTo}`
        }

        return (
          <div key={game.name} className="flex flex-col gap-1 items-center">
            <GameButton
              icon={game.icon}
              alt={game.alt}
              href={highscoreUrl}
              ariaLabel={`Play ${game.name}`}
            />
            {game.ruleType === "snooker" && (
              <RedBallButtons
                selectedValue={snookerReds}
                onChange={onSnookerRedsChange}
              />
            )}
            {game.ruleType === "nineball" && <ButtonOptionsPlaceholder />}
            {game.ruleType === "threecushion" && (
              <RaceToButtons
                selectedValue={threecushionRaceTo}
                onChange={onThreecushionRaceToChange}
              />
            )}
            <ActionButton
              href={highscoreUrl}
              hoverBorderColor="hover:border-blue-500"
              hoverTextColor="hover:text-blue-400"
            >
              Practice
            </ActionButton>
            <ActionButton
              href={onlineUrl}
              hoverBorderColor="hover:border-green-500"
              hoverTextColor="hover:text-green-400"
            >
              Online
            </ActionButton>
            <div className="mt-2 w-full h-[88px] text-gray-500 text-sm overflow-hidden">
              <LeaderboardTable
                ruleType={game.ruleType}
                limit={3}
                compact={true}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
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

      <div className="w-full max-w-6xl mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
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
            <GameGrid
              userName={userName}
              snookerReds={snookerReds}
              onSnookerRedsChange={setSnookerReds}
              threecushionRaceTo={threecushionRaceTo}
              onThreecushionRaceToChange={setThreecushionRaceTo}
            />
          </GroupBox>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <MatchHistoryList liveTables={tables} onSpectate={handleSpectate} />
        </div>
      </div>
    </div>
  )
}
