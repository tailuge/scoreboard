import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

/**
 * @swagger
 * /api/rank:
 *   get:
 *     summary: Returns the top ten ranks for a given rule type
 *     parameters:
 *       - in: query
 *         name: ruletype
 *         schema:
 *           type: string
 *         description: The rule type
 *     responses:
 *       200:
 *         description: A list of the top ten ranks
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export default async function handler(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS })
  }

  const url = request.nextUrl
  const ruletype = url.searchParams.get("ruletype")
  if (!ruletype) {
    return new Response("ruletype is required", {
      status: 400,
      headers: CORS_HEADERS,
    })
  }
  try {
    const data = await scoretable.topTen(ruletype)
    return new Response(JSON.stringify(data), { headers: CORS_HEADERS })
  } catch (error) {
    logger.error("Error fetching top ten ranks:", error)
    return new Response("Invalid ruletype", {
      status: 400,
      headers: CORS_HEADERS,
    })
  }
}
