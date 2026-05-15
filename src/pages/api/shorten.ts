import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { Shortener } from "@/services/shortener"
import { logger } from "@/utils/logger"
import { corsResponse } from "@/utils/cors"

export const config = {
  runtime: "edge",
}

const shortener = new Shortener(kv)

export default async function handler(request: NextRequest) {
  try {
    const json = await request.json()
    logger.log(json)
    const body = await shortener.shorten(json)
    return corsResponse(JSON.stringify(body))
  } catch (error) {
    logger.error("Shorten API error:", error)
    return corsResponse("Request failed", { status: 400 })
  }
}
