import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { logger } from "@/utils/logger"
import { corsResponse, CORS_HEADERS } from "@/utils/cors"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

/**
 * @swagger
 * /api/rank/{id}:
 *   get:
 *     summary: Redirects to the URL associated with a specific rank ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rank ID
 *       - in: query
 *         name: ruletype
 *         required: true
 *         schema:
 *           type: string
 *         description: The rule type
 *     responses:
 *       302:
 *         description: Redirect to rank URL
 *       200:
 *         description: Successfully processed
 *   put:
 *     summary: Likes a specific rank entry
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The rank ID
 *       - in: query
 *         name: ruletype
 *         required: true
 *         schema:
 *           type: string
 *         description: The rule type
 *     responses:
 *       200:
 *         description: Liked successfully
 */
export default async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ruletype = searchParams.get("ruletype")
  const id = searchParams.get("id")

  if (!ruletype || !id) {
    return corsResponse("ruletype and id are required", { status: 400 })
  }

  if (request.method === "GET") {
    let url
    try {
      url = await scoretable.get(ruletype, id)
    } catch (error) {
      logger.warn("Error fetching rank by id:", error)
      return corsResponse("Invalid ruletype", { status: 400 })
    }
    logger.log(`redirecting ${ruletype} id ${id} to ${url}`)
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        ...CORS_HEADERS,
      },
    })
  }

  if (request.method === "PUT") {
    try {
      await scoretable.like(ruletype, id)
    } catch (error) {
      logger.warn("Error liking rank entry:", error)
      return corsResponse("Invalid ruletype", { status: 400 })
    }
    logger.log(`liked ${ruletype} id ${id}`)
  }

  return corsResponse(null, { status: 200 })
}
