import React from 'react';
import Head from 'next/head';
import LeaderboardTable from '../components/LeaderboardTable';
import { GroupBox } from '../components/GroupBox';

const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 font-sans text-gray-100">
      <Head>
        <title>High Break!</title>
        <meta name="description" content="billiards scoreboard" />
        <link rel="icon" type="image/png" href="/golden-cup.png" />
      </Head>

      <h1 className="text-4xl font-light text-center mb-8 text-gray-200 tracking-wider">
        <a href="https://github.com/tailuge/billiards" className="text-inherit no-underline hover:text-white transition-colors">
          Leaderboard
        </a>
      </h1>

      <div className="flex flex-wrap justify-center gap-6 items-start max-w-7xl mx-auto">
        <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]">
          <GroupBox title="Snooker">
            <LeaderboardTable
              ruleType="snooker"
              gameUrl="https://tailuge.github.io/billiards/dist?ruletype=snooker"
            />
          </GroupBox>
        </div>
        <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]">
          <GroupBox title="9-Ball">
            <LeaderboardTable
              ruleType="nineball"
              gameUrl="https://tailuge.github.io/billiards/dist?ruletype=nineball"
            />
          </GroupBox>
        </div>
        <div className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] min-w-[320px]">
          <GroupBox title="Three Cushion">
            <LeaderboardTable
              ruleType="threecushion"
              gameUrl="https://tailuge.github.io/billiards/dist?ruletype=threecushion"
            />
          </GroupBox>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
