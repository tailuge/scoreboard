import { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { MatchResultService } from "@/services/MatchResultService"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

const matchResultService = new MatchResultService(kv)

/**
 * @swagger
 * /api/match-replay:
 *   get:
 *     summary: Fetches match replay data
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The match ID
 *     responses:
 *       200:
 *         description: Replay data (text/plain)
 *       400:
 *         description: ID is required
 *       404:
 *         description: Replay not found
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextRequest) {
  if (request.method !== "GET") {
    return new Response(`Method ${request.method} Not Allowed`, {
      status: 405,
      headers: { Allow: "GET" },
    })
  }

  try {
    const { searchParams } = request.nextUrl
    const id = searchParams.get("id")

    if (!id) {
      return new Response("ID is required", { status: 400 })
    }

    const replayData = await matchResultService.getMatchReplay(id)

    if (replayData === null) {
      return new Response("Replay not found", { status: 404 })
    }

    return new Response(replayData, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    logger.log("Error fetching match replay:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
