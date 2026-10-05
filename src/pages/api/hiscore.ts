import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { ScoreData } from "@/types/score"
import { logger } from "@/utils/logger"
import { corsResponse } from "@/utils/cors"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

export default async function handler(request: NextRequest) {
  const url = request.nextUrl
  const body = await request.text()
  logger.log(`body = ${body}`)
  logger.log(`url.searchParams = ${url.searchParams}`)
  const params = new URLSearchParams(body)
  const raw = params.get("state")

  // The client reports its own version and score as plain params, so the
  // compressed state blob no longer needs to be decoded here.
  if (Number(params.get("v")) !== 1) {
    logger.log("Client version is outdated")
    return corsResponse(
      "Please update your client or use version hosted at https://github.com/tailuge/billiards",
      { status: 400 }
    )
  }

  if (!raw) {
    logger.error("Invalid score state: missing state")
    return corsResponse("Invalid score state", { status: 400 })
  }

  const rawScore = Number(params.get("score"))
  if (!Number.isFinite(rawScore)) {
    logger.error("Invalid score state: missing or non-numeric score")
    return corsResponse("Invalid score state", { status: 400 })
  }

  const ruletype = url.searchParams.get("ruletype")
  if (!ruletype) {
    return corsResponse("ruletype is required", { status: 400 })
  }

  const base = new Date("2024").valueOf()
  const score = rawScore + (Date.now() - base) / base
  const player = url.searchParams.get("id") || "***"
  logger.log(`Received ${ruletype} hiscore of ${score} for player ${player}`)
  let data
  try {
    data = await scoretable.topTen(ruletype)
  } catch (error) {
    logger.warn("Error fetching top ten ranks:", error)
    return corsResponse("Invalid ruletype", { status: 400 })
  }

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
