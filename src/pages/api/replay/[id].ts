import type { NextApiRequest, NextApiResponse } from "next"
import { Shortener } from "@/services/shortener"
import { logger } from "@/utils/logger"
import { kv } from "@vercel/kv"

export const config = {
  runtime: "nodejs",
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const id = req.query.id as string | undefined
  if (!id) {
    return res.status(400).end("ID is required")
  }
  const url = await new Shortener(kv).replay(id)
  const redirectUrl = new URL(url)
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== "id" && typeof value === "string") {
      redirectUrl.searchParams.set(key, value)
    }
  }
  logger.log(`redirecting to ${redirectUrl}`)
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=172800, stale-while-revalidate=86400"
  )
  return res.redirect(307, redirectUrl.toString())
}
