import type { NextRequest } from "next/server"
import { kv } from "@vercel/kv"
import { corsJson } from "@/utils/cors"
import type { ClientLog, SessionEntry } from "@/types/client-log"

export const config = {
  runtime: "edge",
}

const LOGS_KEY = "logs:collection"
const MAX_SESSIONS = 50
const TTL_SECONDS = 259200

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body)) {
      return corsJson({ error: "Expected array" }, { status: 400 })
    }

    const logs: ClientLog[] = body
    const ua = req.headers.get("user-agent") || "Unknown"
    const region = req.headers.get("x-vercel-id")?.split("::")[0] || "unknown"
    const city = req.headers.get("x-vercel-ip-city") || undefined
    const country = req.headers.get("x-vercel-ip-country") || undefined

    const grouped = new Map<string, ClientLog[]>()
    for (const log of logs) {
      if (!log.sid) continue
      const existing = grouped.get(log.sid) || []
      const truncatedLog = {
        ...log,
        message: log.message?.slice(0, 2000),
        stack: log.stack?.slice(0, 2000),
        ua,
        region,
        city,
        country,
      }
      existing.push(truncatedLog)
      grouped.set(log.sid, existing)
    }

    const collection: SessionEntry[] = (await kv.get(LOGS_KEY)) || []
    const collectionMap = new Map(collection.map((s) => [s.sid, s]))

    for (const [sid, sessionLogs] of grouped) {
      const existing = collectionMap.get(sid)
      if (existing) {
        existing.logs.push(...sessionLogs)
        existing.ts = Math.max(existing.ts, ...sessionLogs.map((l) => l.ts))
        existing.ua = ua
        existing.city = city
        existing.country = country
        existing.region = region
      } else {
        collectionMap.set(sid, {
          sid,
          ua,
          ts: Math.max(...sessionLogs.map((l) => l.ts)),
          logs: sessionLogs,
          city,
          country,
          region,
        })
      }
    }

    const updated = Array.from(collectionMap.values())
    updated.sort((a, b) => b.ts - a.ts)
    const trimmed = updated.slice(0, MAX_SESSIONS)

    await kv.set(LOGS_KEY, trimmed, { ex: TTL_SECONDS })

    return corsJson({ ok: true })
  } catch {
    return corsJson({ ok: true })
  }
}

export default async function handler(req: NextRequest) {
  if (req.method === "POST") {
    return handlePost(req)
  }
  return corsJson({ error: "Use POST" }, { status: 405 })
}
