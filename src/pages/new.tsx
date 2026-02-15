import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import React, { useState } from "react"
import { GroupBox } from "@/components/GroupBox"
import { OnlineUsersPopover } from "@/components/OnlineUsersPopover"
import { User } from "@/components/User"
import { usePresenceList } from "@/components/hooks/usePresenceList"
import { useUser } from "@/contexts/UserContext"
import { LiveMatchesPanel } from "@/components/LiveMatchesPanel"
import { MatchHistoryList } from "@/components/MatchHistoryList"

const GAMES = [
  {
    name: "Snooker",
    icon: "/snooker_icon.png",
    alt: "Play classic Snooker billiards online with 22 balls on a full-size table",
    ruleType: "snooker",
    options: {
      type: "reds" as const,
      values: [3, 6, 15],
      defaultValue: 6,
    },
  },
  {
    name: "Nine Ball",
    icon: "/nineball_icon.png",
    alt: "Play 9-Ball pool online - fast-paced pocket billiards game",
    ruleType: "nineball",
    options: null,
  },
  {
    name: "Three Cushion",
    icon: "/threecushion_icon.png",
    alt: "Play Three Cushion carom billiards online - no pockets, hit three rails",
    ruleType: "threecushion",
    options: {
      type: "raceTo" as const,
      values: [3, 5],
      defaultValue: 3,
    },
  },
]

type Game = (typeof GAMES)[number]

type GameCardProps = {
  readonly game: Game
  readonly userName: string
}

function OptionSelector({
  options,
  selectedValue,
  onChange,
}: {
  readonly options: NonNullable<Game["options"]>
  readonly selectedValue: number
  readonly onChange: (value: number) => void
}) {
  return (
    <div
      className="flex gap-2"
      role="radiogroup"
      aria-label={options.type === "reds" ? "Number of red balls" : "Race to"}
    >
      {options.values.map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={selectedValue === value}
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono-data transition-all duration-200 ${
            selectedValue === value
              ? "bg-cyan-accent/20 border border-cyan-accent text-cyan-accent"
              : "bg-gunmetal/30 border border-gunmetal text-gray-400 hover:border-gray-500 hover:text-gray-300"
          }`}
        >
          {options.type === "reds" ? `${value} reds` : `Race to ${value}`}
        </button>
      ))}
    </div>
  )
}

function ActionButtons({
  game,
  reds,
  raceTo,
  userName,
}: {
  readonly game: Game
  readonly reds: number
  readonly raceTo: number
  readonly userName: string
}) {
  const onlineParams = new URLSearchParams({
    action: "join",
    ruletype: game.ruleType,
  })
  if (game.options?.type === "reds") {
    onlineParams.set("reds", String(reds))
  }
  if (game.options?.type === "raceTo") {
    onlineParams.set("raceTo", String(raceTo))
  }
  const onlineHref = `/lobby?${onlineParams.toString()}`

  const practiceParams = new URLSearchParams({
    ruletype: game.ruleType,
    playername: userName,
  })
  if (game.options?.type === "reds") {
    practiceParams.set("reds", String(reds))
  }
  if (game.options?.type === "raceTo") {
    practiceParams.set("raceTo", String(raceTo))
  }
  const practiceHref = `https://tailuge.github.io/billiards/dist/?${practiceParams.toString()}`

  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-4">
      <Link
        href={onlineHref}
        className="flex-1 py-3 px-4 rounded-xl bg-gunmetal/50 border border-gunmetal hover:border-cyan-accent/50 text-gray-300 hover:text-cyan-accent font-semibold text-center transition-all duration-200 hover:bg-gunmetal/70"
        aria-label={`Play ${game.name} Online`}
      >
        Play Online
      </Link>
      <a
        href={practiceHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 py-3 px-4 rounded-xl bg-gunmetal/50 border border-gunmetal hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-center transition-all duration-200 hover:bg-gunmetal/70"
        aria-label={`Practice ${game.name}`}
      >
        Practice
      </a>
    </div>
  )
}

function GameCard({ game, userName }: GameCardProps) {
  const [selectedValue, setSelectedValue] = useState(
    game.options?.defaultValue ?? 0
  )

  const reds = game.options?.type === "reds" ? selectedValue : 6
  const raceTo = game.options?.type === "raceTo" ? selectedValue : 3

  return (
    <GroupBox title={game.name}>
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        {/* Game Icon */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <Image
            src={game.icon}
            alt={game.alt}
            fill
            className="object-contain p-2 transition-transform duration-300 hover:scale-110"
            sizes="96px"
            priority
          />
        </div>

        {/* Options and Actions */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          {/* Options */}
          {game.options && (
            <OptionSelector
              options={game.options}
              selectedValue={selectedValue}
              onChange={setSelectedValue}
            />
          )}

          {/* Action Buttons */}
          <ActionButtons
            game={game}
            reds={reds}
            raceTo={raceTo}
            userName={userName}
          />
        </div>
      </div>
    </GroupBox>
  )
}

export default function New() {
  const { userId, userName } = useUser()
  const { users: presenceUsers, count: presenceCount } = usePresenceList(
    userId,
    userName
  )

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <Head>
        <title>New Game | Play Billiards Online</title>
        <meta
          name="description"
          content="Choose your game and start playing billiards online. Snooker, 9-Ball, and Three Cushion available."
        />
      </Head>

      {/* Header Bar */}
      <div className="w-full max-w-6xl mb-4 flex justify-between items-center sticky top-0 z-50 bg-midnight-emerald/80 backdrop-blur-md py-1 px-4 -mx-4 rounded-xl">
        <User />
        <OnlineUsersPopover
          count={presenceCount}
          users={presenceUsers}
          totalCount={presenceCount}
          currentUserId={userId}
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {GAMES.map((game) => (
            <GameCard key={game.ruleType} game={game} userName={userName} />
          ))}
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <LiveMatchesPanel />
          <MatchHistoryList />
        </div>
      </div>
    </div>
  )
}
