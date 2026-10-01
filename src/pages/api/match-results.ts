import { NextRequest, userAgent } from "next/server"
import { kv } from "@vercel/kv"
import { MatchResultService } from "@/services/MatchResultService"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { updateMatchRatings } from "@/services/RatingService"
import { getUID } from "@/utils/uid"
import { logger } from "@/utils/logger"
import { isValidGameType } from "@/utils/gameTypes"

export const config = {
  runtime: "edge",
}

const matchResultService = new MatchResultService(kv)
const playerRatingStore = new PlayerRatingStore(kv)

// TEMPORARY diagnostics for Vercel fluid-compute investigation. Remove once we
// know where the POST budget goes. Deliberately uses console.log rather than
// logger.log: logger.enabled is derived from `typeof process`, which is fragile
// on the Edge runtime, and a silent no-op here would waste a deploy cycle.
const now = () => globalThis.performance?.now?.() ?? Date.now()
const TIMING = "[mr-timing]"

function logTiming(stage: string, detail: Record<string, unknown>) {
  console.log(`${TIMING} ${stage} ${JSON.stringify(detail)}`)
}

export default async function handler(request: NextRequest) {
  const { method } = request

  switch (method) {
    case "GET":
      return handleGet(request)
    case "POST":
      return handlePost(request)
    default:
      return new Response(`Method ${method} Not Allowed`, {
        status: 405,
        headers: { Allow: "GET, POST" },
      })
  }
}

async function handleGet(request: NextRequest) {
  const startedAt = now()
  try {
    const { searchParams } = request.nextUrl
    const ruleType = searchParams.get("ruleType") || undefined

    if (ruleType && !isValidGameType(ruleType)) {
      return new Response("Invalid ruleType", { status: 400 })
    }

    const limit = Number.parseInt(searchParams.get("limit") || "32", 10)

    const results = await matchResultService.getMatchResults(limit, ruleType)
    logTiming("GET done", {
      totalMs: Math.round(now() - startedAt),
      returned: results.length,
      limit,
      ruleType: ruleType ?? null,
    })
    return Response.json(results, {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=15, stale-while-revalidate=8",
      },
    })
  } catch (error) {
    logger.log("Error fetching match results:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function handlePost(request: NextRequest) {
  const startedAt = now()
  let parsedMs: number | undefined
  try {
    const { replayData, ...data } = await request.json()
    parsedMs = Math.round(now() - startedAt)

    // Distinguishes solo uploads (no ELO block) from two-player uploads, and
    // records whether the replay `set` ran at all.
    logTiming("POST parsed", {
      parsedMs,
      replayBytes: replayData ? replayData.length : 0,
      isTwoPlayer: !!data.loser,
    })

    const locationCountry =
      request.headers?.get("x-vercel-ip-country") || undefined
    const locationRegion =
      request.headers?.get("x-vercel-ip-region") || undefined
    const locationCityRaw =
      request.headers?.get("x-vercel-ip-city") || undefined
    const locationCity = locationCityRaw
      ? decodeURIComponent(locationCityRaw)
      : undefined

    let browser, os, ua
    try {
      const uaInfo = userAgent(request)
      browser = uaInfo.browser
      os = uaInfo.os
      ua = uaInfo.ua
    } catch (e) {
      logger.log("Error parsing user agent:", e)
    }

    // Basic validation
    // winner and winnerScore are required.
    // loser and loserScore are optional for solo results.
    if (!data.winner || typeof data.winnerScore !== "number") {
      return new Response("Missing required fields", { status: 400 })
    }

    const newResult = {
      ruleType: "nineball",
      ...data,
      id: getUID(),
      timestamp: Date.now(),
      locationCountry,
      locationRegion,
      locationCity,
      userAgent: ua,
      browser: browser?.name,
      os: os?.name,
    }

    const storeStartedAt = now()
    await matchResultService.addMatchResult(newResult, replayData)
    const storeMs = Math.round(now() - storeStartedAt)

    // addMatchResult queues set + zadd + trim as one pipeline (single round
    // trip), so this number is the main thing to compare against ELO below.
    logTiming("POST stored", { storeMs })

    let eloMs: number | null = null
    if (newResult.loser) {
      const eloStartedAt = now()
      try {
        const ruleType = newResult.ruleType ?? "nineball"
        const [wRating, lRating] = await Promise.all([
          playerRatingStore.getOrCreate(ruleType, newResult.winner),
          playerRatingStore.getOrCreate(ruleType, newResult.loser),
        ])
        const [newW, newL] = await updateMatchRatings(wRating, lRating)
        await Promise.all([
          playerRatingStore.save(ruleType, newResult.winner, newW),
          playerRatingStore.save(ruleType, newResult.loser, newL),
        ])
        eloMs = Math.round(now() - eloStartedAt)
      } catch (e) {
        eloMs = Math.round(now() - eloStartedAt)
        logger.log("ELO update failed:", e)
      }
    }

    logTiming("POST done", {
      totalMs: Math.round(now() - startedAt),
      parsedMs,
      storeMs,
      eloMs,
      isTwoPlayer: !!newResult.loser,
    })

    return Response.json(newResult, { status: 201 })
  } catch (error) {
    logger.log("Error adding match result:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
