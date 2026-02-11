import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import {
  ButtonOptionsPlaceholder,
  RaceToButtons,
  RedBallButtons,
} from "../components/GameButtonOptions"
import { GroupBox } from "../components/GroupBox"
import { OnlineUsersPopover } from "../components/OnlineUsersPopover"
import { User } from "@/components/User"
import { useServerStatus } from "@/components/hooks/useServerStatus"
import { usePresenceList } from "@/components/hooks/usePresenceList"
import { useUser } from "@/contexts/UserContext"
import LeaderboardTable from "@/components/LeaderboardTable"
import { LiveMatchesPanel } from "@/components/LiveMatchesPanel"
import { MatchHistoryList } from "@/components/MatchHistoryList"
import { STATUS_PAGE_URL } from "@/utils/constants"

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
  readonly hoverBorderColor: string
  readonly ariaLabel: string
}

function GameButton({
  icon,
  alt,
  href,
  onClick,
  hoverBorderColor,
  ariaLabel,
}: GameButtonProps) {
  const content = (
    <div className="relative w-full h-full p-4 transition-transform duration-300 group-hover:scale-110">
      <Image
        src={icon}
        alt={alt}
        fill
        className="object-contain p-2"
        sizes="(max-width: 768px) 33vw, 20vw"
        loading="eager"
      />
    </div>
  )

  const commonClasses = `group relative flex flex-col items-center justify-center bg-gray-800 rounded-xl border border-gray-700 ${hoverBorderColor} hover:bg-gray-750 transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-lg active:shadow-inner active:translate-y-0.5 aspect-square block w-32 h-32`

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

function GameGrid({
  hoverBorderColor,
  isHighscore = false,
  userName,
}: {
  readonly hoverBorderColor: string
  readonly isHighscore?: boolean
  readonly userName: string
}) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {GAMES.map((game) => {
        const href = isHighscore
          ? `${game.highscoreUrl}&playername=${encodeURIComponent(userName)}`
          : `/lobby?action=join&ruletype=${game.ruleType}`
        const isInternal = !isHighscore

        return (
          <div
            key={`${game.name}-${isHighscore ? "highscore" : "online"}`}
            className="flex flex-col gap-1 items-center"
          >
            <GameButton
              icon={game.icon}
              alt={game.alt}
              hoverBorderColor={hoverBorderColor}
              href={href}
              ariaLabel={
                isHighscore ? `Play ${game.name}` : `Play ${game.name} Online`
              }
            />
            {game.ruleType === "snooker" && (
              <RedBallButtons baseUrl={href} isInternal={isInternal} />
            )}
            {game.ruleType === "nineball" && <ButtonOptionsPlaceholder />}
            {game.ruleType === "threecushion" && (
              <RaceToButtons baseUrl={href} isInternal={isInternal} />
            )}
            {isHighscore && (
              <div className="mt-2 w-full h-[88px] text-gray-500 text-sm overflow-hidden">
                <LeaderboardTable
                  ruleType={game.ruleType}
                  limit={3}
                  compact={true}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Game() {
  const { activeUsers } = useServerStatus(STATUS_PAGE_URL)
  const { userId, userName } = useUser()
  const { users: presenceUsers } = usePresenceList(userId, userName)

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
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
            title="2-Player Online"
            leftBadge={<User />}
            rightBadge={
              activeUsers === null ? null : (
                <OnlineUsersPopover
                  count={activeUsers}
                  users={presenceUsers}
                  totalCount={activeUsers}
                  currentUserId={userId}
                />
              )
            }
          >
            <GameGrid
              hoverBorderColor="hover:border-green-500"
              userName={userName}
            />
          </GroupBox>
          <GroupBox title="Highscore Challenge">
            <GameGrid
              hoverBorderColor="hover:border-blue-500"
              isHighscore={true}
              userName={userName}
            />
          </GroupBox>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <LiveMatchesPanel />
          <MatchHistoryList />
        </div>
      </div>
    </div>
  )
}
