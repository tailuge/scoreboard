import React from "react"
import {
  ButtonOptionsPlaceholder,
  RaceToButtons,
  RedBallButtons,
} from "./GameButtonOptions"
import { GameButton, ActionButton } from "./GameButtons"

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

export function GameGrid({
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

        let gameButtonChildren: React.ReactNode = null
        if (game.ruleType === "snooker") {
          gameButtonChildren = (
            <RedBallButtons
              selectedValue={snookerReds}
              onChange={onSnookerRedsChange}
            />
          )
        } else if (game.ruleType === "nineball") {
          gameButtonChildren = <ButtonOptionsPlaceholder />
        } else if (game.ruleType === "threecushion") {
          gameButtonChildren = (
            <RaceToButtons
              selectedValue={threecushionRaceTo}
              onChange={onThreecushionRaceToChange}
            />
          )
        }

        return (
          <div key={game.name} className="flex flex-col gap-1 items-center">
            <GameButton
              icon={game.icon}
              alt={game.alt}
              href={highscoreUrl}
              ariaLabel={`Play ${game.name}`}
            >
              {gameButtonChildren}
            </GameButton>
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
            {game.ruleType === "nineball" && (
              <ActionButton
                href={`${highscoreUrl}&bot=true`}
                hoverBorderColor="hover:border-purple-500"
                hoverTextColor="hover:text-purple-400"
              >
                Play vs Bot
              </ActionButton>
            )}
          </div>
        )
      })}
    </div>
  )
}
