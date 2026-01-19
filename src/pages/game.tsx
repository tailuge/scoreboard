import Head from "next/head"
import Image from "next/image"
import React from "react"

export default function Game() {
  const games = [
    { name: "Snooker", icon: "/snooker_icon.png", alt: "Snooker Icon" },
    { name: "Nine Ball", icon: "/nineball_icon.png", alt: "Nine Ball Icon" },
    {
      name: "Three Cushion",
      icon: "/threecushion_icon.png",
      alt: "Three Cushion Icon",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Head>
        <title>Select a Game</title>
        <meta name="description" content="Choose your game mode" />
      </Head>

      <div className="flex flex-col gap-6 w-full max-w-lg items-center h-full justify-center">

        {/* Highscore Challenge Group */}
        <div className="flex flex-col items-center gap-4 w-full border border-gray-700/50 rounded-3xl p-6 bg-gray-800/20 shadow-inner">
          <div className="grid grid-cols-3 gap-4 w-full">
            {games.map((game) => (
              <button
                key={game.name}
                className="group relative flex flex-col items-center justify-center bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-lg active:shadow-inner active:translate-y-0.5 aspect-square"
                aria-label={`Play ${game.name}`}
              >
                <div className="relative w-full h-full p-4 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={game.icon}
                    alt={game.alt}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                </div>
              </button>
            ))}
          </div>
          <h2 className="text-xl font-medium text-gray-400 tracking-wide text-center uppercase text-sm">Highscore Challenge</h2>
        </div>

        {/* 2-Player Online Group */}
        <div className="flex flex-col items-center gap-4 w-full border border-gray-700/50 rounded-3xl p-6 bg-gray-800/20 shadow-inner">
          <div className="grid grid-cols-3 gap-4 w-full">
            {games.map((game) => (
              <button
                key={`${game.name}-online`}
                className="group relative flex flex-col items-center justify-center bg-gray-800 rounded-xl border border-gray-700 hover:border-green-500 hover:bg-gray-750 transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-lg active:shadow-inner active:translate-y-0.5 aspect-square"
                aria-label={`Play ${game.name} Online`}
              >
                <div className="relative w-full h-full p-4 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src={game.icon}
                    alt={game.alt}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 33vw, 20vw"
                  />
                </div>
              </button>
            ))}
          </div>
          <h2 className="text-xl font-medium text-gray-400 tracking-wide text-center uppercase text-sm">2-Player Online</h2>
        </div>
      </div>
    </div>
  )
}
