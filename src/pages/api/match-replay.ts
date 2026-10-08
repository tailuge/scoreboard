import type { NextApiRequest, NextApiResponse } from "next"
import { kv } from "@vercel/kv"
import { MatchResultService } from "@/services/MatchResultService"
import { getRuleType } from "@/types/match"
import { logger } from "@/utils/logger"
import { CORS_HEADERS } from "@/utils/cors"
import { GAME_BASE_URL } from "@/config"

export const config = {
  runtime: "nodejs",
}

const matchResultService = new MatchResultService(kv)

function setCorsHeaders(res: NextApiResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const id = req.query.id as string | undefined

    if (!id) {
      setCorsHeaders(res)
      return res.status(400).end("ID is required")
    }

    const replayData = await matchResultService.getMatchReplay(id)

    if (replayData === null) {
      setCorsHeaders(res)
      return res.status(404).end("Replay not found")
    }

    const matchResults = await matchResultService.getMatchResults()
    const matchResult = matchResults.find((result) => result.id === id)

    if (!matchResult) {
      setCorsHeaders(res)
      return res.status(404).end("Match result not found")
    }

    const viewerUrl = new URL(GAME_BASE_URL)
    viewerUrl.searchParams.set("ruletype", getRuleType(matchResult))
    viewerUrl.searchParams.set("state", replayData)
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== "id" && typeof value === "string") {
        viewerUrl.searchParams.set(key, value)
      }
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=172800, stale-while-revalidate=86400"
    )
    return res.redirect(307, viewerUrl.toString())
  } catch (error) {
    logger.log("Error fetching match replay:", error)
    setCorsHeaders(res)
    return res.status(500).end("Internal Server Error")
  }
}
