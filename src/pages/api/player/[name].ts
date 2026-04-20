import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { isValidGameType } from "@/utils/gameTypes"

export const config = { runtime: "edge" }

const store = new PlayerRatingStore(kv)

export default async function handler(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const name = searchParams.get("name")
  const ruleType = searchParams.get("ruleType") ?? "nineball"

  if (!name) {
    return new Response("Missing name", { status: 400 })
  }

  if (!isValidGameType(ruleType)) {
    return new Response("Invalid ruleType", { status: 400 })
  }

  const history = await store.getHistory(ruleType, name)

  // Sort history by date
  const sortedHistory = Object.entries(history)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, rating]) => ({ date, rating }))

  return Response.json(sortedHistory, {
    headers: { "Cache-Control": "public, s-maxage=30" },
  })
}
