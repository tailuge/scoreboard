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
      return handleGet()
    case "POST":
      return handlePost(request)
    default:
      return new Response(`Method ${method} Not Allowed`, {
        status: 405,
        headers: { Allow: "GET, POST" },
      })
  }
}

async function handleGet() {
  try {
    const results = await matchResultService.getMatchResults()
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
    if (
      !data.winner ||
      !data.loser ||
      typeof data.winnerScore !== "number" ||
      typeof data.loserScore !== "number"
    ) {
      return new Response("Missing required fields", { status: 400 })
    }

    const newResult = {
      ...data,
      id: data.id || getUID(),
      timestamp: data.timestamp || Date.now(),
    }

    await matchResultService.addMatchResult(newResult)
    return Response.json(newResult, { status: 201 })
  } catch (error) {
    logger.log("Error adding match result:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
