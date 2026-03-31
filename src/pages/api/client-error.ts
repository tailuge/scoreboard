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

interface Metadata {
  ua?: string
  region?: string
  city?: string
  country?: string
}

function extractMetadataFromHeaders(req: NextRequest): Metadata {
  return {
    ua: req.headers.get("user-agent") || undefined,
    region: req.headers.get("x-vercel-id")?.split("::")[0] || undefined,
    city: req.headers.get("x-vercel-ip-city") || undefined,
    country: req.headers.get("x-vercel-ip-country") || undefined,
  }
}

function groupAndTruncateLogs(
  logs: ClientLog[],
  metadata: Metadata
): Map<string, ClientLog[]> {
  const grouped = new Map<string, ClientLog[]>()
  for (const log of logs) {
    if (!log.sid) continue
    const existing = grouped.get(log.sid) || []
    const truncatedLog = {
      ...log,
      message: log.message?.slice(0, 2000),
      stack: log.stack?.slice(0, 2000),
      ...metadata,
      version: log.version,
      origin: log.origin,
    }
    existing.push(truncatedLog)
    grouped.set(log.sid, existing)
  }
  return grouped
}

function updateExistingSession(
  existing: SessionEntry,
  sessionLogs: ClientLog[],
  metadata: Metadata
): void {
  existing.logs.push(...sessionLogs)
  existing.ts = Math.max(existing.ts, ...sessionLogs.map((l) => l.ts))
  if (metadata.ua) existing.ua = metadata.ua
  if (metadata.city) existing.city = metadata.city
  if (metadata.country) existing.country = metadata.country
  if (metadata.region) existing.region = metadata.region
  if (sessionLogs[0]?.version) existing.version = sessionLogs[0].version
  if (sessionLogs[0]?.origin) existing.origin = sessionLogs[0].origin
}

function createNewSession(
  sid: string,
  sessionLogs: ClientLog[],
  metadata: Metadata
): SessionEntry {
  return {
    sid,
    ua: metadata.ua || "",
    ts: Math.max(...sessionLogs.map((l) => l.ts)),
    logs: sessionLogs,
    city: metadata.city,
    country: metadata.country,
    region: metadata.region,
    version: sessionLogs[0]?.version,
    origin: sessionLogs[0]?.origin,
  }
}

function applyLogsToCollection(
  collectionMap: Map<string, SessionEntry>,
  groupedLogs: Map<string, ClientLog[]>,
  metadata: Metadata
): void {
  for (const [sid, sessionLogs] of groupedLogs) {
    const existing = collectionMap.get(sid)
    if (existing) {
      updateExistingSession(existing, sessionLogs, metadata)
    } else {
      collectionMap.set(sid, createNewSession(sid, sessionLogs, metadata))
    }
  }
}

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body)) {
      return corsJson({ error: "Expected array" }, { status: 400 })
    }

    const logs: ClientLog[] = body
    const metadata = extractMetadataFromHeaders(req)
    const grouped = groupAndTruncateLogs(logs, metadata)

    const collection: SessionEntry[] = (await kv.get(LOGS_KEY)) || []
    const collectionMap = new Map(collection.map((s) => [s.sid, s]))

    applyLogsToCollection(collectionMap, grouped, metadata)

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
