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

/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: Returns a summary of high scores, top players, and recent matches
 *     parameters:
 *       - in: query
 *         name: limitElo
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit the number of top ELO players per rule type
 *       - in: query
 *         name: limitMatches
 *         schema:
 *           type: integer
 *           default: 32
 *         description: Limit the number of recent match results
 *     responses:
 *       200:
 *         description: A summary object containing hiscores, topPlayers, and recentMatches
 *       500:
 *         description: Internal server error
 */
export default async function handler(
  request: NextRequest,
  event: NextFetchEvent
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
