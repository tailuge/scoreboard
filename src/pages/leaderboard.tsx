import React from "react"
import Head from "next/head"
import LeaderboardTable from "../components/LeaderboardTable"
import { GroupBox } from "../components/GroupBox"

const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-sans text-gray-100">
      <Head>
        <title>Billiards Leaderboard | Top Scores & Rankings</title>
        <meta
          name="description"
          content="View the top billiards scores and player rankings for Snooker, 9-Ball, and Three Cushion. See who holds the high break records and watch replays of amazing shots."
        />
        <link
          rel="canonical"
          href="https://scoreboard-tailuge.vercel.app/leaderboard"
        />
        <meta
          property="og:title"
          content="Billiards Leaderboard | Top Scores & Rankings"
        />
        <meta
          property="og:description"
          content="View the top billiards scores and player rankings for Snooker, 9-Ball, and Three Cushion. See who holds the high break records and watch replays of amazing shots."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://scoreboard-tailuge.vercel.app/leaderboard"
        />
        <meta
          property="og:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Billiards Leaderboard | Top Scores & Rankings"
        />
        <meta
          name="twitter:description"
          content="View the top billiards scores and player rankings for Snooker, 9-Ball, and Three Cushion. See who holds the high break records and watch replays of amazing shots."
        />
        <meta
          name="twitter:image"
          content="https://scoreboard-tailuge.vercel.app/golden-cup.png"
        />
      </Head>

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
