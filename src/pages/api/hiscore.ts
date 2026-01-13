import type { NextRequest } from "next/server"
import JSONCrush from "jsoncrush"
import { kv } from "@vercel/kv"
import { ScoreData, ScoreTable } from "@/services/scoretable"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

export default async function handler(request: NextRequest) {
  const url = request.nextUrl
  const body = await request.text()
  console.log(`body = ${body}`)
  console.log(`url.searchParams = ${url.searchParams}`)
  const raw = new URLSearchParams(body).get("state")
  console.log(raw)
  const json = JSON.parse(JSONCrush.uncrush(raw))
  console.log(json)

  // require up to date client version
  if (json?.v !== 1) {
    console.log("Client version is outdated")
    return new Response(
      "Please update your client or use version hosted at https://github.com/tailuge/billiards",
      { status: 400 }
    )
  }

  const ruletype = url.searchParams.get("ruletype")
  const base = new Date("2024").valueOf()
  const score = json?.score + (new Date().valueOf() - base) / base
  const player = url.searchParams.get("id") || "***"
  console.log(`Received ${ruletype} hiscore of ${score} for player ${player}`)
  const data = await scoretable.topTen(url.searchParams.get("ruletype"))

  if (
    !data.some((row) => {
      const rowData = row as ScoreData
      return urlState(rowData) === raw
    })
  ) {
    console.log("Add hiscore")
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
