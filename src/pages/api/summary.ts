import { NextRequest } from "next/server"
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

// TEMPORARY diagnostics for Vercel fluid-compute investigation. Remove once we
// know where this route's budget goes. Deliberately uses console.log rather than
// logger.log: logger.enabled is derived from `typeof process`, which is fragile
// on the Edge runtime, and a silent no-op here would waste a deploy cycle.
const now = () => globalThis.performance?.now?.() ?? Date.now()
const TIMING = "[summary-timing]"

function logTiming(stage: string, detail: Record<string, unknown>) {
  console.log(`${TIMING} ${stage} ${JSON.stringify(detail)}`)
}

// Records how long a branch took without altering the value it resolves to, so
// the Promise.all below keeps its exact current shape and semantics.
function timed<T>(
  label: string,
  promise: Promise<T>,
  into: Record<string, number>
) {
  const startedAt = now()
  return promise.then((value) => {
    into[label] = Math.round(now() - startedAt)
    return value
  })
}

export default async function handler(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const limitElo = Number.parseInt(searchParams.get("limitElo") || "10", 10)
  const limitMatches = Number.parseInt(
    searchParams.get("limitMatches") || "32",
    10
  )

  const startedAt = now()
  const parts: Record<string, number> = {}

  try {
    logTiming("start", { limitElo, limitMatches })

    markUsageFromServer("lobby").catch((err) =>
      console.error("Usage tracking error:", err)
    )

    const [hiscores, topPlayers, recentMatches] = await Promise.all([
      timed("hiscoresMs", scoreTable.topTenMulti(VALID_RULE_TYPES), parts),
      timed("topPlayersMs", getCachedTopNBatch(limitElo), parts),
      timed(
        "recentMatchesMs",
        matchResultService.getMatchResults(limitMatches),
        parts
      ),
    ])

    logTiming("done", {
      totalMs: Math.round(now() - startedAt),
      ...parts,
      hiscoreGames: Object.keys(hiscores).length,
      recentMatches: recentMatches.length,
    })

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
