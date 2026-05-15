import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { logger } from "@/utils/logger"
import { corsResponse, CORS_HEADERS } from "@/utils/cors"

export const config = {
  runtime: "edge",
}

const scoretable = new ScoreTable(kv)

export default async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ruletype = searchParams.get("ruletype")
  const id = searchParams.get("id")

  if (!ruletype || !id) {
    return corsResponse("ruletype and id are required", { status: 400 })
  }

  if (request.method === "GET") {
    let url
    try {
      url = await scoretable.get(ruletype, id)
    } catch (error) {
      logger.warn("Error fetching rank by id:", error)
      return corsResponse("Invalid ruletype", { status: 400 })
    }
    const dest = new URL(url)
    for (const [key, value] of searchParams.entries()) {
      if (key !== "ruletype" && key !== "id") {
        dest.searchParams.set(key, value)
      }
    }
    logger.log(`redirecting ${ruletype} id ${id} to ${dest}`)
    return new Response(null, {
      status: 302,
      headers: {
        Location: dest.toString(),
        ...CORS_HEADERS,
      },
    })
  }

  if (request.method === "PUT") {
    try {
      await scoretable.like(ruletype, id)
    } catch (error) {
      logger.warn("Error liking rank entry:", error)
      return corsResponse("Invalid ruletype", { status: 400 })
    }
    logger.log(`liked ${ruletype} id ${id}`)
  }

  return corsResponse(null, { status: 200 })
}
