import Head from "next/head"
import Image from "next/image"
import React from "react"

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
  readonly name: string
  readonly icon: string
  readonly alt: string
  readonly href?: string
  readonly onClick?: () => void
  readonly hoverBorderColor: string
  readonly ariaLabel: string
}

function GameButton({
  name,
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

  const commonClasses = `group relative flex flex-col items-center justify-center bg-gray-800 rounded-xl border border-gray-700 ${hoverBorderColor} hover:bg-gray-750 transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-lg active:shadow-inner active:translate-y-0.5 aspect-square block w-full h-full`

  if (href) {
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

function GameSection({
  title,
  hoverBorderColor,
  isHighscore = false,
}: {
  readonly title: string
  readonly hoverBorderColor: string
  readonly isHighscore?: boolean
}) {
  return (
    <div className="relative w-full border border-gray-700/50 rounded-3xl p-6 bg-gray-800/20 shadow-inner">
      <h2 className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-4 text-xs font-light text-gray-400 tracking-wide uppercase">
        {title}
      </h2>
      <div className="grid grid-cols-3 gap-4 w-full">
        {GAMES.map((game) => (
          <GameButton
            key={`${game.name}-${title}`}
            name={game.name}
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
        ))}
      </div>
    </div>
  )
}

export default function Game() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Select a Game</title>
        <meta name="description" content="Choose your game mode" />
      </Head>

      <div className="flex flex-col gap-6 w-full max-w-lg items-center h-full justify-center">
        <GameSection
          title="Highscore Challenge"
          hoverBorderColor="hover:border-blue-500"
          isHighscore={true}
        />
        <GameSection
          title="2-Player Online"
          hoverBorderColor="hover:border-green-500"
        />
      </div>
    </div>
  )
}
