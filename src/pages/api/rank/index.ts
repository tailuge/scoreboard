import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { logger } from "@/utils/logger"
import { corsResponse } from "@/utils/cors"
import { VALID_RULE_TYPES } from "@/utils/gameTypes"

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
export default async function handler(request: NextRequest) {
  const url = request.nextUrl
  const ruletype = url.searchParams.get("ruletype")

  if (ruletype === "all") {
    try {
      const allData = {}
      await Promise.all(
        VALID_RULE_TYPES.map(async (type) => {
          allData[type] = await scoretable.topTen(type)
        })
      )
      return corsResponse(JSON.stringify(allData), {
        headers: {
          "Cache-Control":
            "public, max-age=0, s-maxage=15, stale-while-revalidate=8",
        },
      })
    } catch (error) {
      logger.error("Error fetching all top ten ranks:", error)
      return corsResponse("Internal Server Error", { status: 500 })
    }
  }

  if (!ruletype) {
    return corsResponse("ruletype is required", { status: 400 })
  }

  try {
    const data = await scoretable.topTen(ruletype)
    return corsResponse(JSON.stringify(data), {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=15, stale-while-revalidate=8",
      },
    })
  } catch (error) {
    logger.warn("Error fetching top ten ranks:", error)
    return corsResponse("Invalid ruletype", { status: 400 })
  }
}
