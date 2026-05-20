import React from "react"
import { Seo } from "@/components/Seo"
import LeaderboardTable from "../components/LeaderboardTable"
import { GroupBox } from "../components/GroupBox"
import { GAME_TYPES } from "@/config"

const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-sans text-gray-100">
      <Seo
        title="Free Open Source Billiards Leaderboard - Top Snooker & Pool Scores"
        description="Check the latest rankings and high scores for free open source Snooker, 9-Ball, and Three-Cushion billiards. ビリヤードのリーダーボード、スヌーカー、9ボール、3クッション。 당구 순위표, 스누커, 9볼, 3쿠션."
        keywords="billiards, leaderboard, rankings, snooker, 9-ball, carom, three-cushion, ビリヤード, リーダーボード, ランキング, スヌーカー, 9ボール, 3クッション, 당구, 순위표, 랭킹, 스누커, 9볼, 3쿠션"
        canonical="https://scoreboard-tailuge.vercel.app/leaderboard"
        ogUrl="https://scoreboard-tailuge.vercel.app/leaderboard"
      />

      <h1 className="text-4xl font-light text-center mb-8 text-gray-200 tracking-wider">
        <a
          href="https://github.com/tailuge/billiards"
          className="text-inherit no-underline hover:text-white transition-colors"
        >
          Leaderboard
        </a>
      </h1>

      <div className="flex flex-wrap justify-center gap-6 items-start max-w-7xl mx-auto">
        {GAME_TYPES.map((game) => (
          <div
            key={game.ruleType}
            className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]"
          >
            <GroupBox title={game.name}>
              <LeaderboardTable ruleType={game.ruleType} />
            </GroupBox>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <a
          href="https://billiards.tailuge.workers.dev/lobby"
          className="inline-block px-4 py-1 text-gray-200 no-underline rounded-lg transition-colors hover:text-white"
          style={{
            color: "rgba(220, 230, 255, 0.9)",
            backdropFilter: "blur(10px) saturate(100%)",
            WebkitBackdropFilter: "blur(40px) saturate(200%)",
            background: "rgba(7, 27, 7, 0.724)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
          }}
        >
          Back to Lobby
        </a>
      </div>
    </div>
  )
}

export default LeaderboardPage
