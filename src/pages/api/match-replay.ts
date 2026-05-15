import { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { MatchResultService } from "@/services/MatchResultService"
import { getRuleType } from "@/types/match"
import { logger } from "@/utils/logger"
import { corsResponse } from "@/utils/cors"
import { GAME_BASE_URL } from "@/config"

export const config = {
  runtime: "edge",
}

const matchResultService = new MatchResultService(kv)

export default async function handler(request: NextRequest) {
  if (request.method !== "GET") {
    return corsResponse(`Method ${request.method} Not Allowed`, {
      status: 405,
      headers: { Allow: "GET" },
    })
  }

  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) {
      return corsResponse("ID is required", { status: 400 })
    }

    const replayData = await matchResultService.getMatchReplay(id)

    if (replayData === null) {
      return corsResponse("Replay not found", { status: 404 })
    }

    const matchResults = await matchResultService.getMatchResults()
    const matchResult = matchResults.find((result) => result.id === id)

    if (!matchResult) {
      return corsResponse("Match result not found", { status: 404 })
    }

    const viewerUrl = new URL(GAME_BASE_URL)
    viewerUrl.searchParams.set("ruletype", getRuleType(matchResult))
    viewerUrl.searchParams.set("state", replayData)
    for (const [key, value] of searchParams.entries()) {
      if (key !== "id") {
        viewerUrl.searchParams.set(key, value)
      }
    }
    return Response.redirect(viewerUrl.toString(), 307)
  } catch (error) {
    logger.log("Error fetching match replay:", error)
    return corsResponse("Internal Server Error", { status: 500 })
  }
}
