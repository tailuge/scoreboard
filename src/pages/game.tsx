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

      <h1 className="text-4xl font-bold text-white mb-12">Choose Your Game</h1>

      <div className="flex flex-col gap-12 w-full max-w-6xl items-center">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex flex-wrap justify-center gap-6">
            {games.map((game) => (
              <button
                key={game.name}
                className="group relative flex flex-col items-center justify-center bg-gray-800 p-6 sm:p-8 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 w-full sm:w-64 h-64 sm:h-64 max-w-xs"
                aria-label={`Play ${game.name}`}
              >
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-4 sm:mb-6 transition-transform duration-300 group-hover:rotate-6">
                  <Image
                    src={game.icon}
                    alt={game.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <span className="text-lg sm:text-xl font-semibold text-gray-300 group-hover:text-white transition-colors duration-300">
                  {game.name}
                </span>
              </button>
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide text-center">Highscore Challenge</h2>
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex flex-wrap justify-center gap-6">
            {games.map((game) => (
              <button
                key={`${game.name}-online`}
                className="group relative flex flex-col items-center justify-center bg-gray-800 p-6 sm:p-8 rounded-2xl border-2 border-transparent hover:border-green-500 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 w-full sm:w-64 h-64 sm:h-64 max-w-xs"
                aria-label={`Play ${game.name} Online`}
              >
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-4 sm:mb-6 transition-transform duration-300 group-hover:rotate-6">
                  <Image
                    src={game.icon}
                    alt={game.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <span className="text-lg sm:text-xl font-semibold text-gray-300 group-hover:text-white transition-colors duration-300">
                  {game.name}
                </span>
              </button>
            ))}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide text-center">2-Player Online</h2>
        </div>
      </div>
    </div>
  )
}
