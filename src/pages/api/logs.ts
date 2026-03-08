import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { corsJson } from "@/utils/cors"

export const config = {
  runtime: "edge",
}

const LOGS_KEY = "logs:collection"

export default async function handler(req: NextRequest) {
  if (req.method !== "GET") {
    return corsJson({ error: "Use GET" }, { status: 405 })
  }

  const sessions = (await kv.get(LOGS_KEY)) || []
  return corsJson(sessions)
}
