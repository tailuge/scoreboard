import React from 'react';
import Head from 'next/head';
import LeaderboardTable from '../components/LeaderboardTable';

const LeaderboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <Head>
        <title>High Break!</title>
        <meta name="description" content="billiards scoreboard" />
        <link rel="icon" type="image/png" href="/golden-cup.png" />
      </Head>

      <h1 className="text-4xl font-light text-center mb-8">
        <a href="https://github.com/tailuge/billiards" className="text-inherit no-underline hover:underline">
          Leaderboard
        </a>
      </h1>
      
      <div className="flex flex-wrap justify-center gap-5 items-start">
        <LeaderboardTable
          title="Snooker"
          ruleType="snooker"
          gameUrl="https://tailuge.github.io/billiards/dist?ruletype=snooker"
        />
        <LeaderboardTable
          title="9-Ball"
          ruleType="nineball"
          gameUrl="https://tailuge.github.io/billiards/dist"
        />
        <LeaderboardTable
          title="Three Cushion Billiards"
          ruleType="threecushion"
          gameUrl="https://tailuge.github.io/billiards/dist?ruletype=threecushion"
        />
      </div>
    </div>
  );
};

export default LeaderboardPage;
