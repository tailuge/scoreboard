import type { NextRequest } from "next/server"
import JSONCrush from "jsoncrush"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { ScoreData } from "@/types/score"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

/**
 * @swagger
 * /api/hiscore:
 *   post:
 *     summary: Submits a high score
 *     parameters:
 *       - in: query
 *         name: ruletype
 *         required: true
 *         schema:
 *           type: string
 *         description: The rule type
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: The player ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               state:
 *                 type: string
 *                 description: JSONCrushed score state
 *     responses:
 *       302:
 *         description: Redirects to leaderboard
 *       400:
 *         description: Client version is outdated
 */
export default async function handler(request: NextRequest) {
  const url = request.nextUrl
  const body = await request.text()
  logger.log(`body = ${body}`)
  logger.log(`url.searchParams = ${url.searchParams}`)
  const raw = new URLSearchParams(body).get("state")
  logger.log(raw)
  let json: any
  try {
    json = JSON.parse(JSONCrush.uncrush(raw))
    logger.log(json)
  } catch (error) {
    logger.error("Failed to parse hiscore state:", error)
    return new Response("Invalid score state", { status: 400 })
  }

  // require up to date client version
  if (json?.v !== 1) {
    logger.log("Client version is outdated")
    return new Response(
      "Please update your client or use version hosted at https://github.com/tailuge/billiards",
      { status: 400 }
    )
  }

  const ruletype = url.searchParams.get("ruletype")
  const base = new Date("2024").valueOf()
  const score = json?.score + (Date.now() - base) / base
  const player = url.searchParams.get("id") || "***"
  logger.log(`Received ${ruletype} hiscore of ${score} for player ${player}`)
  const data = await scoretable.topTen(url.searchParams.get("ruletype"))

  if (
    !data.some((row) => {
      const rowData = row as ScoreData
      return urlState(rowData) === raw
    })
  ) {
    logger.log("Add hiscore")
    await scoretable.add(ruletype, score, player, body)
  }

  return Response.redirect(url.origin + "/leaderboard.html")
}

function urlState(row: ScoreData) {
  try {
    return new URLSearchParams(row.data).get("state")
  } catch (e) {
    console.error(e)
    return null
  }
}
