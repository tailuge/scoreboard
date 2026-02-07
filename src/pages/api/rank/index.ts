import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"

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
  const data = await scoretable.topTen(url.searchParams.get("ruletype"))
  return new Response(JSON.stringify(data))
}
