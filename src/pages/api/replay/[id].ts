import { Shortener } from "@/services/shortener"
import { NextRequest } from "next/server"
import { logger } from "@/utils/logger"
import { kv } from "@vercel/kv"

export const config = {
  runtime: "nodejs",
}

export default async function handler(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")
  if (!id) {
    return new Response("ID is required", { status: 400 })
  }
  const url = await new Shortener(kv).replay(id)
  const redirectUrl = new URL(url)
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== "id") redirectUrl.searchParams.set(key, value)
  })
  logger.log(`redirecting to ${redirectUrl}`)
  const response = Response.redirect(redirectUrl.toString())
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=172800, stale-while-revalidate=86400"
  )
  return response
}
