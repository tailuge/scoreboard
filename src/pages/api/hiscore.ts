import type { NextRequest } from "next/server"
import JSONCrush from "jsoncrush"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { ScoreData } from "@/types/score"
import { logger } from "@/utils/logger"
import { isValidGameType } from "@/utils/gameTypes"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

export default async function handler(request: NextRequest) {
  const url = request.nextUrl
  const body = await request.text()
  logger.log(`body = ${body}`)
  logger.log(`url.searchParams = ${url.searchParams}`)
  const raw = new URLSearchParams(body).get("state")
  logger.log(raw)
  if (!raw) {
    return new Response("Missing state", { status: 400 })
  }

  let json: any
  try {
    json = JSON.parse(JSONCrush.uncrush(raw))
    logger.log(json)
  } catch (e) {
    logger.error("Failed to parse state", e)
    return new Response("Invalid state format", { status: 400 })
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
  if (!isValidGameType(ruletype)) {
    return new Response("Invalid ruletype", { status: 400 })
  }

  const base = new Date("2024").valueOf()
  const score = (Number(json?.score) || 0) + (Date.now() - base) / base
  const player = (url.searchParams.get("id") || "***").slice(0, 50)
  logger.log(`Received ${ruletype} hiscore of ${score} for player ${player}`)
  const data = await scoretable.topTen(ruletype)

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
