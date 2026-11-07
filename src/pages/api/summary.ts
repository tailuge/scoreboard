import type { NextApiRequest, NextApiResponse } from "next"
import { kv } from "@vercel/kv"
import { ScoreTable } from "@/services/scoretable"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { MatchResultService } from "@/services/MatchResultService"
import { VALID_RULE_TYPES } from "@/utils/gameTypes"
import { CORS_HEADERS } from "@/utils/cors"
import { markUsageFromServer } from "@/utils/usage"

export const config = {
  runtime: "nodejs",
}

const scoreTable = new ScoreTable(kv)
const playerRatingStore = new PlayerRatingStore(kv)
const matchResultService = new MatchResultService(kv)

// In-process cache for the leaderboard. Only recomputed hourly because
// getTopNBatch reads every player's rating for every rule type and grows with
// the player base. Node runtime shares this across warm invocations. Each
// limitElo value gets its own entry.
const TOP_PLAYERS_TTL_MS = 60 * 60 * 1000
const topPlayersCache = new Map<
  number,
  {
    value: Awaited<ReturnType<typeof playerRatingStore.getTopNBatch>>
    expiresAt: number
  }
>()

async function getCachedTopNBatch(limitElo: number) {
  const cached = topPlayersCache.get(limitElo)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value
  }
  const value = await playerRatingStore.getTopNBatch(
    VALID_RULE_TYPES as any,
    limitElo
  )
  topPlayersCache.set(limitElo, {
    value,
    expiresAt: Date.now() + TOP_PLAYERS_TTL_MS,
  })
  return value
}

// In-process cache for recent matches. Strips superfluous fields not used by the
// lobby (isbot, playerId, ua, browser, os, etc.) to minimize served bandwidth.
const RECENT_MATCHES_TTL_MS = 60 * 1000
export const recentMatchesCache = new Map<
  number,
  {
    value: ReturnType<typeof sanitizeRecentMatches>
    expiresAt: number
  }
>()

export function sanitizeMatchResult(match: any) {
  const sanitized: Record<string, unknown> = {
    id: match.id,
    winner: match.winner,
    winnerScore: match.winnerScore,
    ruleType: match.ruleType ?? "nineball",
    timestamp: match.timestamp,
  }

  if (match.loser !== undefined) sanitized.loser = match.loser
  if (match.loserScore !== undefined) sanitized.loserScore = match.loserScore
  if (match.hasReplay !== undefined) sanitized.hasReplay = match.hasReplay
  if (match.locationCountry !== undefined)
    sanitized.locationCountry = match.locationCountry
  if (match.locationCity !== undefined)
    sanitized.locationCity = match.locationCity
  if (match.arenaId !== undefined) sanitized.arenaId = match.arenaId
  if (match.tableSize !== undefined) sanitized.tableSize = match.tableSize
  if (match.freeaim !== undefined) sanitized.freeaim = match.freeaim
  if (match.berserk !== undefined) sanitized.berserk = match.berserk
  if (match.club !== undefined) sanitized.club = match.club
  if (match.card !== undefined) sanitized.card = match.card

  return sanitized
}

function sanitizeRecentMatches(
  matches: Awaited<ReturnType<typeof matchResultService.getMatchResults>>
) {
  return matches.map(sanitizeMatchResult)
}

async function getCachedRecentMatches(limitMatches: number) {
  const cached = recentMatchesCache.get(limitMatches)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value
  }
  const rawMatches = await matchResultService.getMatchResults(limitMatches)
  const value = sanitizeRecentMatches(rawMatches)
  recentMatchesCache.set(limitMatches, {
    value,
    expiresAt: Date.now() + RECENT_MATCHES_TTL_MS,
  })
  return value
}

// TEMPORARY diagnostics for Vercel fluid-compute investigation. Remove once we
// know where this route's budget goes. Deliberately uses console.log rather than
// logger.log: logger.enabled is derived from `typeof process`, which is fragile
// on the Edge runtime, and a silent no-op here would waste a deploy cycle.
const now = () => globalThis.performance?.now?.() ?? Date.now()
const TIMING = "[summary-timing]"

function logTiming(stage: string, detail: Record<string, unknown>) {
  console.log(`${TIMING} ${stage} ${JSON.stringify(detail)}`)
}

// Records how long a branch took without altering the value it resolves to, so
// the Promise.all below keeps its exact current shape and semantics.
function timed<T>(
  label: string,
  promise: Promise<T>,
  into: Record<string, number>
) {
  const startedAt = now()
  return promise.then((value) => {
    into[label] = Math.round(now() - startedAt)
    return value
  })
}

function setCorsHeaders(res: NextApiResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const limitElo = Number.parseInt((req.query.limitElo as string) || "10", 10)
  const limitMatches = Number.parseInt(
    (req.query.limitMatches as string) || "32",
    10
  )

  const startedAt = now()
  const parts: Record<string, number> = {}

  try {
    logTiming("start", { limitElo, limitMatches })

    markUsageFromServer("lobby").catch((err) =>
      console.error("Usage tracking error:", err)
    )

    const [hiscores, topPlayers, recentMatches] = await Promise.all([
      timed("hiscoresMs", scoreTable.topTenMulti(VALID_RULE_TYPES), parts),
      timed("topPlayersMs", getCachedTopNBatch(limitElo), parts),
      timed("recentMatchesMs", getCachedRecentMatches(limitMatches), parts),
    ])

    logTiming("done", {
      totalMs: Math.round(now() - startedAt),
      ...parts,
      hiscoreGames: Object.keys(hiscores).length,
      recentMatches: recentMatches.length,
    })

    setCorsHeaders(res)
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=60"
    )
    return res.json({ hiscores, topPlayers, recentMatches })
  } catch (error) {
    console.error("Error generating summary:", error)
    setCorsHeaders(res)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
