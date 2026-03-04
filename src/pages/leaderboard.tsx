import React from "react"
import { Seo } from "@/components/Seo"
import LeaderboardTable from "../components/LeaderboardTable"
import { GroupBox } from "../components/GroupBox"

const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-sans text-gray-100">
      <Seo
        title="Billiards Global Leaderboard - Top Snooker & Pool Scores"
        description="Check the latest rankings and high scores for Snooker, 9-Ball, and Three-Cushion billiards. Watch replays of record-breaking breaks and shots."
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
        <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]">
          <GroupBox title="Snooker">
            <LeaderboardTable ruleType="snooker" />
          </GroupBox>
        </div>
        <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]">
          <GroupBox title="9-Ball">
            <LeaderboardTable ruleType="nineball" />
          </GroupBox>
        </div>
        <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]">
          <GroupBox title="Three Cushion">
            <LeaderboardTable ruleType="threecushion" />
          </GroupBox>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
