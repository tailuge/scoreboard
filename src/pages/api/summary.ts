import { NextRequest, NextFetchEvent } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { MatchResultService } from "@/services/MatchResultService"
import { VALID_RULE_TYPES } from "@/utils/gameTypes"
import { corsJson } from "@/utils/cors"
import { markUsageFromServer } from "@/utils/usage"

export const config = {
  runtime: "edge",
}

const scoreTable = new ScoreTable(kv)
const playerRatingStore = new PlayerRatingStore(kv)
const matchResultService = new MatchResultService(kv)

export default async function handler(
  request: NextRequest,
  event?: NextFetchEvent
) {
  const { searchParams } = request.nextUrl
  const limitElo = Number.parseInt(searchParams.get("limitElo") || "10", 10)
  const limitMatches = Number.parseInt(
    searchParams.get("limitMatches") || "32",
    10
  )

  try {
    // Use event.waitUntil if available to avoid blocking the response for usage tracking
    // Sample "lobby" usage at 10% to reduce CPU and I/O overhead
    if (Math.random() < 0.1) {
      const trackingPromise = markUsageFromServer("lobby").catch((err) =>
        console.error("Usage tracking error:", err)
      )
      if (event && typeof event.waitUntil === "function") {
        event.waitUntil(trackingPromise)
      }
    }

    const [hiscores, topPlayers, recentMatches] = await Promise.all([
      scoreTable.topTenMulti(VALID_RULE_TYPES),
      playerRatingStore.getTopNBatch(VALID_RULE_TYPES as any, limitElo),
      matchResultService.getMatchResults(limitMatches),
    ])

    return corsJson(
      {
        hiscores,
        topPlayers,
        recentMatches,
      },
      {
        headers: {
          // Increased cache time to 2 minutes to reduce quota consumption
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
        },
      }
    )
  } catch (error) {
    console.error("Error generating summary:", error)
    return corsJson({ error: "Internal Server Error" }, { status: 500 })
  }
}
