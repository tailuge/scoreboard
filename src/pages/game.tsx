import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { GroupBox } from "../components/GroupBox"
import { OnlineCount } from "../components/OnlineCount"
import { useServerStatus } from "@/components/hooks/useServerStatus"
import LeaderboardTable from "@/components/LeaderboardTable"
import { STATUS_PAGE_URL } from "@/utils/constants"

const GAMES = [
  {
    name: "Snooker",
    icon: "/snooker_icon.png",
    alt: "Snooker Icon",
    highscoreUrl: "https://tailuge.github.io/billiards/dist/?ruletype=snooker",
    ruleType: "snooker",
  },
  {
    name: "Nine Ball",
    icon: "/nineball_icon.png",
    alt: "Nine Ball Icon",
    highscoreUrl: "https://tailuge.github.io/billiards/dist/?ruletype=nineball",
    ruleType: "nineball",
  },
  {
    name: "Three Cushion",
    icon: "/threecushion_icon.png",
    alt: "Three Cushion Icon",
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
}: {
  readonly hoverBorderColor: string
  readonly isHighscore?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {GAMES.map((game) => (
        <div
          key={`${game.name}-${isHighscore ? "highscore" : "online"}`}
          className="flex flex-col gap-2 items-center"
        >
          <GameButton
            icon={game.icon}
            alt={game.alt}
            hoverBorderColor={hoverBorderColor}
            href={
              isHighscore
                ? game.highscoreUrl
                : `/lobby?action=join&gameType=${game.ruleType}`
            }
            ariaLabel={
              isHighscore ? `Play ${game.name}` : `Play ${game.name} Online`
            }
          />
          {isHighscore && (
            <div className="mt-2 w-full h-[84px] text-gray-500 text-sm overflow-hidden">
              <LeaderboardTable
                ruleType={game.ruleType}
                limit={3}
                compact={true}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Game() {
  const { activeUsers } = useServerStatus(STATUS_PAGE_URL)

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Select a Game</title>
        <meta name="description" content="Choose your game mode" />
      </Head>

      <div className="flex flex-col gap-6 w-full max-w-lg items-center h-full justify-center">
        <GroupBox title="Highscore Challenge">
          <GameGrid
            hoverBorderColor="hover:border-blue-500"
            isHighscore={true}
          />
        </GroupBox>
        <GroupBox
          title="2-Player Online"
          rightBadge={
            activeUsers === null ? null : <OnlineCount count={activeUsers} />
          }
        >
          <GameGrid hoverBorderColor="hover:border-green-500" />
        </GroupBox>
      </div>
    </div>
  )
}
