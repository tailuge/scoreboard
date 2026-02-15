import Head from "next/head"
import React from "react"
import { LiveMatchesPanel } from "@/components/LiveMatchesPanel"
import { MatchHistoryList } from "@/components/MatchHistoryList"

export default function New() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Head>
        <title>New Page | Billiards</title>
        <meta
          name="description"
          content="New game page - redesign in progress"
        />
      </Head>

      <div className="w-full max-w-6xl mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Redesign area */}
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <LiveMatchesPanel />
          <MatchHistoryList />
        </div>
      </div>
    </div>
  )
}
