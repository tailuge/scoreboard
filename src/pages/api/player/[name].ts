import type { NextApiRequest, NextApiResponse } from "next"
import { kv } from "@vercel/kv"
import { PlayerRatingStore } from "@/services/PlayerRatingStore"
import { isValidGameType } from "@/utils/gameTypes"

export const config = { runtime: "nodejs" }

const store = new PlayerRatingStore(kv)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const name = req.query.name as string | undefined
  const ruleType = (req.query.ruleType as string | undefined) ?? "nineball"

  if (!name) {
    return res.status(400).end("Missing name")
  }

  if (!isValidGameType(ruleType)) {
    return res.status(400).end("Invalid ruleType")
  }

  const history = await store.getHistory(ruleType, name)

  // Sort history by date
  const sortedHistory = Object.entries(history)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, rating]) => ({ date, rating }))

  res.setHeader("Cache-Control", "public, s-maxage=30")
  return res.json(sortedHistory)
}
