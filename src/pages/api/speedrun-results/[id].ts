import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { logger } from "@/utils/logger"
import { GAME_BASE_URL } from "@/config"

export const config = {
  runtime: "edge",
}

const LEADERBOARD_KEY = "speedrun-leaderboard"
const STATES_KEY = "speedrun-states"

interface SpeedrunEntry {
  id: string
  playerName: string
  timeSec: number
  ruleType: string
  date: string
}

interface SpeedrunLeaderboard {
  [positionId: string]: SpeedrunEntry[]
}

interface SpeedrunStates {
  [id: string]: string
}

export default async function handler(request: NextRequest) {
  if (request.method !== "GET") {
    return new Response(`Method ${request.method} Not Allowed`, {
      status: 405,
      headers: { Allow: "GET" },
    })
  }

  try {
    // Extract id from pathname: /api/speedrun-results/{id}
    const segments = request.nextUrl.pathname.split("/")
    const id = segments[segments.length - 1]

    if (!id) {
      return new Response("ID is required", { status: 400 })
    }

    const leaderboard: SpeedrunLeaderboard =
      (await kv.get<SpeedrunLeaderboard>(LEADERBOARD_KEY)) || {}

    // Find the entry across all positions
    let foundEntry: SpeedrunEntry | null = null
    for (const entries of Object.values(leaderboard)) {
      const match = entries.find((e) => e.id === id)
      if (match) {
        foundEntry = match
        break
      }
    }

    if (!foundEntry) {
      return new Response("Not Found", { status: 404 })
    }

    const states: SpeedrunStates =
      (await kv.get<SpeedrunStates>(STATES_KEY)) || {}

    const state = states[id]
    if (!state) {
      return new Response("Replay state not found", { status: 404 })
    }

    const viewerUrl = new URL(GAME_BASE_URL)
    viewerUrl.searchParams.set("ruletype", foundEntry.ruleType)
    viewerUrl.searchParams.set("state", state)

    return Response.redirect(viewerUrl.toString(), 307)
  } catch (error) {
    logger.log("Error fetching speedrun replay:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
