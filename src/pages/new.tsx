import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import React, { useState } from "react"
import { GroupBox } from "@/components/GroupBox"
import { OnlineUsersPopover } from "@/components/OnlineUsersPopover"
import { User } from "@/components/User"
import { usePresenceList } from "@/components/hooks/usePresenceList"
import { useUser } from "@/contexts/UserContext"
import { RecentGamesList } from "@/components/RecentGamesList"

const GAMES = [
  {
    name: "Nine Ball",
    icon: "/nineball_icon.png",
    alt: "Play 9-Ball pool online",
    ruleType: "nineball",
    layout: "left" as const,
    options: {
      type: "variant" as const,
      values: ["Standard", "Any"],
      defaultValue: "Standard",
    },
  },
  {
    name: "Snooker",
    icon: "/snooker_icon.png",
    alt: "Play classic Snooker billiards",
    ruleType: "snooker",
    layout: "right" as const,
    options: {
      type: "reds" as const,
      values: [3, 6, 15],
      defaultValue: 6,
    },
  },
  {
    name: "Three Cushion",
    icon: "/threecushion_icon.png",
    alt: "Play Three Cushion billiards",
    ruleType: "threecushion",
    layout: "left" as const,
    options: {
      type: "raceTo" as const,
      values: [3, 5, 7],
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
  readonly selectedValue: string | number
  readonly onChange: (value: string | number) => void
}) {
  return (
    <div
      className="flex gap-4 flex-wrap"
      role="radiogroup"
      aria-label="Game Options"
    >
      {options.values.map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={selectedValue === value}
          onClick={() => onChange(value)}
          className="group flex items-center gap-2 cursor-pointer"
        >
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedValue === value
              ? "border-cyan-accent bg-cyan-accent/20"
              : "border-gray-500 group-hover:border-gray-400"
            }`}>
            {selectedValue === value && <div className="w-2 h-2 rounded-full bg-cyan-accent" />}
          </div>
          <span className={`text-sm font-mono-data ${selectedValue === value ? "text-cyan-accent" : "text-gray-400 group-hover:text-gray-300"
            }`}>
            {options.type === "reds"
              ? `${value}` // Just number for compactness in Snooker
              : options.type === "raceTo"
                ? `Race to ${value}`
                : value}
          </span>

        </button>
      ))}
    </div>
  )
}

function ActionButtons({
  game,
  optionsState,
  userName,
}: {
  readonly game: Game
  readonly optionsState: string | number
  readonly userName: string
}) {
  // ... (URL generation logic remains the same)
  const onlineParams = new URLSearchParams({
    action: "join",
    ruletype: game.ruleType,
  })

  if (game.options.type === "reds") {
    onlineParams.set("reds", String(optionsState))
  } else if (game.options.type === "raceTo") {
    onlineParams.set("raceTo", String(optionsState))
  } else if (game.options.type === "variant") {
    onlineParams.set("variant", String(optionsState).toLowerCase())
  }
  const onlineHref = `/lobby?${onlineParams.toString()}`

  const practiceParams = new URLSearchParams({
    ruletype: game.ruleType,
    playername: userName,
  })
  if (game.options.type === "reds") {
    practiceParams.set("reds", String(optionsState))
  } else if (game.options.type === "raceTo") {
    practiceParams.set("raceTo", String(optionsState))
  }
  const practiceHref = `https://tailuge.github.io/billiards/dist/?${practiceParams.toString()}`

  return (
    <div className="flex gap-3 mt-auto w-full">
      <Link
        href={onlineHref}
        className="flex-1 py-3 px-2 rounded-lg bg-gunmetal/60 border border-gunmetal hover:border-cyan-accent/50 text-gray-300 hover:text-cyan-accent font-semibold text-center transition-all duration-200 hover:bg-gunmetal/80 uppercase text-xs tracking-wider"
        aria-label={`Play ${game.name} Online`}
      >
        Play
      </Link>
      <a
        href={practiceHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 py-3 px-2 rounded-lg bg-gunmetal/60 border border-gunmetal hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-center transition-all duration-200 hover:bg-gunmetal/80 uppercase text-xs tracking-wider"
        aria-label={`Practice ${game.name}`}
      >
        Practice
      </a>
    </div>
  )
}

function GameCard({ game, userName }: GameCardProps) {
  const [selectedValue, setSelectedValue] = useState<string | number>(
    game.options.defaultValue
  )

  const isLeft = game.layout === "left"

  return (
    <div className="relative bg-gradient-to-br from-[#0a1f1c] to-[#050505] border border-white/5 rounded-xl p-4 my-2 overflow-visible shadow-lg">
      {/* Use flex-row ALWAYS, never flex-col */}
      <div className={`flex flex-row items-stretch ${isLeft ? '' : 'flex-row-reverse'} gap-3`}>

        {/* Overhanging Icon - Fixed width, never wraps */}
        <div className={`relative w-24 flex-shrink-0 flex flex-col justify-start z-10 ${isLeft ? '-ml-8' : '-mr-8'}`}>
          <div className="w-20 h-20 bg-[#05100e] rounded-full border border-white/10 p-2 shadow-xl flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={game.icon}
                alt={game.alt}
                fill
                className="object-contain p-1"
                sizes="80px"
                priority
              />
            </div>
          </div>
        </div>

        {/* Content - Takes remaining width */}
        <div className={`flex-1 flex flex-col gap-2 min-w-0 ${isLeft ? 'items-start' : 'items-end text-right'}`}>
          <h2 className="text-xl font-bold text-gray-100 leading-none mt-1">{game.name}</h2>

          <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'} w-full mb-2`}>
            <OptionSelector
              options={game.options}
              selectedValue={selectedValue}
              onChange={setSelectedValue}
            />
          </div>

          <div className="w-full mt-auto pt-2">
            <ActionButtons
              game={game}
              optionsState={selectedValue}
              userName={userName}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

export default function New() {
  const { userId, userName } = useUser()
  const { users: presenceUsers, count: presenceCount } = usePresenceList(
    userId,
    userName
  )

  return (
    <div className="min-h-screen flex flex-col items-center p-3 font-display bg-midnight-emerald">
      <Head>
        <title>New Game | Play Billiards Online</title>
        <meta
          name="description"
          content="Choose your game and start playing. Snooker, 9-Ball, and Three Cushion."
        />
      </Head>

      {/* Compact Header */}
      <div className="w-full max-w-lg mb-4 flex justify-between items-center sticky top-2 z-50 bg-[#05100e]/90 backdrop-blur-md py-2 px-4 rounded-full border border-white/10 shadow-lg">
        <User />
        <OnlineUsersPopover
          count={presenceCount}
          users={presenceUsers}
          totalCount={presenceCount}
          currentUserId={userId}
        />
      </div>

      {/* Main Content - Single Column on Mobile */}
      <div className="w-full max-w-lg flex flex-col gap-6 pb-8">

        {/* Game Cards */}
        <div className="flex flex-col gap-4 pl-2 pr-2">
          {GAMES.map((game) => (
            <GameCard key={game.ruleType} game={game} userName={userName} />
          ))}
        </div>

        {/* Recent Games */}
        <div className="flex flex-col">
          <RecentGamesList />
        </div>
      </div>
    </div>
  )
}
