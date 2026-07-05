import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { getUID } from "@/utils/uid"
import { logger } from "@/utils/logger"

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
    const leaderboard: SpeedrunLeaderboard =
      (await kv.get<SpeedrunLeaderboard>(LEADERBOARD_KEY)) || {}

    const results: (SpeedrunEntry & { positionId: string })[] = []
    for (const [positionId, entries] of Object.entries(leaderboard)) {
      for (const entry of entries) {
        results.push({ ...entry, positionId })
      }
    }

    return Response.json(results, {
      headers: { "Cache-Control": "public, s-maxage=30" },
    })
  } catch (error) {
    logger.log("Error fetching speedrun results:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const { state, ...rest } = body
    const id = getUID()

    const entry: SpeedrunEntry = {
      id,
      playerName: rest.playerName,
      timeSec: rest.timeSec,
      ruleType: rest.ruleType,
      date: new Date().toISOString(),
    }

    const leaderboard: SpeedrunLeaderboard =
      (await kv.get<SpeedrunLeaderboard>(LEADERBOARD_KEY)) || {}

    const states: SpeedrunStates =
      (await kv.get<SpeedrunStates>(STATES_KEY)) || {}

    const positionId: string = rest.positionId
    const positionEntries = leaderboard[positionId] || []
    positionEntries.push(entry)

    const { kept, evicted } = trimPosition(positionEntries)

    // Remove evicted entries' replay states
    const evictedIds = new Set(evicted.map((e) => e.id))
    for (const evictedId of evictedIds) {
      delete states[evictedId]
    }

    leaderboard[positionId] = kept
    await kv.set(LEADERBOARD_KEY, leaderboard)

    // Only save state if the new entry made the cut
    if (!evictedIds.has(id)) {
      states[id] = state
    }
    await kv.set(STATES_KEY, states)

    return Response.json(kept, {
      status: 201,
      headers: { "Cache-Control": "private, no-cache" },
    })
  } catch (error) {
    logger.log("Error adding speedrun result:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}

/**
 * Sorts entries by timeSec ascending and keeps the fastest 3 distinct times.
 * Tiebreaking: entries with the same timeSec are all kept (may result in >3 entries).
 */
function trimPosition(entries: SpeedrunEntry[]): {
  kept: SpeedrunEntry[]
  evicted: SpeedrunEntry[]
} {
  const sorted = [...entries].sort((a, b) => a.timeSec - b.timeSec)
  const kept: SpeedrunEntry[] = []
  const evicted: SpeedrunEntry[] = []
  let distinctTimes = 0
  let lastTime: number | null = null

  for (const entry of sorted) {
    if (lastTime === null || entry.timeSec !== lastTime) {
      distinctTimes++
      lastTime = entry.timeSec
    }
    if (distinctTimes <= 3) {
      kept.push(entry)
    } else {
      evicted.push(entry)
    }
  }

  return { kept, evicted }
}
