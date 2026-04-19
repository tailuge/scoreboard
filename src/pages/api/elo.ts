import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { isValidGameType } from "@/utils/gameTypes"

export const config = { runtime: "edge" }

const store = new PlayerRatingStore(kv)

export default async function handler(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const ruleType = searchParams.get("ruleType") ?? "nineball"
  const limit = Number(searchParams.get("limit") ?? "10")

  if (!isValidGameType(ruleType)) {
    return new Response("Invalid ruleType", { status: 400 })
  }

  const players = await store.getTopN(ruleType, limit)
  return Response.json(players, {
    headers: { "Cache-Control": "public, s-maxage=30" },
  })
}
