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

      <div className="flex flex-col md:flex-row gap-8">
        {games.map((game) => (
          <button
            key={game.name}
            className="group relative flex flex-col items-center justify-center bg-gray-800 p-8 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 w-64 h-64"
            aria-label={`Play ${game.name}`}
          >
            <div className="relative w-32 h-32 mb-6 transition-transform duration-300 group-hover:rotate-6">
              <Image
                src={game.icon}
                alt={game.alt}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <span className="text-xl font-semibold text-gray-300 group-hover:text-white transition-colors duration-300">
              {game.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
