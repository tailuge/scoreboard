import React from "react"
import {
  ButtonOptionsPlaceholder,
  RaceToButtons,
  RedBallButtons,
} from "./GameButtonOptions"
import { GameButton, ActionButton } from "./GameButtons"
import { GameUrl } from "@/utils/GameUrl"

const GAMES = [
  {
    name: "Snooker",
    icon: "/snooker_icon.png",
    alt: "Play classic Snooker billiards online with 22 balls on a full-size table",
    ruleType: "snooker",
  },
  {
    name: "Nine Ball",
    icon: "/nineball_icon.png",
    alt: "Play 9-Ball pool online - fast-paced pocket billiards game",
    ruleType: "nineball",
  },
  {
    name: "Three Cushion",
    icon: "/threecushion_icon.png",
    alt: "Play Three Cushion carom billiards online - no pockets, hit three rails",
    ruleType: "threecushion",
  },
]

export function GameGrid({
  userName,
  userId,
  snookerReds,
  onSnookerRedsChange,
  threecushionRaceTo,
  onThreecushionRaceToChange,
}: {
  readonly userName: string
  readonly userId: string
  readonly snookerReds: number
  readonly onSnookerRedsChange: (value: number) => void
  readonly threecushionRaceTo: number
  readonly onThreecushionRaceToChange: (value: number) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full">
      {GAMES.map((game) => {
        const extras: Record<string, string> = {}
        if (game.ruleType === "snooker") {
          extras.reds = String(snookerReds)
        } else if (game.ruleType === "threecushion") {
          extras.raceTo = String(threecushionRaceTo)
        }

        const practiceUrl = GameUrl.createSinglePlayer({
          userName,
          userId,
          ruleType: game.ruleType,
          extras,
        })

        const botUrl = GameUrl.createSinglePlayer({
          userName,
          userId,
          ruleType: game.ruleType,
          isBot: true,
          extras,
        })

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
              href={practiceUrl.toString()}
              ariaLabel={`Play ${game.name}`}
            >
              {gameButtonChildren}
            </GameButton>
            <ActionButton
              href={practiceUrl.toString()}
              hoverBorderColor="hover:border-blue-500"
              hoverTextColor="hover:text-blue-400"
            >
              Practice
            </ActionButton>
            {game.ruleType === "nineball" && (
              <ActionButton
                href={botUrl.toString()}
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
