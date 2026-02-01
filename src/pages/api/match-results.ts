import { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { MatchResultService } from "@/services/MatchResultService"
import { getUID } from "@/utils/uid"
import { logger } from "@/utils/logger"

export const config = {
  runtime: "edge",
}

const matchResultService = new MatchResultService(kv)

export default async function handler(request: NextRequest) {
  const { method } = request

  switch (method) {
    case "GET":
      return handleGet(request)
    case "POST":
      return handlePost(request)
    case "OPTIONS":
      return new Response(null, { status: 200 })
    default:
      return new Response(`Method ${method} Not Allowed`, {
        status: 405,
        headers: { Allow: "GET, POST, OPTIONS" },
      })
  }
}

async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const gameType = searchParams.get("gameType") || undefined
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const results = await matchResultService.getMatchResults(limit, gameType)
    return Response.json(results)
  } catch (error) {
    logger.log("Error fetching match results:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function handlePost(request: NextRequest) {
  try {
    const data = await request.json()

    // Basic validation
    // winner and winnerScore are required.
    // loser and loserScore are optional for solo results.
    if (!data.winner || typeof data.winnerScore !== "number") {
      return new Response("Missing required fields", { status: 400 })
    }

    const newResult = {
      gameType: "nineball",
      ...data,
      id: getUID(),
      timestamp: Date.now(),
    }

    await matchResultService.addMatchResult(newResult)
    return Response.json(newResult, { status: 201 })
  } catch (error) {
    logger.log("Error adding match result:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
