import { NextRequest, NextFetchEvent } from "next/server"
import { unstable_cache } from "next/cache"
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

// The leaderboard only needs recomputing hourly. Without this, getTopNBatch
// reads every player's rating for every rule type on each request, which grows
// with the player base. Hiscores and recentMatches stay uncached so new matches
// still show up in the lobby immediately. Arguments form part of the cache key.
const getCachedTopNBatch = unstable_cache(
  (limitElo: number) =>
    playerRatingStore.getTopNBatch(VALID_RULE_TYPES as any, limitElo),
  ["summary-top-players"],
  { revalidate: 3600 }
)

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
    const trackingPromise = markUsageFromServer("lobby").catch((err) =>
      console.error("Usage tracking error:", err)
    )
    if (event && typeof event.waitUntil === "function") {
      event.waitUntil(trackingPromise)
    }

    const [hiscores, topPlayers, recentMatches] = await Promise.all([
      scoreTable.topTenMulti(VALID_RULE_TYPES),
      getCachedTopNBatch(limitElo),
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
