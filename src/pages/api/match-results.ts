import { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { MatchResultService } from "@/services/MatchResultService"
import { getUID } from "@/utils/uid"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

const matchResultService = new MatchResultService(kv)

/**
 * @swagger
 * /api/match-results:
 *   get:
 *     summary: Returns a list of match results
 *     parameters:
 *       - in: query
 *         name: gameType
 *         schema:
 *           type: string
 *         description: Filter by game type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limit the number of results
 *     responses:
 *       200:
 *         description: A list of match results
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Adds a new match result
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - winner
 *               - winnerScore
 *             properties:
 *               winner:
 *                 type: string
 *               winnerScore:
 *                 type: number
 *               loser:
 *                 type: string
 *               loserScore:
 *                 type: number
 *               gameType:
 *                 type: string
 *               replayData:
 *                 type: string
 *     responses:
 *       201:
 *         description: Match result created
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: NextRequest) {
  const { method } = request

  switch (method) {
    case "GET":
      return handleGet(request)
    case "POST":
      return handlePost(request)
    case "OPTIONS":
      return new Response(null, { status: 200 })
    default:
      return new Response(`Method ${method} Not Allowed`, {
        status: 405,
        headers: { Allow: "GET, POST, OPTIONS" },
      })
  }
}

async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const gameType = searchParams.get("gameType") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10)

    const results = await matchResultService.getMatchResults(limit, gameType)
    return Response.json(results)
  } catch (error) {
    logger.log("Error fetching match results:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function handlePost(request: NextRequest) {
  try {
    const { replayData, ...data } = await request.json()

    const locationCountry =
      request.headers?.get("x-vercel-ip-country") || undefined
    const locationRegion =
      request.headers?.get("x-vercel-ip-region") || undefined
    const locationCity = request.headers?.get("x-vercel-ip-city") || undefined

    // Basic validation
    // winner and winnerScore are required.
    // loser and loserScore are optional for solo results.
    if (!data.winner || typeof data.winnerScore !== "number") {
      return new Response("Missing required fields", { status: 400 })
    }

    const newResult = {
      gameType: "nineball",
      ...data,
      id: getUID(),
      timestamp: Date.now(),
      locationCountry,
      locationRegion,
      locationCity,
    }

    await matchResultService.addMatchResult(newResult, replayData)
    return Response.json(newResult, { status: 201 })
  } catch (error) {
    logger.log("Error adding match result:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
