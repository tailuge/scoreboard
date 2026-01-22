import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

export default async function handler(request: NextRequest) {
  const url = request.nextUrl
  const ruletype = url.searchParams.get("ruletype")
  if (!ruletype) {
    return new Response("Missing ruletype parameter", { status: 400 })
  }
  const data = await scoretable.topTen(ruletype)
  return new Response(JSON.stringify(data))
}
